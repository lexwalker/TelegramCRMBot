import { logoutAction } from "../auth/actions";
import { getCurrentManagerSession } from "../../lib/auth";
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
  const session = await getCurrentManagerSession();
  const resolvedSearchParams = (await searchParams) ?? {};

  const text = {
    eyebrow: locale === "ru" ? "Профиль менеджера" : "Manager profile",
    title: locale === "ru" ? "Личные настройки CRM" : "Personal CRM settings",
    description:
      locale === "ru"
        ? "Здесь можно управлять тем, как система выглядит для менеджера, когда клиентам приходят напоминания и какой аккаунт сейчас используется для входа в CRM."
        : "Use this page to control the manager-facing profile, reminder timing, and the account currently signed into the CRM.",
    accountTitle: locale === "ru" ? "Аккаунт менеджера" : "Manager account",
    accountDescription:
      locale === "ru"
        ? "Этот аккаунт используется для входа в CRM. Подтверждённая почта позволяет безопасно восстанавливать доступ и подключать новые сценарии авторизации."
        : "This account is used to sign in to the CRM. A verified email keeps recovery and future authentication flows secure.",
    email: locale === "ru" ? "Email" : "Email",
    role: locale === "ru" ? "Роль" : "Role",
    verification: locale === "ru" ? "Подтверждение почты" : "Email verification",
    verified: locale === "ru" ? "Подтверждена" : "Verified",
    notVerified: locale === "ru" ? "Не подтверждена" : "Not verified",
    logout: locale === "ru" ? "Выйти из аккаунта" : "Sign out",
    name: locale === "ru" ? "Имя менеджера" : "Manager name",
    roleLabel: locale === "ru" ? "Подпись / роль" : "Role label",
    remindersTitle: locale === "ru" ? "Напоминания клиентам" : "Client reminders",
    templatesTitle: locale === "ru" ? "Шаблоны сообщений бота" : "Bot message templates",
    templatesDescription:
      locale === "ru"
        ? "Здесь можно задать тон общения для бота и уведомлений. Поддерживаются плейсхолдеры: {client_name}, {service_name}, {appointment}, {lead_id}, {manager_name}, {start_command}, {reschedule_command}, {cancel_command}."
        : "Use these templates to adjust the bot tone. Supported placeholders: {client_name}, {service_name}, {appointment}, {lead_id}, {manager_name}, {start_command}, {reschedule_command}, {cancel_command}.",
    remindersDescription:
      locale === "ru"
        ? "Бот отправляет одно напоминание перед визитом. Записи, созданные в тот же день, не получают это напоминание, чтобы не раздражать клиента."
        : "The bot sends one reminder before the appointment. Same-day bookings do not receive it to avoid annoying the client.",
    remindersEnabled: locale === "ru" ? "Включить напоминания" : "Enable reminders",
    singleReminder:
      locale === "ru" ? "Напоминание перед визитом, минут" : "Reminder before appointment, minutes",
    singleEnabled:
      locale === "ru" ? "Использовать одно напоминание" : "Use a single reminder",
    welcomeTemplate: locale === "ru" ? "Приветствие в начале записи" : "Welcome message",
    bookingCreatedTemplate:
      locale === "ru" ? "Подтверждение новой записи" : "Booking created message",
    reminderTemplate: locale === "ru" ? "Текст напоминания" : "Reminder message",
    bookingRescheduledTemplate:
      locale === "ru" ? "Сообщение о переносе" : "Rescheduled booking message",
    bookingCancelledTemplate:
      locale === "ru" ? "Сообщение об отмене" : "Cancelled booking message",
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
    reminder_invalid:
      locale === "ru"
        ? "Время напоминания должно быть целым числом минут больше нуля"
        : "Reminder timing must be a whole number of minutes above zero",
    manager_settings_unknown:
      locale === "ru"
        ? "Не удалось сохранить настройки профиля. Попробуйте ещё раз."
        : "Could not save manager settings. Please try again.",
    template_required:
      locale === "ru"
        ? "Все шаблоны должны быть заполнены. Если какой-то текст не нужен, лучше оставить короткую версию, чем пустое поле."
        : "All templates must be filled in. If a message should be shorter, keep a short version instead of an empty field.",
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
              {settings.sameDayReminderEnabled
                ? `${text.singleReminder}: ${settings.sameDayReminderMinutes}`
                : text.off}
            </p>
          </div>
        </div>
      </section>

      {errorText ? <Feedback title={text.errorTitle} text={errorText} tone="error" /> : null}
      {successText ? <Feedback title={text.successTitle} text={successText} tone="success" /> : null}

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
              {text.accountTitle}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">
              {session?.user.name ?? settings.managerName}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--foreground-soft)]">
              {text.accountDescription}
            </p>
          </div>

          <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--muted)]">{text.email}</dt>
                <dd className="max-w-[18rem] text-right text-[color:var(--foreground)]">
                  {session?.user.email ?? "-"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--muted)]">{text.role}</dt>
                <dd className="text-right text-[color:var(--foreground)]">
                  {session?.user.role ?? settings.managerRole}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[color:var(--muted)]">{text.verification}</dt>
                <dd className="text-right text-[color:var(--foreground)]">
                  {session?.user.emailVerifiedAt ? text.verified : text.notVerified}
                </dd>
              </div>
            </dl>

            <form action={logoutAction} className="mt-5">
              <button
                type="submit"
                className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-3 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent-strong)]"
              >
                {text.logout}
              </button>
            </form>
          </div>
        </div>
      </section>

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
              <label className="block text-sm text-[color:var(--muted)]">{text.roleLabel}</label>
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
                <label className="block text-sm text-[color:var(--muted)]">{text.singleEnabled}</label>
                <select
                  name="singleReminderEnabled"
                  defaultValue={settings.sameDayReminderEnabled ? "true" : "false"}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                >
                  <option value="true">{text.on}</option>
                  <option value="false">{text.off}</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-[color:var(--muted)]">{text.singleReminder}</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="reminderMinutes"
                  defaultValue={settings.sameDayReminderMinutes}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 rounded-[1.8rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                {text.templatesTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground-soft)]">
                {text.templatesDescription}
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="block text-sm text-[color:var(--muted)]">{text.welcomeTemplate}</label>
                <textarea
                  name="welcomeTemplate"
                  rows={4}
                  defaultValue={settings.welcomeTemplate}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[color:var(--muted)]">{text.bookingCreatedTemplate}</label>
                <textarea
                  name="bookingCreatedTemplate"
                  rows={6}
                  defaultValue={settings.bookingCreatedTemplate}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-sm text-[color:var(--muted)]">{text.reminderTemplate}</label>
                <textarea
                  name="reminderTemplate"
                  rows={5}
                  defaultValue={settings.reminderSameDayTemplate}
                  className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <div>
                  <label className="block text-sm text-[color:var(--muted)]">{text.bookingRescheduledTemplate}</label>
                  <textarea
                    name="bookingRescheduledTemplate"
                    rows={5}
                    defaultValue={settings.bookingRescheduledTemplate}
                    className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[color:var(--muted)]">{text.bookingCancelledTemplate}</label>
                  <textarea
                    name="bookingCancelledTemplate"
                    rows={5}
                    defaultValue={settings.bookingCancelledTemplate}
                    className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />
                </div>
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
