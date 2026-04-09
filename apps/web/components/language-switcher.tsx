"use client";

import type { ComponentType } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "../lib/i18n";

const COOKIE_NAME = "crm_locale";

function FlagRussia() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 overflow-hidden rounded-full" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#fff" />
      <path d="M0 8h24v8H0z" fill="#1f5fff" />
      <path d="M0 16h24v8H0z" fill="#ef4444" />
    </svg>
  );
}

function FlagUsa() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 overflow-hidden rounded-full" aria-hidden>
      <defs>
        <clipPath id="flag-usa-clip">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-usa-clip)">
        <rect width="24" height="24" fill="#fff" />
        <rect y="0" width="24" height="2.4" fill="#ef4444" />
        <rect y="4.8" width="24" height="2.4" fill="#ef4444" />
        <rect y="9.6" width="24" height="2.4" fill="#ef4444" />
        <rect y="14.4" width="24" height="2.4" fill="#ef4444" />
        <rect y="19.2" width="24" height="2.4" fill="#ef4444" />
        <rect width="11" height="10.8" fill="#2563eb" />
        <g fill="#fff">
          <circle cx="2.2" cy="2.2" r="0.7" />
          <circle cx="5.2" cy="2.2" r="0.7" />
          <circle cx="8.2" cy="2.2" r="0.7" />
          <circle cx="3.7" cy="4.3" r="0.7" />
          <circle cx="6.7" cy="4.3" r="0.7" />
          <circle cx="2.2" cy="6.4" r="0.7" />
          <circle cx="5.2" cy="6.4" r="0.7" />
          <circle cx="8.2" cy="6.4" r="0.7" />
          <circle cx="3.7" cy="8.5" r="0.7" />
          <circle cx="6.7" cy="8.5" r="0.7" />
        </g>
      </g>
    </svg>
  );
}

const OPTIONS: Array<{
  value: Locale;
  label: string;
  Flag: ComponentType;
}> = [
  { value: "ru", label: "Русский", Flag: FlagRussia },
  { value: "en", label: "English", Flag: FlagUsa },
];

type LanguageSwitcherProps = {
  currentLocale: Locale;
};

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [locale, setLocale] = useState<Locale>(currentLocale);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function changeLocale(nextLocale: Locale) {
    setLocale(nextLocale);
    setOpen(false);
    document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  const activeOption = OPTIONS.find((option) => option.value === locale) ?? OPTIONS[0];
  const ActiveFlag = activeOption.Flag;

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
        <ActiveFlag />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] flex items-center gap-2 rounded-[1.2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-2 shadow-[0_18px_40px_rgba(50,72,230,0.16)] backdrop-blur-xl">
          {OPTIONS.map((option) => {
            const active = option.value === locale;
            const Flag = option.Flag;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitem"
                onClick={() => changeLocale(option.value)}
                disabled={isPending && active}
                title={option.label}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                  active
                    ? "border-[color:var(--accent-soft)] bg-[color:var(--surface-contrast)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                    : "border-transparent bg-[color:var(--surface-strong)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--surface-muted)]"
                }`}
              >
                <Flag />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
