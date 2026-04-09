import Link from "next/link";
import { getMonthlyRevenue, listLeads, listMasters } from "../lib/leads";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../lib/i18n";

export const dynamic = "force-dynamic";

type RevenueView = "week" | "month";

type HomePageProps = {
  searchParams?: Promise<{
    revenue?: string;
  }>;
};

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
      key,
      label: new Intl.DateTimeFormat(getLocaleTag(locale), {
        day: "numeric",
        month: "short",
      }).format(day),
      count,
    };
  });
}

function getRevenueForKey(leads: Awaited<ReturnType<typeof listLeads>>, key: string) {
  return leads.reduce((sum, lead) => {
    if (lead.status !== "DONE" || !lead.completedAt || getDateKey(lead.completedAt) !== key) {
      return sum;
    }

    return sum + (lead.finalPrice ?? 0);
  }, 0);
}

function getCompletedCountForKey(leads: Awaited<ReturnType<typeof listLeads>>, key: string) {
  return leads.filter(
    (lead) => lead.status === "DONE" && lead.completedAt && getDateKey(lead.completedAt) === key,
  ).length;
}

function getWeeklyRevenueSeries(
  leads: Awaited<ReturnType<typeof listLeads>>,
  locale: "ru" | "en",
) {
  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const key = getDateKey(day);

    return {
      key,
      label: new Intl.DateTimeFormat(getLocaleTag(locale), {
        day: "numeric",
        month: "short",
      }).format(day),
      revenue: getRevenueForKey(leads, key),
      count: getCompletedCountForKey(leads, key),
    };
  });
}

