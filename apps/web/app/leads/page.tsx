import Link from "next/link";
import { getLeads } from "../../lib/leads";
import { StatusBadge } from "../../components/status-badge";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../../lib/i18n";

export const dynamic = "force-dynamic";

function formatAppointment(value: string | null, locale: "ru" | "en", fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

export default async function LeadsPage() {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const result = await getLeads();

  const stats = result.ok
    ? [
        { label: dict.leads.newLeads, value: result.leads.filter((lead) => lead.status === "NEW").length, tone: "bg-[linear-gradient(135deg,#7184ff,#9aa7ff)] text-white" },
        { label: dict.leads.inProgress, value: result.leads.filter((lead) => lead.status === "IN_PROGRESS").length, tone: "bg-[linear-gradient(135deg,#ffb258,#ffd37a)] text-[color:var(--foreground)]" },
        { label: dict.leads.booked, value: result.leads.filter((lead) => Boolean(lead.appointmentAt)).length, tone: "bg-[linear-gradient(135deg,#53d48f,#90efb7)] text-[color:var(--foreground)]" },
        { label: dict.leads.done, value: result.leads.filter((lead) => lead.status === "DONE").length, tone: "bg-white text-[color:var(--foreground)]" },
      ]
    : [];

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">{dict.leads.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {dict.leads.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">
              {dict.leads.description}
            </p>
          </div>

          <div className="rounded-full bg-white/8 px-5 py-3 text-sm font-medium text-white/72">
            {result.ok ? `${result.leads.length} ${dict.leads.totalCards}` : dict.leads.dbTitle}
          </div>
        </div>
      </section>

      {!result.ok ? (
        <section className="rounded-[2rem] border border-[color:var(--danger-soft)] bg-white p-6 shadow-[var(--shadow-md)]">
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{dict.leads.dbTitle}</h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-soft)]">{result.message}</p>
        </section>
      ) : result.leads.length === 0 ? (
        <section className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
          <h3 className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
            {dict.leads.emptyTitle}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--foreground-soft)]">
            {dict.leads.emptyText}
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className={`rounded-[1.8rem] border border-[color:var(--border-soft)] p-5 shadow-[var(--shadow-md)] ${stat.tone}`}
              >
                <p className="text-sm">{stat.label}</p>
                <p className="mt-6 text-4xl font-semibold tracking-[-0.04em]" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </article>
            ))}
          </section>

          <section className="rounded-[2rem] border border-[color:var(--border)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
            <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-contrast)] px-4 py-2.5 text-sm text-[color:var(--foreground-soft)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                  <span
                    aria-hidden
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[color:var(--accent-strong)]"
                  >
                    ⌕
                  </span>
                  <span>{dict.leads.toolbar.search}</span>
                </div>
                <div className="rounded-full border border-[color:var(--border-soft)] bg-white px-4 py-2.5 text-sm text-[color:var(--foreground-soft)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                  {result.leads.length} {dict.leads.toolbar.entries}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--border-soft)] bg-white px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]"
                >
                  {dict.leads.toolbar.export}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-contrast)] px-4 py-2.5 text-sm font-medium text-[color:var(--accent-strong)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]"
                >
                  {dict.leads.toolbar.sortLatest}
                </button>
              </div>
            </div>

            <div className="hidden grid-cols-[1.4fr_1.2fr_1fr_1fr_0.8fr] gap-4 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)] xl:grid">
              <span>{dict.leads.columns.client}</span>
              <span>{dict.leads.columns.context}</span>
              <span>{dict.leads.columns.appointment}</span>
              <span>{dict.leads.columns.master}</span>
              <span>{dict.leads.columns.status}</span>
            </div>

            <div className="mt-4 space-y-3">
              {result.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="grid gap-4 rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,246,255,0.78))] p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--accent-soft)] hover:shadow-[var(--shadow-md)] xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_0.8fr] xl:items-center"
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                      {lead.name}
                    </h3>
                    <p className="text-sm text-[color:var(--foreground-soft)]">{lead.phone}</p>
                  </div>

                  <div className="text-sm leading-6 text-[color:var(--foreground-soft)]">{lead.comment}</div>

                  <div className="text-sm font-medium text-[color:var(--foreground)]">
                    {formatAppointment(lead.appointmentAt, locale, dict.common.noAppointment)}
                  </div>

                  <div className="text-sm text-[color:var(--foreground-soft)]">
                    {lead.master?.name ?? dict.common.noMaster}
                  </div>

                  <div className="flex justify-start xl:justify-end">
                    <StatusBadge status={lead.status} locale={locale} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
