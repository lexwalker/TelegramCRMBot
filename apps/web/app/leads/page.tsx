import { getLeads } from "../../lib/leads";
import { StatusBadge } from "../../components/status-badge";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const result = await getLeads();

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              CRM
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Заявки</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Страница уже подключена к Prisma и будет показывать реальные данные
            после миграции базы.
          </p>
        </div>
      </section>

      {!result.ok ? (
        <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm">
          <h3 className="text-lg font-semibold">База данных пока не готова</h3>
          <p className="mt-2 text-sm leading-6">
            {result.message}
          </p>
        </section>
      ) : result.leads.length === 0 ? (
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <p className="text-lg font-medium">Заявок пока нет.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            На следующем этапе мы подключим Telegram-бота и начнём складывать
            сюда реальные обращения.
          </p>
        </section>
      ) : (
        <section className="grid gap-4">
          {result.leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{lead.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">{lead.phone}</p>
                </div>
                <StatusBadge status={lead.status} />
              </div>
              <p className="mt-4 leading-7">{lead.comment}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
