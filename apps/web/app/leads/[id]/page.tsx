import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "../../../lib/leads";
import { StatusBadge } from "../../../components/status-badge";
import { addLeadNoteAction, updateLeadStatusAction } from "../actions";

export const dynamic = "force-dynamic";

const statusOptions = [
  { value: "NEW", label: "Новая" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "DONE", label: "Завершена" },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAppointment(value: string | null) {
  if (!value) {
    return "Не выбрано";
  }

  return formatDate(value);
}

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  return (
    <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href="/leads"
                className="text-sm text-[var(--muted)] transition hover:text-[var(--accent)]"
              >
                ← К списку заявок
              </Link>
              <h2 className="mt-3 text-3xl font-semibold">{lead.name}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{lead.phone}</p>
            </div>
            <StatusBadge status={lead.status} />
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Создана
              </dt>
              <dd className="mt-2 text-sm">{formatDate(lead.createdAt)}</dd>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Дата записи
              </dt>
              <dd className="mt-2 text-sm">
                {formatAppointment(lead.appointmentAt)}
              </dd>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white/70 p-4">
              <dt className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Telegram ID
              </dt>
              <dd className="mt-2 text-sm">{lead.telegramId ?? "Не сохранен"}</dd>
            </div>
          </dl>

          <div className="mt-8 rounded-3xl border border-[var(--border)] bg-white/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Запрос клиента
            </p>
            <p className="mt-3 whitespace-pre-wrap leading-7">{lead.comment}</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
                Заметки
              </p>
              <h3 className="mt-2 text-2xl font-semibold">История по заявке</h3>
            </div>
          </div>

          {lead.notes.length === 0 ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Заметок пока нет. Ниже можно добавить первую.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {lead.notes.map((note) => (
                <article
                  key={note.id}
                  className="rounded-3xl border border-[var(--border)] bg-white/70 p-5"
                >
                  <p className="whitespace-pre-wrap leading-7">{note.text}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    {formatDate(note.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            Действия
          </p>
          <h3 className="mt-2 text-2xl font-semibold">Сменить статус</h3>

          <form action={updateLeadStatusAction} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={lead.id} />
            <label className="block text-sm text-[var(--muted)]" htmlFor="status">
              Текущий этап работы
            </label>
            <select
              id="status"
              name="status"
              defaultValue={lead.status}
              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
            >
              Сохранить статус
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
            Комментарий менеджера
          </p>
          <h3 className="mt-2 text-2xl font-semibold">Добавить заметку</h3>

          <form action={addLeadNoteAction} className="mt-6 space-y-4">
            <input type="hidden" name="id" value={lead.id} />
            <textarea
              name="text"
              rows={6}
              required
              placeholder="Например: клиент попросил связаться после 18:00"
              className="w-full rounded-3xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              className="w-full rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Добавить заметку
            </button>
          </form>
        </section>
      </aside>
    </main>
  );
}
