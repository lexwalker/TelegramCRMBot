import Link from "next/link";
import { StatusBadge } from "../../components/status-badge";
import { listActiveMasters, listLeads } from "../../lib/leads";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../../lib/i18n";

export const dynamic = "force-dynamic";

const WEEKDAY_BASE = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_SLOT_MINUTES = 60;

type CalendarPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

function getDateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
  }).format(date);
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getTodayKey() {
  return getDateKey(new Date());
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function getWeekday(dateKey: string) {
  return new Date(`${dateKey}T12:00:00+03:00`).getUTCDay();
}

function formatHumanDate(dateKey: string, locale: "ru" | "en") {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(`${dateKey}T00:00:00+03:00`));
}

function formatMonthLabel(dateKey: string, locale: "ru" | "en") {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(new Date(`${dateKey}T00:00:00+03:00`));
}

function shiftMonth(dateKey: string, shiftMonths: number) {
  const selected = parseDateKey(dateKey);
  const originalDay = selected.getUTCDate();
  const next = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1, 12));
  next.setUTCMonth(next.getUTCMonth() + shiftMonths);

  const daysInTargetMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  next.setUTCDate(Math.min(originalDay, daysInTargetMonth));
  return getDateKey(next);
}

function isSameDay(appointmentAt: string | null, dateKey: string) {
  if (!appointmentAt) {
    return false;
  }

  return getDateKey(new Date(appointmentAt)) === dateKey;
}

function getMonthDays(selectedDate: string) {
  const selected = parseDateKey(selectedDate);
  const monthStart = new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1, 12));
  const startOffset = (monthStart.getUTCDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(gridStart.getUTCDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart);
    current.setUTCDate(gridStart.getUTCDate() + index);

    return {
      key: getDateKey(current),
      dayNumber: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === selected.getUTCMonth(),
    };
  });
}

function getLeadCountByDate(leads: Awaited<ReturnType<typeof listLeads>>) {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    if (!lead.appointmentAt) {
      continue;
    }

    const key = getDateKey(new Date(lead.appointmentAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function getWeekdayLabels(locale: "ru" | "en") {
  const monday = new Date(Date.UTC(2026, 0, 5, 12));

  return WEEKDAY_BASE.map((offset) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + offset);
    return new Intl.DateTimeFormat(getLocaleTag(locale), { weekday: "short" }).format(day);
  });
}

function getDaySlots(
  dateKey: string,
  activeMasters: Awaited<ReturnType<typeof listActiveMasters>>,
) {
  const weekday = getWeekday(dateKey);
  const slots = new Set<string>();

  for (const master of activeMasters) {
    const schedule = master.weeklySchedule.find((day) => day.dayOfWeek === weekday);

    if (!schedule?.isWorking) {
      continue;
    }

    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);

    for (
      let current = start;
      current + DEFAULT_SLOT_MINUTES <= end;
      current += DEFAULT_SLOT_MINUTES
    ) {
      slots.add(minutesToTime(current));
    }
  }

  return [...slots].sort((left, right) => timeToMinutes(left) - timeToMinutes(right));
}

function overlapsSlot(
  appointmentAt: string,
  slotTime: string,
  durationMinutes: number,
) {
  const appointmentStart = timeToMinutes(appointmentAt.slice(11, 16));
  const appointmentEnd = appointmentStart + durationMinutes;
  const slotStart = timeToMinutes(slotTime);
  const slotEnd = slotStart + DEFAULT_SLOT_MINUTES;

  return appointmentStart < slotEnd && slotStart < appointmentEnd;
}

