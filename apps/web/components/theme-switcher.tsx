"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";
import type { Theme, ThemePreference } from "../lib/theme";

const COOKIE_NAME = "crm_theme";

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="12" cy="12" r="4.2" fill="#f59e0b" />
      <g stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 1.8v3" />
        <path d="M12 19.2v3" />
        <path d="M1.8 12h3" />
        <path d="M19.2 12h3" />
        <path d="m4.6 4.6 2.2 2.2" />
        <path d="m17.2 17.2 2.2 2.2" />
        <path d="m17.2 6.8 2.2-2.2" />
        <path d="m4.6 19.4 2.2-2.2" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M16.8 14.7A8.4 8.4 0 0 1 10.1 2.4a9 9 0 1 0 11.5 11.5 8.3 8.3 0 0 1-4.8.8Z"
        fill="#5b6dff"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <circle cx="8.2" cy="8.2" r="3.1" fill="#f59e0b" />
      <g stroke="#f59e0b" strokeWidth="1.4" strokeLinecap="round">
        <path d="M8.2 2.4v1.8" />
        <path d="M8.2 12.2V14" />
        <path d="M2.4 8.2h1.8" />
        <path d="M12.2 8.2H14" />
      </g>
      <path
        d="M16.6 13.2a5.2 5.2 0 0 1-4.2-7.6 5.8 5.8 0 1 0 6 8.8 5 5 0 0 1-1.8-1.2Z"
        fill="#5b6dff"
      />
    </svg>
  );
}

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  Icon: ComponentType;
}> = [
  { value: "system", label: "System", Icon: SystemIcon },
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
];

type ThemeSwitcherProps = {
  currentTheme: ThemePreference;
};

export function ThemeSwitcher({ currentTheme }: ThemeSwitcherProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<ThemePreference>(currentTheme);
  const [open, setOpen] = useState(false);

  function getSystemTheme(): Theme {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  }

  function syncDocumentTheme(nextPreference: ThemePreference) {
    const resolvedTheme =
      nextPreference === "system" ? getSystemTheme() : nextPreference;

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    setTheme(currentTheme);
    syncDocumentTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemThemeChange() {
      if (theme === "system") {
        syncDocumentTheme("system");
      }
    }

    handleSystemThemeChange();
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () =>
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  function applyTheme(nextTheme: ThemePreference) {
    setTheme(nextTheme);
    setOpen(false);
    document.cookie = `${COOKIE_NAME}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    syncDocumentTheme(nextTheme);
  }

  const activeOption = OPTIONS.find((option) => option.value === theme) ?? OPTIONS[0];
  const ActiveIcon = activeOption.Icon;

  return (
    <div ref={rootRef} className="relative z-[70]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] shadow-[0_10px_24px_rgba(50,72,230,0.08)] transition hover:border-[color:var(--accent-soft)] hover:bg-[color:var(--surface-muted)]"
        title={activeOption.label}
      >
        <ActiveIcon />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] flex items-center gap-2 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-2 shadow-[0_18px_40px_rgba(50,72,230,0.16)] backdrop-blur-xl">
          {OPTIONS.map((option) => {
            const active = option.value === theme;
            const Icon = option.Icon;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                onClick={() => applyTheme(option.value)}
                title={option.label}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  active
                    ? "border-[color:var(--accent-soft)] bg-[color:var(--surface-contrast)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                    : "border-transparent bg-[color:var(--surface-strong)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)]"
                }`}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
