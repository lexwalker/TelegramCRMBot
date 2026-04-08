type StatusBadgeProps = {
  status: string;
};

const statusMap: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Готово",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className="inline-flex rounded-full bg-[var(--surface-strong)] px-3 py-1 text-sm font-medium text-[var(--foreground)]">
      {statusMap[status] ?? status}
    </span>
  );
}
