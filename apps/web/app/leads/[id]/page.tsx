import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLeadById,
  listAvailableMastersForAppointment,
} from "../../../lib/leads";
import { StatusBadge } from "../../../components/status-badge";
import {
  addLeadNoteAction,
  cancelLeadAppointmentAction,
  changeLeadMasterAction,
  rescheduleLeadAction,
  updateLeadStatusAction,
} from "../actions";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../../../lib/i18n";

export const dynamic = "force-dynamic";

const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00"] as const;

function formatDate(value: string, locale: "ru" | "en") {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function formatAppointment(value: string | null, locale: "ru" | "en", fallback: string) {
  if (!value) {
    return fallback;
  }

  return formatDate(value, locale);
}

function getAppointmentDateValue(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function getAppointmentTimeValue(value: string | null) {
  if (!value) {
    return timeSlots[0];
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-[1.8rem] border border-[color:var(--danger-soft)] bg-white p-6 shadow-[var(--shadow-md)]">
      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-soft)]">{text}</p>
    </section>
  );
}

export default async function LeadDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; master_error?: string }>;
}) {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const { id } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  const availableMasters = lead.appointmentAt
    ? await listAvailableMastersForAppointment(lead.appointmentAt, lead.id)
    : [];

  const statCards = [
    { label: dict.common.createdAt, value: formatDate(lead.createdAt, locale) },
    {
      label: dict.common.appointment,
      value: formatAppointment(lead.appointmentAt, locale, dict.common.noAppointment),
    },
    { label: dict.common.master, value: lead.master?.name ?? dict.common.noMaster },
    { label: dict.common.telegramId, value: lead.telegramId ?? dict.common.telegramMissing },
  ];

  const masterErrorText =
    dict.detail.masterErrors[
      (resolvedSearchParams.master_error as keyof typeof dict.detail.masterErrors) ?? "unknown"
    ] ?? dict.detail.masterErrors.unknown;

  const statusOptions = [
    { value: "NEW", label: dict.status.NEW },
    { value: "IN_PROGRESS", label: dict.status.IN_PROGRESS },
    { value: "DONE", label: dict.status.DONE },
  ] as const;

  return (
    <main className="grid gap-6 xl:grid-cols-[1.16fr_0.84fr]">
      <section className="space-y-6">
        {resolvedSearchParams.error === "slot_taken" ? (
          <Notice title={dict.detail.slotTakenTitle} text={dict.detail.slotTakenText} />
        ) : null}

        {resolvedSearchParams.master_error ? (
          <Notice title={dict.detail.masterErrorTitle} text={masterErrorText} />
        ) : null}

        <div className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)] sm:p-9">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <Link href="/leads" className="text-sm text-white/48 transition hover:text-white">
                {dict.common.backToLeads}
              </Link>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
                  {lead.name}
                </h1>
                <StatusBadge status={lead.status} locale={locale} />
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/62">
                <span className="rounded-full bg-white/8 px-3 py-1.5">{lead.phone}</span>
                <span className="rounded-full bg-white/8 px-3 py-1.5">
                  {lead.master?.name ?? dict.common.noMaster}
                </span>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                {dict.detail.description}
              </p>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/6 px-5 py-4">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                {dict.common.appointment}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {lead.appointmentAt ? dict.detail.bookingActive : dict.detail.bookingNone}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {statCards.map((item, index) => (
            <div
              key={item.label}
              className={`rounded-[1.7rem] border p-5 shadow-[var(--shadow-md)] ${
                index === 1
                  ? "border-[color:var(--accent-soft)] bg-[linear-gradient(135deg,#6b7eff,#4d63ff)] text-white"
                  : "border-[color:var(--border)] bg-white"
              }`}
            >
              <dt className={`text-[11px] uppercase tracking-[0.22em] ${index === 1 ? "text-white/68" : "text-[color:var(--muted)]"}`}>
                {item.label}
              </dt>
              <dd className={`mt-3 text-sm leading-6 ${index === 1 ? "text-white" : "text-[color:var(--foreground)]"}`}>
                {item.value}
              </dd>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{dict.common.request}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-8 text-[color:var(--foreground-soft)] sm:text-base">
            {lead.comment}
          </p>
        </div>

        <div className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{dict.common.notes}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                {dict.detail.notesTitle}
              </h2>
            </div>
          </div>

          {lead.notes.length === 0 ? (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-5 text-sm leading-7 text-[color:var(--foreground-soft)]">
              {dict.common.noNotes}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {lead.notes.map((note, index) => (
                <article
                  key={note.id}
                  className="rounded-[1.7rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,244,255,0.82))] p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                      {dict.common.notes} {lead.notes.length - index}
                    </div>
                    <div className="rounded-full bg-[color:var(--surface-contrast)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                      {formatDate(note.createdAt, locale)}
                    </div>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[color:var(--foreground-soft)] sm:text-base">
                    {note.text}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
          <p className="text-sm uppercase tracking-[0.24em] text-white/42">{dict.detail.statusCard}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white" style={{ fontFamily: "var(--font-heading)" }}>
            {dict.detail.statusCard}
          </h3>
          <form action={updateLeadStatusAction} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={lead.id} />
            <label className="block text-sm text-white/70" htmlFor="status">
              {dict.detail.statusLabel}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={lead.status}
              className="mt-2 w-full rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3 text-white outline-none transition focus:border-white/25"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="text-black">
                  {option.label}
                </option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-[color:var(--ink-dark)] transition hover:opacity-90">
              {dict.common.saveStatus}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{dict.common.master}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
            {dict.detail.masterCard}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">{dict.common.availableMastersOnly}</p>

          {lead.appointmentAt ? (
            <form action={changeLeadMasterAction} className="mt-6 space-y-4">
              <input type="hidden" name="id" value={lead.id} />
              <select
                name="masterId"
                defaultValue={lead.masterId ?? availableMasters[0]?.id ?? ""}
                className="w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              >
                {availableMasters.map((master) => (
                  <option key={master.id} value={master.id}>
                    {master.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="w-full rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                {dict.common.reassign}
              </button>
            </form>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-sm leading-7 text-[color:var(--foreground-soft)]">
              {dict.detail.masterCardEmpty}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{dict.common.appointment}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
            {dict.detail.appointmentCard}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">{dict.common.autoAssignHint}</p>

          <form action={rescheduleLeadAction} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={lead.id} />

            <div>
              <label className="block text-sm text-[color:var(--muted)]" htmlFor="appointment-date">
                {dict.common.day}
              </label>
              <input
                id="appointment-date"
                type="date"
                name="date"
                required
                defaultValue={getAppointmentDateValue(lead.appointmentAt)}
                className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[color:var(--muted)]" htmlFor="appointment-time">
                {dict.common.time}
              </label>
              <select
                id="appointment-time"
                name="time"
                defaultValue={getAppointmentTimeValue(lead.appointmentAt)}
                className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]">
              {dict.detail.appointmentCard}
            </button>
          </form>

          <form action={cancelLeadAppointmentAction} className="mt-4">
            <input type="hidden" name="id" value={lead.id} />
            <button type="submit" className="w-full rounded-full border border-[color:var(--danger-soft)] bg-[color:var(--danger-soft)] px-5 py-3 text-sm font-medium text-[color:var(--danger)] transition hover:border-[rgba(255,111,127,0.34)]">
              {dict.common.cancelAppointment}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{dict.detail.noteCard}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
            {dict.detail.noteCardTitle}
          </h3>
          <form action={addLeadNoteAction} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={lead.id} />
            <textarea
              name="text"
              rows={6}
              required
              placeholder={dict.common.notePlaceholder}
              className="w-full rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
            <button type="submit" className="w-full rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
              {dict.common.saveNote}
            </button>
          </form>
        </section>
      </aside>
    </main>
  );
}
