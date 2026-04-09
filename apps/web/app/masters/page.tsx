import {
  createMasterAction,
  deleteMasterAction,
  updateMasterAction,
} from "../leads/actions";
import { listLeads, listMasters } from "../../lib/leads";

export const dynamic = "force-dynamic";

type MastersPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function MastersPage({ searchParams }: MastersPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const masters = await listMasters();
  const leads = await listLeads();

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
              Админ-панель
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Мастера</h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Здесь можно добавлять, редактировать, отключать и удалять мастеров.
          </p>
        </div>
      </section>

      {resolvedSearchParams.error ? (
        <section className="rounded-[2rem] border border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm">
          <h3 className="text-lg font-semibold">Изменение не применилось</h3>
          <p className="mt-2 text-sm leading-6">{resolvedSearchParams.error}</p>
        </section>
      ) : null}

      {resolvedSearchParams.success ? (
        <section className="rounded-[2rem] border border-emerald-300 bg-emerald-50 p-6 text-emerald-950 shadow-sm">
          <h3 className="text-lg font-semibold">Готово</h3>
          <p className="mt-2 text-sm leading-6">{resolvedSearchParams.success}</p>
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">Новый мастер</p>
        <h3 className="mt-2 text-2xl font-semibold">Добавить мастера</h3>

        <form action={createMasterAction} className="mt-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            name="name"
            required
            placeholder="Например: Анна"
            className="flex-1 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
          >
            Добавить
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {masters.map((master) => {
          const bookedLeads = leads.filter(
            (lead) => lead.masterId === master.id && lead.appointmentAt,
          );

          return (
            <article
              key={master.id}
              className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
                    {master.isActive ? "Активный мастер" : "Неактивный мастер"}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{master.name}</h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Назначенных записей: {bookedLeads.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm">
                  Порядок: {master.sortOrder}
                </div>
              </div>

              <form action={updateMasterAction} className="mt-6 grid gap-4 lg:grid-cols-[1fr_220px_180px]">
                <input type="hidden" name="id" value={master.id} />

                <div>
                  <label className="block text-sm text-[var(--muted)]">Имя мастера</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={master.name}
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[var(--muted)]">Статус</label>
                  <select
                    name="isActive"
                    defaultValue={master.isActive ? "true" : "false"}
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
                  >
                    <option value="true">Активен</option>
                    <option value="false">Скрыт из записи</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    Сохранить
                  </button>
                </div>
              </form>

              <form action={deleteMasterAction} className="mt-4">
                <input type="hidden" name="id" value={master.id} />
                <button
                  type="submit"
                  className="rounded-full border border-[#d96c4a] px-5 py-3 text-sm font-medium text-[#b54b2d] transition hover:bg-[#fff3ef]"
                >
                  Удалить мастера
                </button>
              </form>
            </article>
          );
        })}
      </section>
    </main>
  );
}
