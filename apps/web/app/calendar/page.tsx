import Link from "next/link";
import { listActiveMasters, listLeads } from "../../lib/leads";
import { StatusBadge } from "../../components/status-badge";

export const dynamic = "force-dynamic";

const TIME_SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00"] as const;
const TIMEZONE = "Europe/Moscow";

type CalendarPageProps = {
  searchParams?: Promise<{
    date?: string;
  }>;
};

function getDateKey(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
  }).format(date);
}

function getTodayKey() {
  return getDateKey(new Date());
}

function formatHumanDate(dateKey: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(new Date(`${dateKey}T00:00:00+03:00`));
}

function getNeighborDateKey(dateKey: string, shiftDays: number) {
  const date = new Date(`${dateKey}T00:00:00+03:00`);
  date.setUTCDate(date.getUTCDate() + shiftDays);
  return getDateKey(date);
}

function getTimeLabel(appointmentAt: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIMEZONE,
  }).format(new Date(appointmentAt));
}

function isSameDay(appointmentAt: string | null, dateKey: string) {
  if (!appointmentAt) {
    return false;
  }

  return getDateKey(new Date(appointmentAt)) === dateKey;
}

function getSlotLeads(
  leads: Awaited<ReturnType<typeof listLeads>>,
  dateKey: string,
  slot: string,
) {
  return leads.filter((lead) => {
    if (!isSameDay(lead.appointmentAt, dateKey) || !lead.appointmentAt) {
      return false;
    }

    return getTimeLabel(lead.appointmentAt) === slot;
  });
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedDate = resolvedSearchParams.date ?? getTodayKey();
  const leads = await listLeads();
  const activeMasters = await listActiveMasters();
  const activeMasterCount = activeMasters.length;
  const dayLeads = leads.filter((lead) => isSameDay(lead.appointmentAt, selectedDate));
  const previousDate = getNeighborDateKey(selectedDate, -1);
  const nextDate = getNeighborDateKey(selectedDate, 1);

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              Календарь
            </p>
            <h2 className="mt-2 text-3xl font-semibold">
              Записи на {formatHumanDate(selectedDate)}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              В слоте может быть несколько записей, пока не заняты все активные мастера.
            </p>
          </div>

          <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`/calendar?date=${previousDate}`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              ← Предыдущий день
            </Link>

            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
            />

            <button
              type="submit"
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              Показать день
            </button>

            <Link
              href={`/calendar?date=${nextDate}`}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Следующий день →
            </Link>
          </form>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Всего записей
            </p>
            <p className="mt-2 text-2xl font-semibold">{dayLeads.length}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Активных мастеров
            </p>
            <p className="mt-2 text-2xl font-semibold">{activeMasterCount}</p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Свободных слотов
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {TIME_SLOTS.filter(
                (slot) => getSlotLeads(leads, selectedDate, slot).length < activeMasterCount,
              ).length}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              День просмотра
            </p>
            <p className="mt-2 text-lg font-semibold">{selectedDate}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {TIME_SLOTS.map((slot) => {
          const slotLeads = getSlotLeads(leads, selectedDate, slot);
          const occupiedCount = slotLeads.length;
          const isBusy = occupiedCount > 0;
          const isFull = activeMasterCount > 0 && occupiedCount >= activeMasterCount;

          return (
            <article
              key={slot}
              className={`rounded-[2rem] border p-6 shadow-sm ${
                isBusy
                  ? "border-[var(--border)] bg-[var(--surface)]"
                  : "border-dashed border-[#bfd7cd] bg-[#f6fbf8]"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Время
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{slot}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Занято мастеров: {occupiedCount} из {activeMasterCount}
                  </p>
                </div>

                {isBusy ? (
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium text-white ${
                      isFull ? "bg-[#d96c4a]" : "bg-[#2c8f6d]"
                    }`}
                  >
                    {isFull ? "Полностью занято" : "Есть свободный мастер"}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-[#d8eee3] px-3 py-1 text-sm font-medium text-[#125b50]">
                    Свободно
                  </span>
                )}
              </div>

              {!isBusy ? (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  На этот слот пока нет записей.
                </p>
              ) : (
                <div className="mt-5 space-y-4">
                  {slotLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-3xl border border-[var(--border)] bg-white/80 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="text-lg font-semibold">{lead.name}</h4>
                          <p className="mt-1 text-sm text-[var(--muted)]">{lead.phone}</p>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            Мастер: {lead.master?.name ?? "Не назначен"}
                          </p>
                        </div>
                        <StatusBadge status={lead.status} />
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm leading-6">{lead.comment}</p>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                        <p className="text-sm text-[var(--muted)]">Слот занят этой заявкой</p>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm text-[var(--accent-foreground)] transition hover:opacity-90"
                        >
                          Открыть заявку
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
