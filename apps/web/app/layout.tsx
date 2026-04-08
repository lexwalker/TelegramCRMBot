import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Bot MVP",
  description: "Telegram bot + CRM MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <div className="mx-auto min-h-screen max-w-6xl px-4 py-8 sm:px-6">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)]/90 px-6 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">
                CRM Bot
              </p>
              <h1 className="mt-1 text-2xl font-semibold">MVP для заявок из Telegram</h1>
            </div>

            <nav className="flex gap-3 text-sm">
              <Link
                href="/"
                className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Обзор
              </Link>
              <Link
                href="/leads"
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-[var(--accent-foreground)] transition hover:opacity-90"
              >
                Заявки
              </Link>
            </nav>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
