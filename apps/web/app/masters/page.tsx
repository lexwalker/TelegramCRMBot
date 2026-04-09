import {
  createMasterAction,
  createServiceAction,
  deleteMasterAction,
  deleteServiceAction,
  updateMasterAction,
  updateServiceAction,
} from "../leads/actions";
import { listLeads, listMasters, listServices } from "../../lib/leads";
import { getCurrentLocale, getDictionary, getLocaleTag } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type MastersPageProps = {
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

function getWeekdayLabels(locale: "ru" | "en") {
  const monday = new Date(Date.UTC(2026, 0, 5, 12));

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    return new Intl.DateTimeFormat(getLocaleTag(locale), {
      weekday: "long",
    }).format(day);
  });
}

export default async function MastersPage({ searchParams }: MastersPageProps) {
  const locale = await getCurrentLocale();
  const dict = getDictionary(locale);
  const resolvedSearchParams = (await searchParams) ?? {};
  const [masters, leads, services] = await Promise.all([
    listMasters(),
    listLeads(),
    listServices(),
  ]);
  const activeMasters = masters.filter((master) => master.isActive).length;
  const activeServices = services.filter((service) => service.isActive).length;
  const weekdayLabels = getWeekdayLabels(locale);

  const serviceTexts = {
    eyebrow: locale === "ru" ? "Услуги" : "Services",
    title: locale === "ru" ? "Услуги и прайс" : "Services and pricing",
    description:
      locale === "ru"
        ? "Настраивайте услуги, длительность и базовую цену. Если цена пустая, менеджер сможет указать итоговую сумму при завершении заявки."
        : "Manage services, duration, and base price. If price is empty, the manager can enter the final amount when completing a lead.",
    addTitle: locale === "ru" ? "Добавить услугу" : "Add service",
    addButton: locale === "ru" ? "Добавить услугу" : "Add service",
    namePlaceholder:
      locale === "ru" ? "Например: Маникюр" : "For example: Consultation",
    duration: locale === "ru" ? "Длительность, мин" : "Duration, min",
    price: locale === "ru" ? "Цена" : "Price",
    pricePlaceholder:
      locale === "ru" ? "Пусто = укажем позже" : "Empty = set later",
    statusActive: locale === "ru" ? "Активная услуга" : "Active service",
    statusHidden: locale === "ru" ? "Скрыта из записи" : "Hidden from booking",
    deleteButton: locale === "ru" ? "Удалить услугу" : "Delete service",
    activeMetric: locale === "ru" ? "Активных услуг" : "Active services",
    sectionTitle: locale === "ru" ? "Каталог услуг" : "Service catalog",
    sectionText:
      locale === "ru"
        ? "Услуги вынесены в отдельный блок, чтобы прайс и карточки мастеров не смешивались в один поток."
        : "Services live in a separate block so pricing and staff cards do not blend into one long stream.",
  };

  const serviceMessages: Record<string, string> = {
    service_created: locale === "ru" ? "Услуга добавлена" : "Service added",
    service_updated: locale === "ru" ? "Услуга обновлена" : "Service updated",
    service_deleted: locale === "ru" ? "Услуга удалена" : "Service deleted",
    service_name_required:
      locale === "ru" ? "Укажите название услуги" : "Please enter a service name",
    service_duration_invalid:
      locale === "ru"
        ? "Длительность услуги указана некорректно"
        : "Service duration is invalid",
    service_price_invalid:
      locale === "ru" ? "Цена услуги должна быть числом" : "Service price must be a number",
    service_invalid: locale === "ru" ? "Некорректные данные услуги" : "Invalid service data",
    service_missing: locale === "ru" ? "Услуга не найдена" : "Service not found",
    service_remove_last_active:
      locale === "ru"
        ? "Нужно оставить хотя бы одну активную услугу"
        : "At least one active service must remain",
    service_has_leads:
      locale === "ru"
        ? "Эту услугу нельзя удалить: по ней уже есть заявки"
        : "This service cannot be deleted because it already has leads",
    service_unknown:
      locale === "ru"
        ? "Не удалось обновить услуги. Попробуйте еще раз."
        : "Could not update services. Please try again.",
  };

  const stats = [
    {
      label: dict.masters.metrics.total[0],
      value: masters.length,
      tone: "bg-[color:var(--surface-strong)] text-[color:var(--foreground)]",
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
    {
      label: serviceTexts.activeMetric,
      value: activeServices,
      tone: "bg-[linear-gradient(135deg,#ffb258,#ffd37a)] text-[color:var(--foreground)]",
      note: locale === "ru" ? "Доступны клиенту в боте" : "Visible to clients in bot",
    },
  ];

  const errorText = resolvedSearchParams.error_code
    ? dict.masters.messages[
        (resolvedSearchParams.error_code as keyof typeof dict.masters.messages) ??
          "master_unknown"
      ] ??
      serviceMessages[resolvedSearchParams.error_code] ??
      dict.masters.messages.master_unknown
    : null;
  const successText = resolvedSearchParams.success_code
    ? dict.masters.messages[
        (resolvedSearchParams.success_code as keyof typeof dict.masters.messages) ??
          "master_updated"
      ] ??
      serviceMessages[resolvedSearchParams.success_code] ??
      dict.masters.messages.master_updated
    : null;
  const mastersSectionText =
    locale === "ru"
      ? "Ниже идут только карточки мастеров с расписанием и статусом, без смешивания с услугами."
      : "Below are only staff cards with schedule and status, fully separated from services.";

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[rgba(9,11,23,0.96)] p-8 text-white shadow-[var(--shadow-lg)]">
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-white/45">
              {dict.masters.eyebrow}
            </p>
            <h1
              className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {dict.masters.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-base">
              {dict.masters.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-[1.6rem] border border-white/8 p-4 ${stat.tone}`}
              >
                <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">
                  {stat.label}
                </p>
                <p
                  className="mt-3 text-3xl font-semibold tracking-[-0.04em]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {stat.value}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] opacity-70">
                  {stat.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {errorText ? (
        <Feedback title={dict.masters.feedbackErrorTitle} text={errorText} tone="error" />
      ) : null}
      {successText ? (
        <Feedback title={dict.masters.feedbackSuccessTitle} text={successText} tone="success" />
      ) : null}

      <section className="space-y-6">
        <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {dict.masters.addEyebrow}
              </p>
              <h2
                className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {dict.masters.addTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[color:var(--foreground-soft)]">
              {dict.masters.addDescription}
            </p>
          </div>

          <form action={createMasterAction} className="mt-6 flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              name="name"
              required
              placeholder={dict.masters.namePlaceholder}
              className="flex-1 rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
            <button
              type="submit"
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
            >
              {dict.masters.addButton}
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">
                {serviceTexts.eyebrow}
              </p>
              <h2
                className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {serviceTexts.addTitle}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[color:var(--foreground-soft)]">
              {serviceTexts.description}
            </p>
          </div>

          <form
            action={createServiceAction}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_170px_190px_auto]"
          >
            <input
              type="text"
              name="name"
              required
              placeholder={serviceTexts.namePlaceholder}
              className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
            <input
              type="number"
              min="30"
              step="30"
              name="durationMinutes"
              required
              placeholder="60"
              className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              name="price"
              placeholder={serviceTexts.pricePlaceholder}
              className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
            <button
              type="submit"
              className="rounded-[1.3rem] bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)] md:col-span-2 xl:col-span-1 xl:rounded-full"
            >
              {serviceTexts.addButton}
            </button>
          </form>
        </section>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {serviceTexts.eyebrow}
            </p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {serviceTexts.sectionTitle}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
            {serviceTexts.sectionText}
          </p>
        </div>

        <div className="mt-6 grid gap-4 2xl:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className="overflow-hidden rounded-[1.8rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] shadow-[var(--shadow-md)]"
            >
              <div
                className={`h-1.5 ${
                  service.isActive
                    ? "bg-[linear-gradient(90deg,var(--accent),rgba(77,99,255,0.2))]"
                    : "bg-[linear-gradient(90deg,rgba(132,140,166,0.8),rgba(132,140,166,0.12))]"
                }`}
              />
              <div className="p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {service.isActive
                        ? serviceTexts.statusActive
                        : serviceTexts.statusHidden}
                    </p>
                    <h3
                      className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {service.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-[color:var(--foreground-soft)]">
                      <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-1.5">
                        {serviceTexts.duration}: {service.durationMinutes}
                      </span>
                      <span className="rounded-full border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] px-3 py-1.5">
                        {serviceTexts.price}:{" "}
                        {service.price == null
                          ? serviceTexts.pricePlaceholder
                          : `${service.price} ₽`}
                      </span>
                    </div>
                  </div>
                </div>

                <form action={updateServiceAction} className="mt-6 grid gap-4 xl:grid-cols-2">
                  <input type="hidden" name="id" value={service.id} />

                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={service.name}
                    className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />

                  <input
                    type="number"
                    min="30"
                    step="30"
                    name="durationMinutes"
                    required
                    defaultValue={service.durationMinutes}
                    className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    defaultValue={service.price ?? ""}
                    placeholder={serviceTexts.pricePlaceholder}
                    className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  />

                  <select
                    name="isActive"
                    defaultValue={service.isActive ? "true" : "false"}
                    className="rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                  >
                    <option value="true">{dict.common.active}</option>
                    <option value="false">{dict.common.inactive}</option>
                  </select>

                  <button
                    type="submit"
                    className="rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)] xl:col-span-2"
                  >
                    {dict.common.save}
                  </button>
                </form>

                <form action={deleteServiceAction} className="mt-4">
                  <input type="hidden" name="id" value={service.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-[color:var(--danger-soft)] bg-[color:var(--danger-soft)] px-5 py-3 text-sm font-medium text-[color:var(--danger)] transition hover:border-[rgba(255,111,127,0.34)]"
                  >
                    {serviceTexts.deleteButton}
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-md)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[color:var(--muted)]">
              {dict.masters.eyebrow}
            </p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {dict.masters.title}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
            {mastersSectionText}
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {masters.map((master) => {
            const bookedLeads = leads.filter(
              (lead) => lead.masterId === master.id && lead.appointmentAt,
            );

            return (
              <article
                key={master.id}
                className="overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface-muted)] shadow-[var(--shadow-md)]"
              >
                <div
                  className={`h-1.5 ${
                    master.isActive
                      ? "bg-[linear-gradient(90deg,var(--accent),rgba(77,99,255,0.2))]"
                      : "bg-[linear-gradient(90deg,rgba(132,140,166,0.8),rgba(132,140,166,0.12))]"
                  }`}
                />
                <div className="p-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                        {master.isActive
                          ? dict.masters.statusActive
                          : dict.masters.statusHidden}
                      </p>
                      <h3
                        className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
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

                  <form action={updateMasterAction} className="mt-6 space-y-6">
                    <input type="hidden" name="id" value={master.id} />

                    <div className="grid gap-4 xl:grid-cols-[1fr_240px_180px]">
                      <div>
                        <label className="block text-sm text-[color:var(--muted)]">
                          {dict.masters.nameLabel}
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          defaultValue={master.name}
                          className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-[color:var(--muted)]">
                          {dict.masters.statusLabel}
                        </label>
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
                        <button
                          type="submit"
                          className="w-full rounded-full border border-[color:var(--border)] px-5 py-3 text-sm font-medium transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                        >
                          {dict.common.save}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-[1.6rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-strong)] p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-[color:var(--muted)]">
                            {locale === "ru" ? "Расписание" : "Schedule"}
                          </p>
                          <h4
                            className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[color:var(--foreground)]"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {locale === "ru"
                              ? "Рабочие часы мастера"
                              : "Staff working hours"}
                          </h4>
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-[color:var(--foreground-soft)]">
                          {locale === "ru"
                            ? "Эти часы будут влиять на доступность клиента в боте и на свободные слоты в CRM."
                            : "These hours drive client availability in the bot and free slots inside CRM."}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-3">
                        {master.weeklySchedule.map((day) => (
                          <div
                            key={day.dayOfWeek}
                            className="grid gap-3 rounded-[1.3rem] border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] px-4 py-4 xl:grid-cols-[1.1fr_180px_180px_180px] xl:items-center"
                          >
                            <div>
                              <p className="text-sm font-medium text-[color:var(--foreground)]">
                                {weekdayLabels[day.dayOfWeek]}
                              </p>
                            </div>

                            <select
                              name={`schedule_${day.dayOfWeek}_isWorking`}
                              defaultValue={day.isWorking ? "true" : "false"}
                              className="rounded-[1.1rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                            >
                              <option value="true">
                                {locale === "ru" ? "Рабочий день" : "Working day"}
                              </option>
                              <option value="false">
                                {locale === "ru" ? "Выходной" : "Day off"}
                              </option>
                            </select>

                            <input
                              type="time"
                              name={`schedule_${day.dayOfWeek}_start`}
                              defaultValue={day.startTime}
                              className="rounded-[1.1rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                            />

                            <input
                              type="time"
                              name={`schedule_${day.dayOfWeek}_end`}
                              defaultValue={day.endTime}
                              className="rounded-[1.1rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>

                  <form action={deleteMasterAction} className="mt-4">
                    <input type="hidden" name="id" value={master.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-[color:var(--danger-soft)] bg-[color:var(--danger-soft)] px-5 py-3 text-sm font-medium text-[color:var(--danger)] transition hover:border-[rgba(255,111,127,0.34)]"
                    >
                      {dict.masters.deleteButton}
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
