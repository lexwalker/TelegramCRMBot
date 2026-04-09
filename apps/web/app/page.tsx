import Link from "next/link";
import { getMonthlyRevenue, listLeads, listMasters } from "../lib/leads";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../lib/i18n";

export const dynamic = "force-dynamic";

function getDateKey(value: string | Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function getRecentSeries(
  leads: Awaited<ReturnType<typeof listLeads>>,
  locale: "ru" | "en",
) {
  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const key = getDateKey(day);
    const count = leads.filter((lead) => getDateKey(lead.createdAt) === key).length;

    return {
      label: new Intl.DateTimeFormat(getLocaleTag(locale), {
        day: "numeric",
        month: "short",
      }).format(day),
      count,
    };
  });
}

function formatAppointment(value: string, locale: "ru" | "en") {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

export default async function HomePage() {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const [leads, masters, monthlyRevenue] = await Promise.all([
    listLeads(),
    listMasters(),
    getMonthlyRevenue(),
  ]);
  const bookedLeads = leads.filter((lead) => Boolean(lead.appointmentAt)).length;
  const activeLeads = leads.filter((lead) => lead.status === "IN_PROGRESS").length;
  const completedLeads = leads.filter((lead) => lead.status === "DONE").length;
  const activeMasters = masters.filter((master) => master.isActive).length;
  const recentSeries = getRecentSeries(leads, locale);
  const highestSeriesValue = Math.max(...recentSeries.map((item) => item.count), 1);
  const todayKey = getDateKey(new Date());
  const todayAppointments = leads.filter(
    (lead) => lead.appointmentAt && getDateKey(lead.appointmentAt) === todayKey,
  ).length;
  const nextAppointment = leads
    .filter((lead) => lead.appointmentAt)
    .sort(
      (left, right) =>
        new Date(left.appointmentAt as string).getTime() -
        new Date(right.appointmentAt as string).getTime(),
    )
    .find((lead) => new Date(lead.appointmentAt as string).getTime() >= Date.now());
  const peakDay = recentSeries.reduce(
    (best, item) => (item.count > best.count ? item : best),
    recentSeries[0] ?? { label: "-", count: 0 },
  );
  const averagePerDay = recentSeries.length
    ? (recentSeries.reduce((sum, item) => sum + item.count, 0) / recentSeries.length).toFixed(1)
    : "0.0";

  const metricCards = [
    {
      label: dict.home.metrics.totalLeads[0],
      note: dict.home.metrics.totalLeads[1],
      value: leads.length,
      className: "bg-[linear-gradient(135deg,#6577ff,#8da0ff)] text-white",
      noteClassName: "text-white/72",
    },
    {
      label: dict.home.metrics.inProgress[0],
      note: dict.home.metrics.inProgress[1],
      value: activeLeads,
      className: "bg-white text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
    },
    {
      label: dict.home.metrics.booked[0],
      note: dict.home.metrics.booked[1],
      value: bookedLeads,
      className: "bg-white text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
    },
    {
      label: dict.home.metrics.activeMasters[0],
      note: dict.home.metrics.activeMasters[1],
      value: activeMasters,
      className: "bg-white text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
    },
    {
      label: locale === "ru" ? "Выручка за месяц" : "Monthly revenue",
      note:
        locale === "ru"
          ? "Сумма завершенных заявок"
          : "Revenue from completed leads",
      value: `${monthlyRevenue} ₽`,
      className: "bg-white text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
    },
  ];

  const actionLinks = [
    { href: "/leads", label: dict.home.links.leads[0], note: dict.home.links.leads[1] },
    {
      href: "/calendar",
      label: dict.home.links.calendar[0],
      note: dict.home.links.calendar[1],
    },
    {
      href: "/masters",
      label: dict.home.links.masters[0],
      note: dict.home.links.masters[1],
    },
  ];

  return (
    <main className="space-y-6">
      <section className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <div className="overflow-hidden rounded-[2.35rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(160deg,#10162d,#171d37)] p-8 text-white shadow-[var(--shadow-lg)] sm:p-9">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/58">
                {dict.home.eyebrow}
              </div>
              <h1
                className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {dict.home.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-white/68 sm:text-base">
                {dict.home.description}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                {dict.home.focus}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {nextAppointment ? nextAppointment.name : dict.home.noFocus}
              </p>
              <p className="mt-2 text-sm text-white/62">
                {nextAppointment?.appointmentAt
                  ? formatAppointment(nextAppointment.appointmentAt, locale)
                  : dict.home.noFocusText}
              </p>
            </div>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {metricCards.map((card) => (
              <article
                key={card.label}
                className={`rounded-[1.75rem] border border-white/8 p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] ${card.className}`}
              >
                <p className="text-sm">{card.label}</p>
                <p
                  className="mt-8 text-4xl font-semibold tracking-[-0.05em]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {card.value}
                </p>
                <p className={`mt-4 text-sm leading-6 ${card.noteClassName}`}>{card.note}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[2.35rem] border border-[color:var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-[var(--shadow-md)] backdrop-blur-xl sm:p-9">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm tracking-[0.18em] text-[color:var(--muted)]">
                {dict.home.chartTitle}
              </p>
            </div>
            <div className="rounded-full bg-[color:var(--surface-contrast)] px-4 py-2 text-sm font-medium text-[color:var(--accent-strong)]">
              {leads.length} {dict.home.chartTotal}
            </div>
          </div>

          <div className="mt-8 flex h-[290px] items-end gap-3">
            {recentSeries.map((item) => {
              const height = Math.max(16, (item.count / highestSeriesValue) * 100);

              return (
                <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-3">
                  <div className="text-center text-[11px] font-semibold text-[color:var(--foreground-soft)]">
                    {item.count}
                  </div>
                  <div className="relative flex-1 rounded-[1.7rem] bg-[linear-gradient(180deg,rgba(91,109,255,0.08),rgba(91,109,255,0.03))] p-2">
                    <div
                      className="absolute inset-x-2 bottom-2 rounded-[1.15rem] bg-[linear-gradient(180deg,#7a8bff,#5568ff)] shadow-[0_18px_40px_rgba(91,109,255,0.24)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <div className="text-center text-[11px] tracking-[0.16em] text-[color:var(--muted)]">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              { label: dict.home.chartPeak, value: peakDay.label, note: String(peakDay.count) },
              { label: dict.home.chartAverage, value: averagePerDay, note: dict.home.chartTotal },
              { label: dict.home.chartToday, value: String(todayAppointments), note: dict.home.chartTodayNote },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.45rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-4 py-4"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr_0.92fr]">
        <div className="rounded-[2.15rem] border border-[color:var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.18em] text-[color:var(--muted)]">{dict.home.funnelTitle}</p>
            </div>
            <p className="text-sm text-[color:var(--foreground-soft)]">
              {dict.home.conversion} {leads.length === 0 ? "0%" : `${Math.round((completedLeads / leads.length) * 100)}%`}
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {[
              { label: dict.status.NEW, value: leads.filter((lead) => lead.status === "NEW").length, tone: "bg-[#6e7dff]" },
              { label: dict.status.IN_PROGRESS, value: activeLeads, tone: "bg-[#ffb85e]" },
              { label: dict.status.DONE, value: completedLeads, tone: "bg-[#35c978]" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-[color:var(--foreground)]">{item.label}</span>
                  <span className="text-[color:var(--foreground-soft)]">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-[color:var(--surface-contrast)]">
                  <div
                    className={`h-full rounded-full ${item.tone}`}
                    style={{ width: `${Math.max(10, leads.length ? (item.value / leads.length) * 100 : 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.15rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(165deg,#10162d,#151c35)] p-8 text-white shadow-[var(--shadow-lg)]">
          <p className="text-sm tracking-[0.18em] text-white/48">{dict.home.dayFocus}</p>
          <h3
            className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {nextAppointment ? nextAppointment.name : dict.home.noFocus}
          </h3>
          <p className="mt-3 text-sm leading-7 text-white/65">
            {nextAppointment?.appointmentAt
              ? formatAppointment(nextAppointment.appointmentAt, locale)
              : dict.home.noFocusText}
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[
              { label: dict.home.chartToday, value: todayAppointments },
              { label: dict.home.metrics.activeMasters[0], value: activeMasters },
              { label: dict.home.metrics.inProgress[0], value: activeLeads },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{item.label}</p>
                <p
                  className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.15rem] border border-[color:var(--border)] bg-[rgba(255,255,255,0.92)] p-8 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <p className="text-sm tracking-[0.18em] text-[color:var(--muted)]">{dict.home.quickLinks}</p>
          <div className="mt-6 space-y-3">
            {actionLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[1.5rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-4 py-4 transition hover:border-[color:var(--accent-soft)] hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">{item.label}</p>
                    <p className="mt-1 text-sm text-[color:var(--foreground-soft)]">{item.note}</p>
                  </div>
                  <span className="text-xl text-[color:var(--accent-strong)]">↗</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-6 rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,#ffffff,#f4f7ff)] p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {dict.home.teamCard}
            </p>
            <div className="mt-3 flex items-end gap-3">
              <p
                className="text-4xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {activeMasters}
              </p>
              <p className="pb-1 text-sm text-[color:var(--foreground-soft)]">
                {dict.home.teamCardText} {masters.length}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