function getSlotLeadMap(
  dateKey: string,
  slots: string[],
  leads: Awaited<ReturnType<typeof listLeads>>,
) {
  const dayLeads = leads.filter((lead) => isSameDay(lead.appointmentAt, dateKey));

  return new Map(
    slots.map((slot) => [
      slot,
      dayLeads.filter((lead) =>
        lead.appointmentAt
          ? overlapsSlot(
              lead.appointmentAt,
              slot,
              lead.service?.durationMinutes ?? DEFAULT_SLOT_MINUTES,
            )
          : false,
      ),
    ]),
  );
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedDate = resolvedSearchParams.date ?? getTodayKey();
  const [leads, activeMasters] = await Promise.all([listLeads(), listActiveMasters()]);
  const activeMasterCount = activeMasters.length;
  const dayLeads = leads.filter((lead) => isSameDay(lead.appointmentAt, selectedDate));
  const todayKey = getTodayKey();
  const monthDays = getMonthDays(selectedDate);
  const leadCountByDate = getLeadCountByDate(leads);
  const previousMonth = shiftMonth(selectedDate, -1);
  const nextMonth = shiftMonth(selectedDate, 1);
  const weekdayLabels = getWeekdayLabels(locale);
  const daySlots = getDaySlots(selectedDate, activeMasters);
  const selectedDaySlotLeadMap = getSlotLeadMap(selectedDate, daySlots, leads);

  const slotSummaries = daySlots.map((slot) => {
    const slotLeads = selectedDaySlotLeadMap.get(slot) ?? [];

    return {
      slot,
      leads: slotLeads,
      occupiedCount: slotLeads.length,
      remainingCount: Math.max(activeMasterCount - slotLeads.length, 0),
    };
  });

  const freeSlots = slotSummaries.filter((slot) => slot.occupiedCount < activeMasterCount).length;
  const bookedCapacity = slotSummaries.reduce((sum, slot) => sum + slot.occupiedCount, 0);
  const totalCapacity = activeMasterCount * daySlots.length;
  const utilization = totalCapacity ? Math.round((bookedCapacity / totalCapacity) * 100) : 0;
  const stats = [
    { label: dict.calendar.appointmentCount, value: dayLeads.length },
    { label: dict.calendar.masterCount, value: activeMasterCount },
    { label: dict.calendar.freeCount, value: freeSlots },
    { label: dict.calendar.utilization, value: `${utilization}%` },
  ];

  const monthCells = monthDays.map((day) => {
    const slotsForDay = getDaySlots(day.key, activeMasters);
    const slotLeadMap = getSlotLeadMap(day.key, slotsForDay, leads);
    const slotStates = slotsForDay.map((slot) => {
      const slotLeads = slotLeadMap.get(slot) ?? [];

      return {
        slot,
        isBusy: slotLeads.length > 0,
        isFull: activeMasterCount > 0 && slotLeads.length >= activeMasterCount,
      };
    });
    const freeCountByDay = slotStates.filter((slot) => !slot.isFull).length;
    const leadCount = leadCountByDate.get(day.key) ?? 0;

    return {
      ...day,
      leadCount,
      freeCountByDay,
      slotStates,
    };
  });

  return (
    <main className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.36fr_0.64fr]">
        <div className="rounded-[1.95rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-md)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 border-b border-[color:var(--border-soft)] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm tracking-[0.16em] text-[color:var(--muted)]">{dict.calendar.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)] sm:text-[2.2rem]" style={{ fontFamily: "var(--font-heading)" }}>
                {formatMonthLabel(selectedDate, locale)}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">{dict.calendar.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={`/calendar?date=${previousMonth}`} className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3.5 py-2.5 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                {dict.calendar.previousMonth}
              </Link>
              <Link href={`/calendar?date=${todayKey}`} className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-3.5 py-2.5 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]">
                {dict.calendar.today}
              </Link>
              <Link href={`/calendar?date=${nextMonth}`} className="inline-flex items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3.5 py-2.5 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                {dict.calendar.nextMonth}
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-1 py-2 text-center text-[11px] font-semibold tracking-[0.16em] text-[color:var(--muted)]">
                {label}
              </div>
            ))}

            {monthCells.map((day) => {
              const isSelected = day.key === selectedDate;
              const isToday = day.key === todayKey;
              const isFullDay = day.leadCount > 0 && activeMasterCount > 0 && day.freeCountByDay === 0;

              return (
                <Link
                  key={day.key}
                  href={`/calendar?date=${day.key}`}
                  className={`flex min-h-[96px] flex-col rounded-[1.2rem] border p-2.5 transition duration-200 ${
                    isSelected
                      ? "border-[color:var(--accent-strong)] bg-[linear-gradient(180deg,#6a7cff,#5366ff)] text-[color:var(--accent-foreground)] shadow-[0_14px_30px_rgba(91,109,255,0.2)]"
                      : day.isCurrentMonth
                        ? "border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] hover:border-[color:var(--accent-soft)]"
                        : "border-[color:var(--border-soft)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:border-[color:var(--accent-soft)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`text-sm font-semibold ${isSelected ? "text-[color:var(--accent-foreground)]" : "text-[color:var(--foreground)]"}`}>
                      {day.dayNumber}
                    </div>

                    {isToday ? (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] ${isSelected ? "bg-white/16 text-[color:var(--accent-foreground-soft)]" : "bg-[color:var(--surface-contrast)] text-[color:var(--accent-strong)]"}`}>
                        {dict.calendar.today}
                      </span>
                    ) : day.leadCount > 0 ? (
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isSelected ? "bg-white/16 text-[color:var(--accent-foreground-soft)]" : "bg-[color:var(--surface-muted)] text-[color:var(--foreground-soft)]"}`}>
                        {day.leadCount}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-center gap-1">
                      {day.slotStates.length === 0 ? (
                        <span className={`h-1.5 flex-1 rounded-full ${isSelected ? "bg-white/20" : "bg-black/8"}`} />
                      ) : (
                        day.slotStates.slice(0, 6).map((slot) => (
                          <span
                            key={`${day.key}-${slot.slot}`}
                            className={`h-1.5 flex-1 rounded-full ${
                              isSelected
                                ? slot.isFull
                                  ? "bg-[rgba(255,207,152,0.94)]"
                                  : slot.isBusy
                                    ? "bg-white"
                                    : "bg-white/20"
                                : slot.isFull
                                  ? "bg-[color:var(--warning)]"
                                  : slot.isBusy
                                    ? "bg-[color:var(--accent)]"
                                    : "bg-black/8"
                            }`}
                          />
                        ))
                      )}
                    </div>

                    <div className={`mt-2 text-[11px] leading-4 ${isSelected ? "text-[color:var(--accent-foreground-soft)]" : isFullDay ? "text-[color:var(--danger)]" : "text-[color:var(--foreground-soft)]"}`}>
                      {day.leadCount === 0 ? dict.calendar.free : isFullDay ? dict.calendar.dayFull : `${day.freeCountByDay} ${dict.calendar.monthFreeShort}`}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.95rem] border border-[color:var(--border)] bg-[linear-gradient(165deg,#10162d,#151c35)] p-6 text-white shadow-[var(--shadow-lg)]">
            <p className="text-sm tracking-[0.16em] text-white/48">{dict.calendar.selectedDate}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-white" style={{ fontFamily: "var(--font-heading)" }}>
              {formatHumanDate(selectedDate, locale)}
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-[1.2rem] border border-white/10 bg-white/8 p-3.5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.95rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-md)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm tracking-[0.16em] text-[color:var(--muted)]">{dict.calendar.slotsOfDay}</p>
                <h3 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                  {dict.calendar.summary}
                </h3>
              </div>
              <div className="rounded-full bg-[color:var(--surface-contrast)] px-3 py-1.5 text-sm font-medium text-[color:var(--accent-strong)]">
                {bookedCapacity}
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {slotSummaries.length === 0 ? (
                <div className="rounded-[1.2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--foreground-soft)]">
                  {locale === "ru" ? "На этот день пока не задано рабочих часов." : "No working hours are configured for this day yet."}
                </div>
              ) : (
                slotSummaries.map((slot) => {
                  const progress = activeMasterCount ? Math.round((slot.occupiedCount / activeMasterCount) * 100) : 0;
                  const fillWidth = slot.occupiedCount === 0 ? 10 : Math.max(14, progress);

                  return (
                    <div key={slot.slot} className="rounded-[1.2rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">{slot.slot}</p>
                        <p className="text-xs text-[color:var(--foreground-soft)]">{slot.occupiedCount}/{activeMasterCount || 0}</p>
                      </div>
                    <div className="mt-2 h-2 rounded-full bg-[color:var(--surface-strong)]">
                        <div
                          className={`h-full rounded-full ${slot.occupiedCount === 0 ? "bg-[color:var(--success)]" : slot.remainingCount === 0 ? "bg-[color:var(--warning)]" : "bg-[color:var(--accent)]"}`}
                          style={{ width: `${fillWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </section>

      <section className="space-y-3">
        <div className="rounded-[1.95rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm tracking-[0.16em] text-[color:var(--muted)]">{dict.calendar.daySchedule}</p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                {formatHumanDate(selectedDate, locale)}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                `${dayLeads.length} ${dict.calendar.appointmentCount}`,
                `${freeSlots} ${dict.calendar.freeCount.toLowerCase()}`,
                `${activeMasterCount} ${dict.calendar.masterCount.toLowerCase()}`,
              ].map((item) => (
                <span key={item} className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-sm text-[color:var(--foreground-soft)]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {slotSummaries.length === 0 ? (
            <article className="rounded-[1.7rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-md)]">
              <p className="text-sm leading-7 text-[color:var(--foreground-soft)]">
                {locale === "ru"
                  ? "На выбранный день у мастеров нет рабочих часов. Добавьте график на странице мастеров."
                  : "Staff have no working hours for the selected day. Add a schedule on the staff page."}
              </p>
            </article>
          ) : (
            slotSummaries.map((slot) => {
              const occupiedCount = slot.occupiedCount;
              const isBusy = occupiedCount > 0;
              const isFull = activeMasterCount > 0 && occupiedCount >= activeMasterCount;
              const progress = activeMasterCount > 0 ? `${Math.min(100, Math.round((occupiedCount / activeMasterCount) * 100))}%` : "0%";

              return (
                <article
                  key={slot.slot}
                className={`rounded-[1.7rem] border shadow-[var(--shadow-md)] ${isBusy ? "border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface-muted))]" : "border-[rgba(53,201,120,0.16)] bg-[linear-gradient(180deg,var(--surface-strong),rgba(67,211,137,0.06))]"}`}
                >
                  <div className="grid gap-4 p-4 lg:grid-cols-[180px_1fr]">
                    <div className="rounded-[1.3rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] p-4">
                      <div className="flex items-center justify-between gap-3 lg:block">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{dict.common.time}</p>
                          <h4 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                            {slot.slot}
                          </h4>
                        </div>

                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${isFull ? "border-[rgba(255,189,99,0.2)] bg-[color:var(--warning-soft)] text-[#d98924]" : isBusy ? "border-[rgba(91,109,255,0.16)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]" : "border-[rgba(53,201,120,0.18)] bg-[color:var(--success-soft)] text-[color:var(--success)]"}`}>
                          {isFull ? dict.calendar.full : isBusy ? dict.calendar.partial : dict.calendar.free}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-[color:var(--foreground-soft)]">
                          <span>{dict.calendar.slotLoad}</span>
                          <span>{occupiedCount}/{activeMasterCount}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/8">
                          <div className={`h-full rounded-full ${isFull ? "bg-[color:var(--warning)]" : isBusy ? "bg-[color:var(--accent)]" : "bg-[color:var(--success)]"}`} style={{ width: progress }} />
                        </div>
                      </div>
                    </div>

                    {!isBusy ? (
                      <div className="rounded-[1.35rem] border border-dashed border-[rgba(53,201,120,0.22)] bg-[color:var(--surface-strong)] p-4 text-sm leading-6 text-[color:var(--foreground-soft)]">
                        {dict.calendar.noSlotBookings}
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {slot.leads.map((lead) => (
                          <div key={`${slot.slot}-${lead.id}`} className="rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <h5 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                                    {lead.name}
                                  </h5>
                                  <StatusBadge status={lead.status} locale={locale} />
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-sm text-[color:var(--foreground-soft)]">
                                  <span>{lead.phone}</span>
                                  <span>•</span>
                                  <span>{dict.common.master}: {lead.master?.name ?? dict.common.noMaster}</span>
                                  <span>•</span>
                                  <span>{lead.service?.name ?? (locale === "ru" ? "Без услуги" : "No service")}</span>
                                </div>
                                <p className="mt-2 line-clamp-2 text-sm leading-6 text-[color:var(--foreground-soft)]">{lead.comment}</p>
                              </div>

                              <Link href={`/leads/${lead.id}`} className="inline-flex items-center justify-center rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]">
                                {dict.common.openLead}
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
