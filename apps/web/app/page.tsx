const setupSteps = [
  "Создать .env на основе .env.example",
  "Поднять PostgreSQL локально или в облаке",
  "Сгенерировать Prisma Client",
  "Запустить CRM и Telegram-бота",
];

export default function HomePage() {
  return (
    <main className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
          Стартовый стенд
        </p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">
          Каркас готов для Telegram-бота, API и CRM-панели.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
          На этом этапе мы заложили production-ориентированный фундамент без
          лишней сложности: один монорепозиторий, общая база и отдельные
          процессы для веба и бота.
        </p>
      </section>

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted)]">
          Что дальше
        </p>
        <ol className="mt-4 space-y-3">
          {setupSteps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-sm font-semibold">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
