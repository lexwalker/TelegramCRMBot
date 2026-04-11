import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerById } from "../../../lib/leads";
import { StatusBadge } from "../../../components/status-badge";
import { getCurrentLocale, getLocaleTag } from "../../../lib/i18n";
import { addCustomerNoteAction } from "../../leads/actions";

export const dynamic = "force-dynamic";

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

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getCurrentLocale();
  const { id } = await params;
  const customer = await getCustomerById(decodeURIComponent(id));

  if (!customer) {
    notFound();
  }

  const text = {
    back: locale === "ru" ? "← К списку клиентов" : "← Back to clients",
    eyebrow: locale === "ru" ? "Карточка клиента" : "Client card",
    description:
      locale === "ru"
        ? "Здесь собрана вся история заявок клиента, чтобы менеджер видел повторные обращения, отмены и завершённые визиты в одном месте."
        : "This view combines the client's full lead history so the manager can see repeat requests, cancellations, and completed visits in one place.",
    telegram: locale === "ru" ? "Telegram ID" : "Telegram ID",
    noTelegram: locale === "ru" ? "Не сохранён" : "Not saved",
    totalLeads: locale === "ru" ? "Всего заявок" : "Total leads",
    activeBookings: locale === "ru" ? "Активные записи" : "Active bookings",
    revenue: locale === "ru" ? "Выручка" : "Revenue",
    favoriteService: locale === "ru" ? "Любимая услуга" : "Favorite service",
    noFavoriteService: locale === "ru" ? "Пока не определена" : "Not enough data yet",
    lastVisit: locale === "ru" ? "Последний визит" : "Last visit",
    noAppointment: locale === "ru" ? "Без записи" : "No booking",
    historyTitle: locale === "ru" ? "История действий" : "Activity history",
    leadsTitle: locale === "ru" ? "Все заявки клиента" : "Client leads",
    notesTitle: locale === "ru" ? "Заметки по клиенту" : "Client notes",
    notesHint:
      locale === "ru"
        ? "Здесь можно хранить общие договорённости и нюансы по клиенту, не привязанные к одной заявке."
        : "Store general client context here when it should not live inside a single lead.",
    notePlaceholder:
      locale === "ru"
        ? "Например: предпочитает утренние слоты и подтверждает запись только в Telegram"
        : "For example: prefers morning slots and confirms only in Telegram",
    saveNote: locale === "ru" ? "Сохранить заметку" : "Save note",
    noCustomerNotes:
      locale === "ru"
        ? "Пока нет общих заметок по клиенту."
        : "There are no client-level notes yet.",
    openLead: locale === "ru" ? "Открыть заявку" : "Open lead",
    service: locale === "ru" ? "Услуга" : "Service",
    master: locale === "ru" ? "Мастер" : "Staff member",
    noService: locale === "ru" ? "Не выбрана" : "Not selected",
    noMaster: locale === "ru" ? "Не назначен" : "Unassigned",
    noHistory:
      locale === "ru"
        ? "История пока пустая. Новые действия клиента будут появляться здесь автоматически."
        : "History is empty for now. New client events will appear here automatically.",
    requestFallback: locale === "ru" ? "Комментарий не указан" : "No request comment",
    latestBooking: locale === "ru" ? "Последняя запись" : "Latest booking",
    leadCreated: locale === "ru" ? "Заявка создана" : "Lead created",
  };

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <Link href="/clients" className="text-sm text-white/48 transition hover:text-white">
              {text.back}
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.24em] text-white/45">{text.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {customer.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">{text.description}</p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/62">
              <span className="rounded-full bg-white/8 px-3 py-1.5">{customer.phone}</span>
              <span className="rounded-full bg-white/8 px-3 py-1.5">
                {text.telegram}: {customer.telegramId ?? text.noTelegram}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{text.totalLeads}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{customer.leadsCount}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{text.activeBookings}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{customer.bookedCount}</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{text.revenue}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{customer.totalRevenue} ₽</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{text.favoriteService}</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {customer.favoriteServiceName ?? text.noFavoriteService}
              </p>
              <p className="mt-1 text-xs text-white/55">
                {customer.favoriteServiceCount > 0 ? `${customer.favoriteServiceCount}x` : ""}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/45">{text.lastVisit}</p>
              <p className="mt-3 text-lg font-semibold text-white">
                {formatDateTime(customer.lastVisitAt, locale, text.noAppointment)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{text.notesTitle}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                  {text.notesTitle}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--foreground-soft)]">{text.notesHint}</p>
              </div>
              <div className="rounded-full bg-[color:var(--surface-contrast)] px-4 py-2 text-sm text-[color:var(--foreground-soft)]">
                {customer.notes.length}
              </div>
            </div>

            <form action={addCustomerNoteAction} className="mt-6 space-y-4">
              <input type="hidden" name="customerId" value={customer.id} />
              <textarea
                name="text"
                rows={4}
                required
                placeholder={text.notePlaceholder}
                className="w-full rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
              <button
                type="submit"
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
              >
                {text.saveNote}
              </button>
            </form>

            {customer.notes.length === 0 ? (
              <div className="mt-6 rounded-[1.6rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-sm leading-7 text-[color:var(--foreground-soft)]">
                {text.noCustomerNotes}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {customer.notes.map((note) => (
                  <article
                    key={note.id}
                    className="rounded-[1.7rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface-muted))] p-5"
                  >
                    <div className="inline-flex rounded-full bg-[color:var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                      {formatDateTime(note.createdAt, locale, text.noAppointment)}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[color:var(--foreground-soft)]">{note.text}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{text.leadsTitle}</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                  {text.leadsTitle}
                </h2>
              </div>
              <div className="rounded-full bg-[color:var(--surface-contrast)] px-4 py-2 text-sm text-[color:var(--foreground-soft)]">
                {customer.leadsCount}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {customer.leads.map((lead) => (
                <article
                  key={lead.id}
                  className="rounded-[1.7rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface-muted))] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-[color:var(--foreground)]">{lead.name}</h3>
                        <StatusBadge status={lead.status} locale={locale} />
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--foreground-soft)]">
                        {lead.comment || text.requestFallback}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-[color:var(--foreground-soft)]">
                        <span className="rounded-full bg-[color:var(--surface)] px-3 py-1.5">
                          {text.latestBooking}: {formatDateTime(lead.appointmentAt, locale, text.noAppointment)}
                        </span>
                        <span className="rounded-full bg-[color:var(--surface)] px-3 py-1.5">
                          {text.master}: {lead.master?.name ?? text.noMaster}
                        </span>
                        <span className="rounded-full bg-[color:var(--surface)] px-3 py-1.5">
                          {text.service}: {lead.service?.name ?? text.noService}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 lg:items-end">
                      <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                        {text.leadCreated}: {formatDateTime(lead.createdAt, locale, text.noAppointment)}
                      </p>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                      >
                        {text.openLead}
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{text.historyTitle}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                {text.historyTitle}
              </h2>
            </div>
            <div className="rounded-full bg-[color:var(--surface-contrast)] px-4 py-2 text-sm text-[color:var(--foreground-soft)]">
              {customer.history.length}
            </div>
          </div>

          {customer.history.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-6 text-sm leading-7 text-[color:var(--foreground-soft)]">
              {text.noHistory}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {customer.history.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.7rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-strong),var(--surface-muted))] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                        {entry.leadName}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={entry.leadStatus} locale={locale} />
                      </div>
                    </div>
                    <div className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                      {formatDateTime(entry.createdAt, locale, text.noAppointment)}
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--foreground-soft)]">{entry.message}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-[color:var(--muted)]">
                    <span>{formatDateTime(entry.leadAppointmentAt, locale, text.noAppointment)}</span>
                    <Link href={`/leads/${entry.leadId}`} className="text-[color:var(--accent-strong)] hover:underline">
                      {text.openLead}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
