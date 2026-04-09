import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AppNavigation } from "../components/app-navigation";
import { LanguageSwitcher } from "../components/language-switcher";
import { PageTransition } from "../components/page-transition";
import { getCurrentLocale, getDictionary } from "../lib/i18n";
import { ThemeSwitcher } from "../components/theme-switcher";
import {
  getCurrentThemePreference,
  getThemeCookieName,
  resolveThemePreference,
} from "../lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Bot",
  description: "Telegram bot + CRM",
};

const THEME_INIT_SCRIPT = `(function(){try{var cookieName="__COOKIE_NAME__";var match=document.cookie.match(new RegExp('(?:^|; )'+cookieName.replace(/[-.$?*|{}()\\[\\]\\\\/+^]/g,'\\\\$&')+'=([^;]*)'));var preference=match?decodeURIComponent(match[1]):'system';var resolved=preference==='dark'||preference==='light'?preference:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=resolved;document.documentElement.style.colorScheme=resolved;}catch(e){}})();`;

const headingFont = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
});

const bodyFont = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
});

function SearchChrome({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-14 min-w-[280px] items-center gap-3 rounded-[1.35rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-4 text-sm text-[color:var(--foreground-soft)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <span className="relative h-4 w-4 shrink-0">
        <span className="absolute inset-0 rounded-full border-2 border-[#9aa4c7]" />
        <span className="absolute bottom-[-1px] right-[-2px] h-2 w-[2px] rotate-45 rounded-full bg-[#9aa4c7]" />
      </span>
      <span className="truncate">{placeholder}</span>
    </div>
  );
}

function HeaderPill({
  label,
  accent = false,
}: {
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`inline-flex h-12 items-center rounded-full border px-4 text-sm font-medium ${
        accent
          ? "border-transparent bg-[color:var(--surface-contrast)] text-[color:var(--accent-strong)]"
          : "border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] text-[color:var(--foreground-soft)]"
      }`}
    >
      {label}
    </div>
  );
}

function formatTodayLabel(locale: "ru" | "en") {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date());
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getCurrentLocale();
  const themePreference = await getCurrentThemePreference();
  const theme = resolveThemePreference(themePreference);
  const dict = getDictionary(locale);
  const todayLabel = formatTodayLabel(locale);
  const themeInitScript = THEME_INIT_SCRIPT.replace(
    "__COOKIE_NAME__",
    getThemeCookieName(),
  );
  const navItems = [
    { href: "/", label: dict.nav.overview, glyph: "grid" as const },
    { href: "/leads", label: dict.nav.leads, glyph: "list" as const },
    { href: "/calendar", label: dict.nav.calendar, glyph: "calendar" as const },
    { href: "/masters", label: dict.nav.masters, glyph: "team" as const },
  ];

  return (
    <html
      lang={locale}
      data-theme={theme}
      style={{ colorScheme: theme }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <div className="mx-auto min-h-screen max-w-[1760px] px-3 py-4 sm:px-5 sm:py-6">
          <div className="grid gap-5 lg:grid-cols-[96px_minmax(0,1fr)]">
            <aside className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,19,38,0.98),rgba(23,28,52,0.94))] p-3 text-white shadow-[0_26px_80px_rgba(8,10,22,0.34)] lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
              <div className="flex h-full flex-col">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-3 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-white text-[color:var(--ink-dark)]">
                    <div className="space-y-1">
                      <span className="block h-1 w-6 rounded-full bg-[color:var(--ink-dark)]" />
                      <span className="block h-1 w-6 rounded-full bg-[color:var(--ink-dark)]/80" />
                      <span className="block h-1 w-6 rounded-full bg-[color:var(--ink-dark)]/55" />
                    </div>
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-[0.26em] text-white/42">
                    {dict.layout.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Desk</p>
                </div>

                <div className="flex-1 pt-4">
                  <AppNavigation items={navItems} />
                </div>

                <div className="pt-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-3 py-3 text-center text-white/72">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold">
                      AI
                    </div>
                    <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-white/42">
                      {dict.layout.botSyncTitle}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {dict.layout.botSyncStatus}
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              <header className="relative z-40 rounded-[2.1rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow-md)] backdrop-blur-2xl sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <SearchChrome placeholder={dict.layout.searchPlaceholder} />
                    <HeaderPill label={`${dict.layout.today}, ${todayLabel}`} accent />
                    <HeaderPill label={dict.layout.dashboardChip} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <HeaderPill label={dict.layout.liveChip} accent />
                    <ThemeSwitcher currentTheme={themePreference} />
                    <LanguageSwitcher currentLocale={locale} />
                    <div className="flex items-center gap-3 rounded-[1.45rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-2.5 shadow-[0_10px_24px_rgba(50,72,230,0.08)]">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                          CRM operator
                        </p>
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">
                          Alexander
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),#92a4ff)] text-sm font-semibold text-white">
                        A
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
