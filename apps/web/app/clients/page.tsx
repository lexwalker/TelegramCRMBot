import Link from "next/link";
import { listCustomers } from "../../lib/leads";
import { getCurrentLocale, getLocaleTag } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type ClientsPageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

function formatDateTime(value: string | null, locale: "ru" | "en", fallback: string) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const locale = await getCurrentLocale();
  const customers = await listCustomers();
  const params = (await searchParams) ?? {};
  const query = (params.q ?? "").trim().toLowerCase();

  const text = {
    eyebrow: locale === "ru" ? "Клиенты" : "Clients",
    title: locale === "ru" ? "Клиентская база" : "Client records",
    description:
      locale === "ru"
        ? "Здесь собраны все клиенты с объединённой историей заявок, даже если они записывались несколько раз."
        : "This view groups repeat clients into one record so you can see their full lead history.",
    searchPlaceholder:
      locale === "ru" ? "Поиск по имени, телефону или Telegram ID" : "Search by name, phone, or Telegram ID",
    total: locale === "ru" ? "клиентов" : "clients",
    leads: locale === "ru" ? "Заявок" : "Leads",
    revenue: locale === "ru" ? "Выручка" : "Revenue",
    active: locale === "ru" ? "Активных записей" : "Active bookings",
    lastAppointment: locale === "ru" ? "Последняя запись" : "Latest booking",
    telegram: locale === "ru" ? "Telegram ID" : "Telegram ID",
    noTelegram: locale === "ru" ? "Не сохранён" : "Not saved",
    noAppointment: locale === "ru" ? "Пока без записи" : "No booking yet",
    openCustomer: locale === "ru" ? "Карточка клиента" : "Open client card",
    latestLead: locale === "ru" ? "Последняя заявка" : "Latest lead",
    noResultsTitle: locale === "ru" ? "Клиенты не найдены" : "No clients found",
    noResultsText:
      locale === "ru"
        ? "Попробуйте изменить запрос или дождитесь новых заявок из бота."
        : "Try a different query or wait for new leads from the bot.",
  };

  const filteredCustomers = customers.filter((customer) => {
    if (!query) {
      return true;
    }

    return [customer.name, customer.phone, customer.telegramId ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">{text.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {text.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">{text.description}</p>
          </div>

          <div className="rounded-full bg-white/8 px-5 py-3 text-sm font-medium text-white/72">
            {filteredCustomers.length} {text.total}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-md)] sm:p-8">
        <form className="mb-6">
          <div className="inline-flex w-full items-center gap-3 rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-contrast)] px-4 py-2.5 text-sm text-[color:var(--foreground-soft)] shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
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
              placeholder={text.searchPlaceholder}
              className="w-full bg-transparent outline-none placeholder:text-[color:var(--foreground-soft)]"
            />
          </div>
        </form>

        {filteredCustomers.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-8">
            <h3 className="text-xl font-semibold text-[color:var(--foreground)]">{text.noResultsTitle}</h3>
            <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-soft)]">{text.noResultsText}</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <article
                key={customer.id}
                className="rounded-[1.8rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface-muted))] p-6 shadow-[var(--shadow-md)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                      {customer.name}
                    </h2>
                    <p className="mt-2 text-sm text-[color:var(--foreground-soft)]">{customer.phone}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      {text.telegram}: {customer.telegramId ?? text.noTelegram}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm lg:min-w-[280px]">
                    <div className="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{text.leads}</p>
                      <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">{customer.leadsCount}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{text.active}</p>
                      <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">{customer.bookedCount}</p>
                    </div>
                    <div className="rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 col-span-2">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{text.revenue}</p>
                      <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">{customer.totalRevenue} ₽</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.4rem] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{text.lastAppointment}</p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">
                    {formatDateTime(customer.lastAppointmentAt, locale, text.noAppointment)}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/clients/${customer.id}`}
                    className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
                  >
                    {text.openCustomer}
                  </Link>
                  <Link
                    href={`/leads/${customer.latestLeadId}`}
                    className="rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                  >
                    {text.latestLead}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
