import { getDictionary, type Locale } from "../lib/i18n";

type StatusBadgeProps = {
  status: string;
  locale?: Locale;
};

export function StatusBadge({ status, locale = "ru" }: StatusBadgeProps) {
  const dict = getDictionary(locale);

  const statusMap: Record<string, { label: string; className: string }> = {
    NEW: {
      label: dict.status.NEW,
      className:
        "border-[rgba(77,99,255,0.16)] bg-[rgba(77,99,255,0.08)] text-[color:var(--accent-strong)]",
    },
    IN_PROGRESS: {
      label: dict.status.IN_PROGRESS,
      className:
        "border-[rgba(255,187,84,0.18)] bg-[color:var(--warning-soft)] text-[#d68a16]",
    },
    DONE: {
      label: dict.status.DONE,
      className:
        "border-[rgba(53,201,120,0.18)] bg-[color:var(--success-soft)] text-[#21a55f]",
    },
  };

  const item = statusMap[status];

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${
        item?.className ??
        "border-[color:var(--border-soft)] bg-white/70 text-[color:var(--foreground)]"
      }`}
    >
      {item?.label ?? status}
    </span>
  );
}
