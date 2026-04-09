import {
  createMasterAction,
  deleteMasterAction,
  updateMasterAction,
} from "../leads/actions";
import { listLeads, listMasters } from "../../lib/leads";
import { getCurrentLocale, getDictionary } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type MastersPageProps = {
  searchParams?: Promise<{
    error_code?: string;
    success_code?: string;
  }>;
};

function Feedback({ title, text, tone }: { title: string; text: string; tone: "error" | "success" }) {
  return (
    <section className={`rounded-[1.8rem] border p-6 shadow-[var(--shadow-md)] ${tone === "error" ? "border-[color:var(--danger-soft)] bg-white" : "border-[rgba(53,201,120,0.18)] bg-white"}`}>
      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-soft)]">{text}</p>
    </section>
  );
}

export default async function MastersPage({ searchParams }: MastersPageProps) {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const masters = await listMasters();
  const leads = await listLeads();
  const activeMasters = masters.filter((master) => master.isActive).length;

  const stats = [
    {
      label: dict.masters.metrics.total[0],
      value: masters.length,
      tone: "bg-white text-[color:var(--foreground)]",
      note: dict.masters.metrics.total[1],
    },
    {
      label: dict.masters.metrics.active[0],
      value: activeMasters,
      tone: "bg-[linear-gradient(135deg,#5970ff,#7f92ff)] text-white",
      note: dict.masters.metrics.active[1],
    },
    {
      label: dict.masters.metrics.assigned[0],
      value: leads.filter((lead) => Boolean(lead.masterId && lead.appointmentAt)).length,
      tone: "bg-[linear-gradient(135deg,#53d48f,#90efb7)] text-[color:var(--foreground)]",
      note: dict.masters.metrics.assigned[1],
    },
  ];

  const errorText = resolvedSearchParams.error_code
    ? dict.masters.messages[
        (resolvedSearchParams.error_code as keyof typeof dict.masters.messages) ?? "master_unknown"
      ] ?? dict.masters.messages.master_unknown
    : null;
  const successText = resolvedSearchParams.success_code
    ? dict.masters.messages[
        (resolvedSearchParams.success_code as keyof typeof dict.masters.messages) ?? "master_updated"
      ] ?? dict.masters.messages.master_updated
    : null;

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">{dict.masters.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl" style={{ fontFamily: "var(--font-heading)" }}>
              {dict.masters.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">{dict.masters.description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className={`rounded-[1.6rem] border border-white/8 p-4 ${stat.tone}`}>
                <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">{stat.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] opacity-70">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {errorText ? <Feedback title={dict.masters.feedbackErrorTitle} text={errorText} tone="error" /> : null}
      {successText ? <Feedback title={dict.masters.feedbackSuccessTitle} text={successText} tone="success" /> : null}

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">{dict.masters.addEyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
              {dict.masters.addTitle}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[color:var(--foreground-soft)]">{dict.masters.addDescription}</p>
        </div>

        <form action={createMasterAction} className="mt-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            name="name"
            required
            placeholder={dict.masters.namePlaceholder}
            className="flex-1 rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
          <button type="submit" className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]">
            {dict.masters.addButton}
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {masters.map((master) => {
          const bookedLeads = leads.filter((lead) => lead.masterId === master.id && lead.appointmentAt);

          return (
            <article key={master.id} className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-white shadow-[var(--shadow-md)]">
              <div className={`h-1.5 ${master.isActive ? "bg-[linear-gradient(90deg,var(--accent),rgba(77,99,255,0.2))]" : "bg-[linear-gradient(90deg,rgba(132,140,166,0.8),rgba(132,140,166,0.12))]"}`} />
              <div className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {master.isActive ? dict.masters.statusActive : dict.masters.statusHidden}
                    </p>
                    <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                      {master.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-[color:var(--foreground-soft)]">
                      <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-1.5">
                        {dict.masters.assignedCount}: {bookedLeads.length}
                      </span>
                      <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-1.5">
                        {dict.masters.order}: {master.sortOrder}
                      </span>
                    </div>
                  </div>
                </div>

                <form action={updateMasterAction} className="mt-6 grid gap-4 xl:grid-cols-[1fr_240px_180px]">
                  <input type="hidden" name="id" value={master.id} />

                  <div>
                    <label className="block text-sm text-[color:var(--muted)]">{dict.masters.nameLabel}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      defaultValue={master.name}
                      className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-[color:var(--muted)]">{dict.masters.statusLabel}</label>
                    <select
                      name="isActive"
                      defaultValue={master.isActive ? "true" : "false"}
                      className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                    >
                      <option value="true">{dict.common.active}</option>
                      <option value="false">{dict.common.inactive}</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button type="submit" className="w-full rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                      {dict.common.save}
                    </button>
                  </div>
                </form>

                <form action={deleteMasterAction} className="mt-4">
                  <input type="hidden" name="id" value={master.id} />
                  <button type="submit" className="rounded-full border border-[color:var(--danger-soft)] bg-[color:var(--danger-soft)] px-5 py-3 text-sm font-medium text-[color:var(--danger)] transition hover:border-[rgba(255,111,127,0.34)]">
                    {dict.masters.deleteButton}
                  </button>
                </form>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