function getMonthlyRevenueSeries(
  leads: Awaited<ReturnType<typeof listLeads>>,
  locale: "ru" | "en",
) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: totalDays }, (_, index) => {
    const day = new Date(year, month, index + 1, 12, 0, 0);
    const key = getDateKey(day);

    return {
      key,
      label: new Intl.DateTimeFormat(getLocaleTag(locale), {
        day: "numeric",
      }).format(day),
      revenue: getRevenueForKey(leads, key),
      count: getCompletedCountForKey(leads, key),
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

function formatCurrency(value: number, locale: "ru" | "en") {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const params = (await searchParams) ?? {};
  const revenueView: RevenueView = params.revenue === "month" ? "month" : "week";

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
  const weeklyRevenueSeries = getWeeklyRevenueSeries(leads, locale);
  const monthlyRevenueSeries = getMonthlyRevenueSeries(leads, locale);
  const activeRevenueSeries =
    revenueView === "month" ? monthlyRevenueSeries : weeklyRevenueSeries;
  const highestSeriesValue = Math.max(...recentSeries.map((item) => item.count), 1);
  const highestRevenueValue = Math.max(...activeRevenueSeries.map((item) => item.revenue), 1);
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
  const peakRevenueDay = activeRevenueSeries.reduce(
    (best, item) => (item.revenue > best.revenue ? item : best),
    activeRevenueSeries[0] ?? { key: "", label: "-", revenue: 0, count: 0 },
  );
  const averageRevenue = activeRevenueSeries.length
    ? Math.round(
        activeRevenueSeries.reduce((sum, item) => sum + item.revenue, 0) /
          activeRevenueSeries.length,
      )
    : 0;
  const todayRevenue =
    activeRevenueSeries.find((item) => item.key === todayKey)?.revenue ?? 0;
  const totalCompletedInView = activeRevenueSeries.reduce((sum, item) => sum + item.count, 0);
  const isMonthlyRevenueView = revenueView === "month";
  const revenueGridColumns = `repeat(${activeRevenueSeries.length}, minmax(0, 1fr))`;

  const revenueText = {
    eyebrow: locale === "ru" ? "Выручка" : "Revenue",
    title: locale === "ru" ? "Доход за месяц" : "Monthly income",
    description:
      locale === "ru"
        ? "Большой блок показывает общую выручку за текущий месяц и динамику завершенных оплат по выбранному периоду."
        : "This block shows total revenue for the current month and the trend of completed payments for the selected period.",
    chartTitle:
      revenueView === "month"
        ? locale === "ru"
          ? "Выручка по дням текущего месяца"
          : "Revenue by day this month"
        : locale === "ru"
          ? "Выручка по дням за последние 7 дней"
          : "Revenue by day in the last 7 days",
    chartTotal: locale === "ru" ? "завершено" : "completed",
    peak: locale === "ru" ? "Лучший день" : "Best day",
    average: locale === "ru" ? "Среднее" : "Average",
    today: dict.home.chartToday,
    todayNote: locale === "ru" ? "выручка за день" : "revenue today",
    monthNote:
      locale === "ru"
        ? "Сумма завершенных заявок в текущем месяце"
        : "Total from completed leads in the current month",
    weekTab: locale === "ru" ? "7 дней" : "7 days",
    monthTab: locale === "ru" ? "Месяц" : "Month",
  };

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
      className: "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
    },
    {
      label: dict.home.metrics.booked[0],
      note: dict.home.metrics.booked[1],
      value: bookedLeads,
      className: "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
    },
    {
      label: dict.home.metrics.activeMasters[0],
      note: dict.home.metrics.activeMasters[1],
      value: activeMasters,
      className: "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]",
      noteClassName: "text-[color:var(--muted)]",
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

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="rounded-[2.35rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)] backdrop-blur-xl sm:p-9">
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
                <div key={item.key} className="flex h-full flex-1 flex-col justify-end gap-3">
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

      <section className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[2.15rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-7 shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.18em] text-[color:var(--muted)]">
                {dict.home.funnelTitle}
              </p>
            </div>
            <p className="text-sm text-[color:var(--foreground-soft)]">
              {dict.home.conversion}{" "}
              {leads.length === 0 ? "0%" : `${Math.round((completedLeads / leads.length) * 100)}%`}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                label: dict.status.NEW,
                value: leads.filter((lead) => lead.status === "NEW").length,
                tone: "bg-[#6e7dff]",
              },
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
                    style={{
                      width: `${Math.max(
                        10,
                        leads.length ? (item.value / leads.length) * 100 : 10,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.15rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(165deg,#10162d,#151c35)] p-8 text-white shadow-[var(--shadow-lg)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm tracking-[0.18em] text-white/48">{revenueText.eyebrow}</p>
              <h3
                className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {revenueText.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/65">{revenueText.description}</p>
            </div>

            <div className="flex w-full max-w-[360px] flex-col items-stretch gap-3 lg:w-[340px]">
              <div className="inline-flex self-start rounded-full border border-white/10 bg-white/5 p-1">
                {([
                  { value: "week", label: revenueText.weekTab },
                  { value: "month", label: revenueText.monthTab },
                ] as const).map((item) => {
                  const active = item.value === revenueView;

                  return (
                    <Link
                      key={item.value}
                      href={item.value === "week" ? "/" : "/?revenue=month"}
                      replace
                      scroll={false}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "border border-white/12 bg-white/10 text-white"
                          : "text-white/58 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="rounded-[1.7rem] border border-white/10 bg-white/6 px-6 py-5 text-right">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                  {revenueText.monthNote}
                </p>
                <p
                  className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {formatCurrency(monthlyRevenue, locale)} ₽
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <p className="text-sm tracking-[0.18em] text-white/48">{revenueText.chartTitle}</p>
              <div className="rounded-full bg-white/8 px-4 py-2 text-sm font-medium text-white/72">
                {totalCompletedInView} {revenueText.chartTotal}
              </div>
            </div>

            <div className="mt-7">
              <div
                className={`grid h-[270px] items-end ${
                  isMonthlyRevenueView ? "gap-2" : "gap-3"
                }`}
                style={{ gridTemplateColumns: revenueGridColumns }}
              >
                {activeRevenueSeries.map((item) => {
                  const height = Math.max(12, (item.revenue / highestRevenueValue) * 100);

                  return (
                    <div key={item.key} className="flex h-full min-w-0 flex-col justify-end gap-3">
                      <div
                        className={`text-center font-semibold text-white/62 ${
                          isMonthlyRevenueView ? "text-[10px]" : "text-[11px]"
                        }`}
                      >
                        {item.revenue > 0 ? `${formatCurrency(item.revenue, locale)} ₽` : ""}
                      </div>
                      <div
                        className={`relative flex-1 bg-white/5 ${
                          isMonthlyRevenueView
                            ? "rounded-[1.15rem] p-1.5"
                            : "rounded-[1.7rem] p-2"
                        }`}
                      >
                        <div
                          className={`absolute bg-[linear-gradient(180deg,#7a8bff,#5568ff)] shadow-[0_18px_40px_rgba(91,109,255,0.24)] ${
                            isMonthlyRevenueView
                              ? "inset-x-1.5 bottom-1.5 rounded-[0.95rem]"
                              : "inset-x-2 bottom-2 rounded-[1.15rem]"
                          }`}
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div
                        className={`text-center tracking-[0.12em] text-white/45 ${
                          isMonthlyRevenueView ? "text-[10px]" : "text-[11px]"
                        }`}
                      >
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-3">
            {[
              {
                label: revenueText.peak,
                value: peakRevenueDay.label,
                note:
                  peakRevenueDay.revenue > 0
                    ? `${formatCurrency(peakRevenueDay.revenue, locale)} ₽`
                    : "0 ₽",
              },
              {
                label: revenueText.average,
                value: `${formatCurrency(averageRevenue, locale)} ₽`,
                note: revenueText.monthNote,
              },
              {
                label: revenueText.today,
                value: `${formatCurrency(todayRevenue, locale)} ₽`,
                note: revenueText.todayNote,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.45rem] border border-white/10 bg-white/6 px-4 py-4"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
                  {item.label}
                </p>
                <p
                  className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-sm text-white/62">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
