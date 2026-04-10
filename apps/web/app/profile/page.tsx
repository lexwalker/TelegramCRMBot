import { getBookingSettings } from "../../lib/leads";
import { getCurrentLocale } from "../../lib/i18n";
import { updateManagerSettingsAction } from "../leads/actions";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams?: Promise<{
    error_code?: string;
    success_code?: string;
  }>;
};

function Feedback({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "error" | "success";
}) {
  return (
    <section
      className={`rounded-[1.8rem] border p-6 shadow-[var(--shadow-md)] ${
        tone === "error"
          ? "border-[color:var(--danger-soft)] bg-[color:var(--surface-strong)]"
          : "border-[rgba(53,201,120,0.18)] bg-[color:var(--surface-strong)]"
      }`}
    >
      <h3 className="text-lg font-semibold text-[color:var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[color:var(--foreground-soft)]">{text}</p>
    </section>
  );
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const locale = await getCurrentLocale();
  const settings = await getBookingSettings();
  const resolvedSearchParams = (await searchParams) ?? {};

  const text = {
    eyebrow: locale === "ru" ? "Профиль менеджера" : "Manager profile",
    title: locale === "ru" ? "Личные настройки CRM" : "Personal CRM settings",
    description:
      locale === "ru"
        ? "Здесь можно управлять тем, как система ведёт себя от имени менеджера: как подписана карточка в шапке и как работают напоминания клиентам."
        : "Use this page to control how the CRM behaves on behalf of the manager: the profile badge in the header and how client reminders work.",
    name: locale === "ru" ? "Имя менеджера" : "Manager name",
    role: locale === "ru" ? "Подпись / роль" : "Role label",
    remindersTitle: locale === "ru" ? "Напоминания клиентам" : "Client reminders",
    remindersDescription:
      locale === "ru"
        ? "Если выключить напоминания полностью, бот не будет лишний раз писать клиенту перед записью."
        : "If reminders are disabled, the bot will stop messaging clients before their appointment.",
    remindersEnabled: locale === "ru" ? "Включить напоминания" : "Enable reminders",
    firstReminder: locale === "ru" ? "Раннее напоминание, минут" : "Early reminder, minutes",
    secondReminder:
      locale === "ru" ? "Напоминание в день визита, минут" : "Same-day reminder, minutes",
    firstEnabled:
      locale === "ru" ? "Использовать раннее напоминание" : "Use early reminder",
    secondEnabled:
      locale === "ru"
        ? "Использовать напоминание в день визита"
        : "Use same-day reminder",
    save: locale === "ru" ? "Сохранить профиль" : "Save profile",
    on: locale === "ru" ? "Включено" : "Enabled",
    off: locale === "ru" ? "Выключено" : "Disabled",
    successTitle: locale === "ru" ? "Готово" : "Done",
    errorTitle: locale === "ru" ? "Не удалось сохранить" : "Could not save",
  };

  const messages: Record<string, string> = {
    manager_settings_updated:
      locale === "ru" ? "Профиль менеджера обновлён" : "Manager profile updated",
    manager_name_required:
      locale === "ru" ? "Укажите имя менеджера" : "Please enter a manager name",
    manager_role_required:
      locale === "ru" ? "Укажите подпись или роль менеджера" : "Please enter a manager role",
    day_before_invalid:
      locale === "ru"
        ? "Время раннего напоминания должно быть целым числом минут больше нуля"
        : "Early reminder timing must be a whole number of minutes above zero",
    same_day_invalid:
      locale === "ru"
        ? "Время напоминания в день визита должно быть целым числом минут больше нуля"
        : "Same-day reminder timing must be a whole number of minutes above zero",
    manager_settings_unknown:
      locale === "ru"
        ? "Не удалось сохранить настройки профиля. Попробуйте ещё раз."
        : "Could not save manager settings. Please try again.",
  };

  const errorText = resolvedSearchParams.error_code
    ? messages[resolvedSearchParams.error_code]
    : null;
  const successText = resolvedSearchParams.success_code
    ? messages[resolvedSearchParams.success_code]
    : null;

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">{text.eyebrow}</p>
            <h1
              className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {text.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">
              {text.description}
            </p>
          </div>

          <div className="rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
              {text.remindersTitle}
            </p>
            <p
              className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {settings.remindersEnabled ? text.on : text.off}
            </p>
            <p className="mt-3 text-sm text-white/62">
              {settings.dayBeforeReminderEnabled
                ? `${text.firstReminder}: ${settings.dayBeforeReminderMinutes}`
                : text.off}
            </p>
            <p className="mt-1 text-sm text-white/62">
              {settings.sameDayReminderEnabled
                ? `${text.secondReminder}: ${settings.sameDayReminderMinutes}`
                : text.off}
            </p>
          </div>
        </div>
      </section>

      {errorText ? <Feedback title={text.errorTitle} text={errorText} tone="error" /> : null}
      {successText ? <Feedback title={text.successTitle} text={successText} tone="success" /> : null}

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
        <form action={updateManagerSettingsAction} className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[color:var(--muted)]">{text.name}</label>
              <input
                type="text"
                name="managerName"
                required
                defaultValue={settings.managerName}
                className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[color:var(--muted)]">{text.role}</label>
              <input
                type="text"
                name="managerRole"
                required
                defaultValue={settings.managerRole}
                className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
              />
            </div>
          </div>

          <div className="space-y-5 rounded-[1.8rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {text.remindersTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
                {text.remindersDescription}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm text-[color:var(--muted)]">
                  {text.remindersEnabled}
                </label>
                <select
                  name="remindersEnabled"
                  defaultValue={settings.remindersEnabled ? "true" : "false"}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                >
                  <option value="true">{text.on}</option>
                  <option value="false">{text.off}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[color:var(--muted)]">{text.firstEnabled}</label>
                <select
                  name="dayBeforeReminderEnabled"
                  defaultValue={settings.dayBeforeReminderEnabled ? "true" : "false"}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                >
                  <option value="true">{text.on}</option>
                  <option value="false">{text.off}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[color:var(--muted)]">{text.firstReminder}</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="dayBeforeReminderMinutes"
                  defaultValue={settings.dayBeforeReminderMinutes}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[color:var(--muted)]">{text.secondEnabled}</label>
                <select
                  name="sameDayReminderEnabled"
                  defaultValue={settings.sameDayReminderEnabled ? "true" : "false"}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                >
                  <option value="true">{text.on}</option>
                  <option value="false">{text.off}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-[color:var(--muted)]">{text.secondReminder}</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="sameDayReminderMinutes"
                  defaultValue={settings.sameDayReminderMinutes}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
            >
              {text.save}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
