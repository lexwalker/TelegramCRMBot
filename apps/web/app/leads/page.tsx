import Link from "next/link";
import { getLeads, listMasters, listServices } from "../../lib/leads";
import { StatusBadge } from "../../components/status-badge";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../../lib/i18n";
import { quickUpdateLeadStatusAction } from "./actions";

export const dynamic = "force-dynamic";

type LeadsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    master?: string;
    service?: string;
    date?: string;
    sort?: string;
  }>;
};

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

function getDateKey(value: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const result = await getLeads();
  const [masters, services] = await Promise.all([listMasters(), listServices()]);
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim().toLowerCase();
  const statusFilter = params.status ?? "all";
  const masterFilter = params.master ?? "all";
  const serviceFilter = params.service ?? "all";
  const dateFilter = params.date ?? "";
  const sortFilter = params.sort === "oldest" ? "oldest" : "latest";

  const uiText = {
    searchPlaceholder:
      locale === "ru"
        ? "Поиск по клиенту, телефону, комментарию"
        : "Search by client, phone, comment",
    allStatuses: locale === "ru" ? "Все статусы" : "All statuses",
    allMasters: locale === "ru" ? "Все мастера" : "All staff",
    allServices: locale === "ru" ? "Все услуги" : "All services",
    sortLatest: locale === "ru" ? "Сначала новые" : "Latest first",
    sortOldest: locale === "ru" ? "Сначала старые" : "Oldest first",
    apply: locale === "ru" ? "Применить" : "Apply",
    reset: locale === "ru" ? "Сбросить" : "Reset",
    noFilteredTitle: locale === "ru" ? "Ничего не найдено" : "Nothing found",
    noFilteredText:
      locale === "ru"
        ? "Измените поиск или фильтры, чтобы увидеть заявки."
        : "Adjust your search or filters to see matching leads.",
    service: locale === "ru" ? "Услуга" : "Service",
    noService: locale === "ru" ? "Не выбрана" : "Not selected",
    price: locale === "ru" ? "Сумма" : "Amount",
    noPrice: locale === "ru" ? "Не указана" : "Not set",
    quickActions: locale === "ru" ? "Быстро" : "Quick",
    confirm: locale === "ru" ? "Подтвердить" : "Confirm",
    noShow: locale === "ru" ? "Не пришёл" : "No-show",
    cancel: locale === "ru" ? "Отменить" : "Cancel",
  };

  const filteredLeads = result.ok
    ? [...result.leads]
        .filter((lead) => {
          if (!query) {
            return true;
          }

          const haystack = [
            lead.name,
            lead.phone,
            lead.comment,
            lead.master?.name ?? "",
            lead.service?.name ?? "",
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(query);
        })
        .filter((lead) => (statusFilter === "all" ? true : lead.status === statusFilter))
        .filter((lead) => (masterFilter === "all" ? true : lead.masterId === masterFilter))
        .filter((lead) => (serviceFilter === "all" ? true : lead.serviceId === serviceFilter))
        .filter((lead) => {
          if (!dateFilter) {
            return true;
          }

          return lead.appointmentAt ? getDateKey(lead.appointmentAt) === dateFilter : false;
        })
        .sort((left, right) => {
          const factor = sortFilter === "oldest" ? 1 : -1;
          return left.createdAt.localeCompare(right.createdAt) * factor;
        })
    : [];

  const stats = result.ok
    ? [
        { label: dict.leads.newLeads, value: filteredLeads.filter((lead) => lead.status === "NEW").length, tone: "bg-[linear-gradient(135deg,#7184ff,#9aa7ff)] text-white" },
        { label: dict.status.CONFIRMED, value: filteredLeads.filter((lead) => lead.status === "CONFIRMED").length, tone: "bg-[linear-gradient(135deg,#53d3c6,#88efe4)] text-[color:var(--foreground)]" },
        { label: dict.leads.inProgress, value: filteredLeads.filter((lead) => lead.status === "IN_PROGRESS").length, tone: "bg-[linear-gradient(135deg,#ffb258,#ffd37a)] text-[color:var(--foreground)]" },
        { label: dict.leads.booked, value: filteredLeads.filter((lead) => Boolean(lead.appointmentAt) && ["NEW", "CONFIRMED", "IN_PROGRESS"].includes(lead.status)).length, tone: "bg-[linear-gradient(135deg,#53d48f,#90efb7)] text-[color:var(--foreground)]" },
        { label: dict.leads.done, value: filteredLeads.filter((lead) => lead.status === "DONE").length, tone: "border-[color:var(--border)] bg-[color:var(--surface-contrast)] text-[color:var(--foreground)]" },
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
            {result.ok ? `${filteredLeads.length} ${dict.leads.totalCards}` : dict.leads.dbTitle}
          </div>
        </div>
      </section>

      {!result.ok ? (
        <section className="rounded-[2rem] border border-[color:var(--danger-soft)] bg-[color:var(--surface-strong)] p-6 shadow-[var(--shadow-md)]">
          <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{dict.leads.dbTitle}</h3>
          <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-soft)]">{result.message}</p>
        </section>
      ) : result.leads.length === 0 ? (
        <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
          <h3 className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
            {dict.leads.emptyTitle}
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[color:var(--foreground-soft)]">
            {dict.leads.emptyText}
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-5">
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

          <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
            <form className="mb-6 grid gap-3 xl:grid-cols-[1.5fr_repeat(4,0.8fr)_0.8fr_auto_auto] xl:items-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-contrast)] px-4 py-2.5 text-sm text-[color:var(--foreground-soft)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--surface-strong)] text-[color:var(--accent-strong)]"
                >
                  ⌕
                </span>
                <input
                  type="text"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder={uiText.searchPlaceholder}
                  className="w-full bg-transparent outline-none placeholder:text-[color:var(--foreground-soft)]"
                />
              </div>

              <select name="status" defaultValue={statusFilter} className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                <option value="all">{uiText.allStatuses}</option>
                <option value="NEW">{dict.status.NEW}</option>
                <option value="CONFIRMED">{dict.status.CONFIRMED}</option>
                <option value="IN_PROGRESS">{dict.status.IN_PROGRESS}</option>
                <option value="DONE">{dict.status.DONE}</option>
                <option value="CANCELLED">{dict.status.CANCELLED}</option>
                <option value="NO_SHOW">{dict.status.NO_SHOW}</option>
              </select>

              <select name="master" defaultValue={masterFilter} className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                <option value="all">{uiText.allMasters}</option>
                {masters.map((master) => (
                  <option key={master.id} value={master.id}>{master.name}</option>
                ))}
              </select>

              <select name="service" defaultValue={serviceFilter} className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                <option value="all">{uiText.allServices}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>

              <input
                type="date"
                name="date"
                defaultValue={dateFilter}
                className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]"
              />

              <select name="sort" defaultValue={sortFilter} className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-contrast)] px-4 py-2.5 text-sm font-medium text-[color:var(--accent-strong)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                <option value="latest">{uiText.sortLatest}</option>
                <option value="oldest">{uiText.sortOldest}</option>
              </select>

              <div className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 py-2.5 text-sm text-[color:var(--foreground-soft)] shadow-[0_10px_24px_rgba(50,72,230,0.08)] text-center">
                {filteredLeads.length} {dict.leads.toolbar.entries}
              </div>

              <button
                type="submit"
                className="rounded-full border border-[rgba(117,134,255,0.26)] bg-[linear-gradient(135deg,rgba(88,104,236,0.38),rgba(55,69,150,0.22))] px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(50,72,230,0.14)]"
              >
                {uiText.apply}
              </button>

              <Link
                href="/leads"
                className="rounded-full border border-[rgba(117,134,255,0.22)] bg-[linear-gradient(135deg,rgba(88,104,236,0.24),rgba(44,57,130,0.16))] px-4 py-2.5 text-sm font-medium text-[color:var(--accent-strong)] shadow-[0_10px_24px_rgba(50,72,230,0.1)] text-center"
              >
                {uiText.reset}
              </Link>
            </form>

            <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.8fr_1fr] gap-4 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)] xl:grid">
              <span>{dict.leads.columns.client}</span>
              <span>{dict.leads.columns.context}</span>
              <span>{dict.leads.columns.appointment}</span>
              <span>{dict.leads.columns.master}</span>
              <span>{uiText.service}</span>
              <span>{dict.leads.columns.status}</span>
              <span>{uiText.quickActions}</span>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="mt-4 rounded-[1.6rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-sm leading-7 text-[color:var(--foreground-soft)]">
                <p className="text-lg font-medium text-[color:var(--foreground)]">{uiText.noFilteredTitle}</p>
                <p className="mt-2">{uiText.noFilteredText}</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {filteredLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="grid gap-4 rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface-muted))] p-4 transition hover:-translate-y-0.5 hover:border-[rgba(117,134,255,0.34)] hover:bg-[linear-gradient(180deg,var(--surface-contrast),var(--surface-strong))] hover:shadow-[var(--shadow-md)] xl:grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.8fr_1fr] xl:items-center"
                  >
                    <div className="space-y-2">
                      <Link href={`/leads/${lead.id}`} className="block">
                        <h3 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                          {lead.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-[color:var(--foreground-soft)]">{lead.phone}</p>
                    </div>

                    <div className="text-sm leading-6 text-[color:var(--foreground-soft)]">{lead.comment}</div>

                    <div className="text-sm font-medium text-[color:var(--foreground)]">
                      {formatAppointment(lead.appointmentAt, locale, dict.common.noAppointment)}
                    </div>

                    <div className="text-sm text-[color:var(--foreground-soft)]">
                      {lead.master?.name ?? dict.common.noMaster}
                    </div>

                    <div className="text-sm text-[color:var(--foreground-soft)]">
                      <div>{lead.service?.name ?? uiText.noService}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {uiText.price}: {lead.finalPrice != null ? `${lead.finalPrice} ₽` : lead.service?.price != null ? `${lead.service.price} ₽` : uiText.noPrice}
                      </div>
                    </div>

                    <div className="flex justify-start xl:justify-end">
                      <StatusBadge status={lead.status} locale={locale} />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <form action={quickUpdateLeadStatusAction}>
                        <input type="hidden" name="id" value={lead.id} />
                        <input type="hidden" name="status" value="CONFIRMED" />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(83,211,198,0.24)] bg-[rgba(83,211,198,0.12)] px-3 py-2 text-xs font-medium text-[color:var(--foreground)] transition hover:border-[rgba(83,211,198,0.38)] hover:bg-[rgba(83,211,198,0.2)]"
                        >
                          {uiText.confirm}
                        </button>
                      </form>
                      <form action={quickUpdateLeadStatusAction}>
                        <input type="hidden" name="id" value={lead.id} />
                        <input type="hidden" name="status" value="NO_SHOW" />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(255,178,88,0.24)] bg-[rgba(255,178,88,0.12)] px-3 py-2 text-xs font-medium text-[color:var(--foreground)] transition hover:border-[rgba(255,178,88,0.36)] hover:bg-[rgba(255,178,88,0.18)]"
                        >
                          {uiText.noShow}
                        </button>
                      </form>
                      <form action={quickUpdateLeadStatusAction}>
                        <input type="hidden" name="id" value={lead.id} />
                        <input type="hidden" name="status" value="CANCELLED" />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(255,111,127,0.22)] bg-[rgba(255,111,127,0.12)] px-3 py-2 text-xs font-medium text-[color:var(--danger)] transition hover:border-[rgba(255,111,127,0.34)] hover:bg-[rgba(255,111,127,0.18)]"
                        >
                          {uiText.cancel}
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
