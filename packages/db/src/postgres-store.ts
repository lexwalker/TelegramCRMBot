import { prisma } from "./prisma.js";

export type LeadStatus =
  | "NEW"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELLED"
  | "NO_SHOW";
export type LeadHistoryAction =
  | "lead_created"
  | "status_changed"
  | "note_added"
  | "appointment_changed"
  | "appointment_cancelled"
  | "master_changed"
  | "service_changed"
  | "price_updated"
  | "reminder_sent";
export type LeadHistoryActor = "crm" | "bot" | "system";
export type ReminderKind = "day_before" | "same_day";
export type BookingSettings = {
  minLeadTimeMinutes: number;
  managerName: string;
  managerRole: string;
  remindersEnabled: boolean;
  dayBeforeReminderEnabled: boolean;
  dayBeforeReminderMinutes: number;
  sameDayReminderEnabled: boolean;
  sameDayReminderMinutes: number;
  welcomeTemplate: string;
  bookingCreatedTemplate: string;
  reminderDayBeforeTemplate: string;
  reminderSameDayTemplate: string;
  bookingRescheduledTemplate: string;
  bookingCancelledTemplate: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ManagerUser = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TelegramBotConnection = {
  id: string;
  organizationId: string;
  token: string;
  username: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationSettings = BookingSettings & {
  organizationId: string;
};

export type MasterScheduleDay = {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
};

export type Master = {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  weeklySchedule: MasterScheduleDay[];
};

export type Service = {
  id: string;
  organizationId: string;
  name: string;
  durationMinutes: number;
  price: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type LeadNote = {
  id: string;
  organizationId: string;
  leadId: string;
  text: string;
  createdAt: string;
};

export type LeadHistoryEntry = {
  id: string;
  organizationId: string;
  leadId: string;
  action: LeadHistoryAction;
  actor: LeadHistoryActor;
  message: string;
  createdAt: string;
};

export type CustomerNote = {
  id: string;
  organizationId: string;
  customerId: string;
  text: string;
  createdAt: string;
};

type LeadRecord = {
  id: string;
  organizationId: string;
  telegramId: string | null;
  name: string;
  phone: string;
  comment: string;
  appointmentAt: string | null;
  masterId: string | null;
  serviceId: string | null;
  finalPrice: number | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  noShowAt: string | null;
  completedAt: string | null;
  reminderDayBeforeSentAt: string | null;
  reminderSameDaySentAt: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type Lead = LeadRecord & {
  customerId: string;
  notes: LeadNote[];
  history: LeadHistoryEntry[];
  master: Master | null;
  service: Service | null;
};

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  telegramId: string | null;
  leadsCount: number;
  bookedCount: number;
  doneCount: number;
  cancelledCount: number;
  noShowCount: number;
  totalRevenue: number;
  lastLeadAt: string;
  lastAppointmentAt: string | null;
  lastVisitAt: string | null;
  favoriteServiceName: string | null;
  favoriteServiceCount: number;
  latestLeadId: string;
};

export type CustomerActivity = LeadHistoryEntry & {
  leadName: string;
  leadStatus: LeadStatus;
  leadAppointmentAt: string | null;
};

export type Customer = CustomerSummary & {
  leads: Lead[];
  history: CustomerActivity[];
  notes: CustomerNote[];
};

type CreateLeadInput = {
  organizationId?: string | null;
  telegramId?: string | null;
  name: string;
  phone: string;
  comment: string;
  appointmentAt?: string | null;
  serviceId?: string | null;
  actor?: LeadHistoryActor;
};

type UpdateMasterInput = {
  name: string;
  isActive: boolean;
  weeklySchedule: MasterScheduleDay[];
};

type UpdateServiceInput = {
  name: string;
  durationMinutes: number;
  price: number | null;
  isActive: boolean;
};

type UpdateLeadOptions = {
  actor?: LeadHistoryActor;
};

type DatabaseShape = {
  organizations: Organization[];
  users: ManagerUser[];
  telegramBots: TelegramBotConnection[];
  leads: LeadRecord[];
  notes: LeadNote[];
  customerNotes: CustomerNote[];
  history: LeadHistoryEntry[];
  masters: Master[];
  services: Service[];
  settings: OrganizationSettings[];
};

type AppointmentAvailabilityOptions = {
  excludeLeadId?: string | null;
};

type FindMasterOptions = AppointmentAvailabilityOptions & {
  excludedMasterIds?: string[];
};

export type DueReminder = {
  lead: Lead;
  kind: ReminderKind;
};

export type BotTemplateVariables = Record<string, string | number | null | undefined>;

const DEFAULT_TIME_INCREMENT_MINUTES = 60;
const DEFAULT_SERVICE_DURATION_MINUTES = 60;
const DEFAULT_ORGANIZATION_ID = "org_default";
const DEFAULT_MANAGER_ID = "manager_default";
const DEFAULT_BOT_ID = "bot_default";
const DEFAULT_ORGANIZATION: Organization = {
  id: DEFAULT_ORGANIZATION_ID,
  name: "Default organization",
  slug: "default",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const DEFAULT_MANAGER_USER: ManagerUser = {
  id: DEFAULT_MANAGER_ID,
  organizationId: DEFAULT_ORGANIZATION_ID,
  name: "Alexander",
  email: "owner@example.com",
  role: "owner",
  passwordHash: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};
const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  minLeadTimeMinutes: 0,
  managerName: "Alexander",
  managerRole: "CRM operator",
  remindersEnabled: true,
  dayBeforeReminderEnabled: false,
  dayBeforeReminderMinutes: 181,
  sameDayReminderEnabled: true,
  sameDayReminderMinutes: 180,
  welcomeTemplate: [
    "Рада помочь с записью.",
    "Сначала выберите услугу, а дальше я быстро проведу вас до удобного времени.",
  ].join("\n"),
  bookingCreatedTemplate: [
    "Готово, запись сохранена.",
    "Заявка: {lead_id}",
    "Услуга: {service_name}",
    "Когда ждём: {appointment}",
    "Если запись оформлена заранее, я аккуратно напомню о ней за 3 часа до визита.",
    "Если захотите перенести запись, отправьте {reschedule_command}.",
    "Если захотите отменить запись, отправьте {cancel_command}.",
  ].join("\n"),
  reminderDayBeforeTemplate: [
    "Небольшое напоминание о вашей записи.",
    "Ждём вас: {appointment}",
    "Если всё в силе, подтвердите запись одной кнопкой ниже.",
  ].join("\n"),
  reminderSameDayTemplate: [
    "Небольшое напоминание о вашей записи.",
    "Ждём вас: {appointment}",
    "Если планы изменились, ниже можно быстро перенести или отменить запись.",
  ].join("\n"),
  bookingRescheduledTemplate: [
    "Запись обновили.",
    "Новое время: {appointment}",
    "Если новое время не подходит, можно воспользоваться {reschedule_command} или {cancel_command}.",
  ].join("\n"),
  bookingCancelledTemplate: [
    "Запись отменили.",
    "Отменённое время: {appointment}",
    "Если захотите выбрать новое время, просто отправьте {start_command}.",
  ].join("\n"),
};
const ACTIVE_BOOKING_STATUSES: LeadStatus[] = ["NEW", "CONFIRMED", "IN_PROGRESS"];
const DEFAULT_MASTERS: Master[] = [
  {
    id: "master_1",
    organizationId: DEFAULT_ORGANIZATION_ID,
    name: "Мастер 1",
    isActive: true,
    sortOrder: 1,
    weeklySchedule: createDefaultWeeklySchedule(),
  },
  {
    id: "master_2",
    organizationId: DEFAULT_ORGANIZATION_ID,
    name: "Мастер 2",
    isActive: true,
    sortOrder: 2,
    weeklySchedule: createDefaultWeeklySchedule(),
  },
];
const DEFAULT_SERVICES: Service[] = [
  {
    id: "service_basic",
    organizationId: DEFAULT_ORGANIZATION_ID,
    name: "Базовая услуга",
    durationMinutes: 60,
    price: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "service_extended",
    organizationId: DEFAULT_ORGANIZATION_ID,
    name: "Длительная услуга",
    durationMinutes: 120,
    price: null,
    isActive: true,
    sortOrder: 2,
  },
];
const DEFAULT_TELEGRAM_BOT: TelegramBotConnection = {
  id: DEFAULT_BOT_ID,
  organizationId: DEFAULT_ORGANIZATION_ID,
  token: process.env.TELEGRAM_BOT_TOKEN ?? "",
  username: null,
  isActive: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function createDefaultWeeklySchedule(): MasterScheduleDay[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isWorking: true,
    startTime: "10:00",
    endTime: "20:00",
  }));
}

const emptyDatabase: DatabaseShape = {
  organizations: [{ ...DEFAULT_ORGANIZATION }],
  users: [{ ...DEFAULT_MANAGER_USER }],
  telegramBots: [{ ...DEFAULT_TELEGRAM_BOT }],
  leads: [],
  notes: [],
  customerNotes: [],
  history: [],
  masters: DEFAULT_MASTERS.map((master) => ({
    ...master,
    weeklySchedule: master.weeklySchedule.map((day) => ({ ...day })),
  })),
  services: DEFAULT_SERVICES.map((service) => ({ ...service })),
  settings: [
    {
      organizationId: DEFAULT_ORGANIZATION_ID,
      ...DEFAULT_BOOKING_SETTINGS,
    },
  ],
};

export async function ensureDatabase() {
  const existingOrganizations = await prisma.organization.count();

  if (existingOrganizations > 0) {
    return;
  }

  await writeDatabase(cloneData(emptyDatabase));
}
function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function renderBotTemplate(template: string, variables: BotTemplateVariables) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => {
    const value = variables[key];
    return value == null ? "" : String(value);
  });
}

function getDateKeyFromDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
  }).format(date);
}

function getDateKeyFromIso(value: string) {
  return getDateKeyFromDate(new Date(value));
}

function formatAppointmentLabel(value: string | null) {
  if (!value) {
    return "без записи";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value));
}

function formatPriceLabel(value: number | null) {
  return value == null ? "не указана" : `${value} ₽`;
}

function formatStatusLabel(status: LeadStatus) {
  switch (status) {
    case "CONFIRMED":
      return "CONFIRMED";
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "DONE":
      return "DONE";
    case "CANCELLED":
      return "CANCELLED";
    case "NO_SHOW":
      return "NO_SHOW";
    default:
      return "NEW";
  }
}

function getActorLabel(actor: LeadHistoryActor) {
  if (actor === "bot") {
    return "Бот";
  }

  if (actor === "system") {
    return "Система";
  }

  return "CRM";
}

function getWeekday(dateKey: string) {
  return new Date(`${dateKey}T12:00:00+03:00`).getUTCDay();
}

function isLeadBlockingSlot(lead: LeadRecord) {
  return Boolean(lead.appointmentAt && ACTIVE_BOOKING_STATUSES.includes(lead.status));
}

function normalizeBookingSettings(settings: BookingSettings | undefined) {
  const minLeadTimeMinutes =
    typeof settings?.minLeadTimeMinutes === "number" &&
    Number.isFinite(settings.minLeadTimeMinutes) &&
    settings.minLeadTimeMinutes >= 0
      ? settings.minLeadTimeMinutes
      : DEFAULT_BOOKING_SETTINGS.minLeadTimeMinutes;
  const managerName =
    typeof settings?.managerName === "string" && settings.managerName.trim()
      ? settings.managerName.trim()
      : DEFAULT_BOOKING_SETTINGS.managerName;
  const managerRole =
    typeof settings?.managerRole === "string" && settings.managerRole.trim()
      ? settings.managerRole.trim()
      : DEFAULT_BOOKING_SETTINGS.managerRole;
  const remindersEnabled =
    typeof settings?.remindersEnabled === "boolean"
      ? settings.remindersEnabled
      : DEFAULT_BOOKING_SETTINGS.remindersEnabled;
  const dayBeforeReminderEnabled =
    typeof settings?.dayBeforeReminderEnabled === "boolean"
      ? settings.dayBeforeReminderEnabled
      : DEFAULT_BOOKING_SETTINGS.dayBeforeReminderEnabled;
  const sameDayReminderEnabled =
    typeof settings?.sameDayReminderEnabled === "boolean"
      ? settings.sameDayReminderEnabled
      : DEFAULT_BOOKING_SETTINGS.sameDayReminderEnabled;
  const sameDayReminderMinutes =
    typeof settings?.sameDayReminderMinutes === "number" &&
    Number.isFinite(settings.sameDayReminderMinutes) &&
    settings.sameDayReminderMinutes > 0
      ? Math.round(settings.sameDayReminderMinutes)
      : DEFAULT_BOOKING_SETTINGS.sameDayReminderMinutes;
  const dayBeforeReminderMinutesRaw =
    typeof settings?.dayBeforeReminderMinutes === "number" &&
    Number.isFinite(settings.dayBeforeReminderMinutes) &&
    settings.dayBeforeReminderMinutes > 0
      ? Math.round(settings.dayBeforeReminderMinutes)
      : DEFAULT_BOOKING_SETTINGS.dayBeforeReminderMinutes;
  const dayBeforeReminderMinutes = Math.max(
    dayBeforeReminderMinutesRaw,
    sameDayReminderMinutes + 1,
  );
  const welcomeTemplate =
    typeof settings?.welcomeTemplate === "string" && settings.welcomeTemplate.trim()
      ? settings.welcomeTemplate.trim()
      : DEFAULT_BOOKING_SETTINGS.welcomeTemplate;
  const bookingCreatedTemplate =
    typeof settings?.bookingCreatedTemplate === "string" && settings.bookingCreatedTemplate.trim()
      ? settings.bookingCreatedTemplate.trim()
      : DEFAULT_BOOKING_SETTINGS.bookingCreatedTemplate;
  const reminderDayBeforeTemplate =
    typeof settings?.reminderDayBeforeTemplate === "string" &&
    settings.reminderDayBeforeTemplate.trim()
      ? settings.reminderDayBeforeTemplate.trim()
      : DEFAULT_BOOKING_SETTINGS.reminderDayBeforeTemplate;
  const reminderSameDayTemplate =
    typeof settings?.reminderSameDayTemplate === "string" &&
    settings.reminderSameDayTemplate.trim()
      ? settings.reminderSameDayTemplate.trim()
      : DEFAULT_BOOKING_SETTINGS.reminderSameDayTemplate;
  const bookingRescheduledTemplate =
    typeof settings?.bookingRescheduledTemplate === "string" &&
    settings.bookingRescheduledTemplate.trim()
      ? settings.bookingRescheduledTemplate.trim()
      : DEFAULT_BOOKING_SETTINGS.bookingRescheduledTemplate;
  const bookingCancelledTemplate =
    typeof settings?.bookingCancelledTemplate === "string" &&
    settings.bookingCancelledTemplate.trim()
      ? settings.bookingCancelledTemplate.trim()
      : DEFAULT_BOOKING_SETTINGS.bookingCancelledTemplate;

  return {
    minLeadTimeMinutes,
    managerName,
    managerRole,
    remindersEnabled,
    dayBeforeReminderEnabled,
    dayBeforeReminderMinutes,
    sameDayReminderEnabled,
    sameDayReminderMinutes,
    welcomeTemplate,
    bookingCreatedTemplate,
    reminderDayBeforeTemplate,
    reminderSameDayTemplate,
    bookingRescheduledTemplate,
    bookingCancelledTemplate,
  };
}

function normalizeOrganizations(organizations: Organization[] | undefined) {
  const nextOrganizations =
    organizations && organizations.length > 0
      ? organizations.map((organization) => ({
          id: organization.id,
          name: organization.name?.trim() || DEFAULT_ORGANIZATION.name,
          slug: organization.slug?.trim() || DEFAULT_ORGANIZATION.slug,
          createdAt: organization.createdAt ?? nowIso(),
          updatedAt: organization.updatedAt ?? organization.createdAt ?? nowIso(),
        }))
      : [{ ...DEFAULT_ORGANIZATION }];

  return nextOrganizations;
}

function normalizeUsers(users: ManagerUser[] | undefined, organizations: Organization[]) {
  const validOrganizationIds = new Set(organizations.map((organization) => organization.id));
  const nextUsers =
    users && users.length > 0
      ? users
          .filter((user) => validOrganizationIds.has(user.organizationId))
          .map((user) => ({
            id: user.id,
            organizationId: user.organizationId,
            name: user.name?.trim() || DEFAULT_MANAGER_USER.name,
            email: user.email?.trim() || DEFAULT_MANAGER_USER.email,
            role: user.role?.trim() || DEFAULT_MANAGER_USER.role,
            passwordHash: user.passwordHash ?? null,
            createdAt: user.createdAt ?? nowIso(),
            updatedAt: user.updatedAt ?? user.createdAt ?? nowIso(),
          }))
      : [];

  if (nextUsers.length > 0) {
    return nextUsers;
  }

  const organizationId = organizations[0]?.id ?? DEFAULT_ORGANIZATION_ID;
  return [
    {
      ...DEFAULT_MANAGER_USER,
      organizationId,
    },
  ];
}

function normalizeTelegramBots(
  telegramBots: TelegramBotConnection[] | undefined,
  organizations: Organization[],
) {
  const validOrganizationIds = new Set(organizations.map((organization) => organization.id));
  const nextBots =
    telegramBots && telegramBots.length > 0
      ? telegramBots
          .filter((bot) => validOrganizationIds.has(bot.organizationId))
          .map((bot) => ({
            id: bot.id,
            organizationId: bot.organizationId,
            token: bot.token ?? "",
            username: bot.username ?? null,
            isActive: bot.isActive ?? Boolean(bot.token),
            createdAt: bot.createdAt ?? nowIso(),
            updatedAt: bot.updatedAt ?? bot.createdAt ?? nowIso(),
          }))
      : [];

  if (nextBots.length > 0) {
    return nextBots;
  }

  const organizationId = organizations[0]?.id ?? DEFAULT_ORGANIZATION_ID;
  return [
    {
      ...DEFAULT_TELEGRAM_BOT,
      organizationId,
      token: process.env.TELEGRAM_BOT_TOKEN ?? DEFAULT_TELEGRAM_BOT.token,
      isActive: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    },
  ];
}

function normalizeOrganizationSettings(
  settings: OrganizationSettings[] | BookingSettings | undefined,
  organizations: Organization[],
) {
  const validOrganizationIds = new Set(organizations.map((organization) => organization.id));
  const nextSettings = Array.isArray(settings)
    ? settings
        .filter((item) => validOrganizationIds.has(item.organizationId))
        .map((item) => ({
          organizationId: item.organizationId,
          ...normalizeBookingSettings(item),
        }))
    : [];

  if (!Array.isArray(settings) && settings) {
    const organizationId = organizations[0]?.id ?? DEFAULT_ORGANIZATION_ID;
    nextSettings.push({
      organizationId,
      ...normalizeBookingSettings(settings),
    });
  }

  if (nextSettings.length > 0) {
    return organizations.map((organization) => {
      const current = nextSettings.find((item) => item.organizationId === organization.id);
      return (
        current ?? {
          organizationId: organization.id,
          ...DEFAULT_BOOKING_SETTINGS,
        }
      );
    });
  }

  return organizations.map((organization) => ({
    organizationId: organization.id,
    ...DEFAULT_BOOKING_SETTINGS,
  }));
}

function getDefaultOrganizationId(data: Pick<DatabaseShape, "organizations">) {
  return data.organizations[0]?.id ?? DEFAULT_ORGANIZATION_ID;
}

function getOrganizationSettings(data: DatabaseShape, organizationId = getDefaultOrganizationId(data)) {
  return (
    data.settings.find((item) => item.organizationId === organizationId) ?? {
      organizationId,
      ...DEFAULT_BOOKING_SETTINGS,
    }
  );
}

function isAppointmentInFuture(appointmentAt: string, minLeadMinutes: number) {
  const appointmentTimestamp = new Date(appointmentAt).getTime();
  const minAllowedTimestamp = Date.now() + minLeadMinutes * 60 * 1000;
  return appointmentTimestamp > minAllowedTimestamp;
}

function getActiveMastersFromData(data: DatabaseShape) {
  return data.masters
    .filter((master) => master.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getActiveServicesFromData(data: DatabaseShape) {
  return data.services
    .filter((service) => service.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getServiceDurationMinutes(serviceId: string | null | undefined, data: DatabaseShape) {
  return (
    data.services.find((service) => service.id === serviceId)?.durationMinutes ??
    DEFAULT_SERVICE_DURATION_MINUTES
  );
}

function getServicePrice(serviceId: string | null | undefined, data: DatabaseShape) {
  return data.services.find((service) => service.id === serviceId)?.price ?? null;
}

function normalizeWeeklySchedule(
  weeklySchedule: MasterScheduleDay[] | undefined,
): MasterScheduleDay[] {
  const defaults = createDefaultWeeklySchedule();

  return defaults.map((fallback) => {
    const current = weeklySchedule?.find((item) => item.dayOfWeek === fallback.dayOfWeek);
    const startTime = current?.startTime ?? fallback.startTime;
    const endTime = current?.endTime ?? fallback.endTime;

    return {
      dayOfWeek: fallback.dayOfWeek,
      isWorking: current?.isWorking ?? fallback.isWorking,
      startTime,
      endTime,
    };
  });
}

function normalizeMasters(masters: Master[] | undefined) {
  const nextMasters =
    masters && masters.length > 0
      ? masters.map((master, index) => ({
          id: master.id,
          organizationId: master.organizationId ?? DEFAULT_ORGANIZATION_ID,
          name: master.name,
          isActive: master.isActive ?? true,
          sortOrder: master.sortOrder ?? index + 1,
          weeklySchedule: normalizeWeeklySchedule(master.weeklySchedule),
        }))
      : DEFAULT_MASTERS.map((master) => ({
          ...master,
          weeklySchedule: normalizeWeeklySchedule(master.weeklySchedule),
        }));

  return [...nextMasters].sort((a, b) => a.sortOrder - b.sortOrder);
}

function normalizeServices(services: Service[] | undefined) {
  const nextServices =
    services && services.length > 0
      ? services.map((service, index) => ({
          id: service.id,
          organizationId: service.organizationId ?? DEFAULT_ORGANIZATION_ID,
          name: service.name,
          durationMinutes:
            Number.isFinite(service.durationMinutes) && service.durationMinutes > 0
              ? service.durationMinutes
              : DEFAULT_SERVICE_DURATION_MINUTES,
          price:
            typeof service.price === "number" && Number.isFinite(service.price)
              ? service.price
              : null,
          isActive: service.isActive ?? true,
          sortOrder: service.sortOrder ?? index + 1,
        }))
      : DEFAULT_SERVICES.map((service) => ({ ...service }));

  return [...nextServices].sort((a, b) => a.sortOrder - b.sortOrder);
}

function cloneData(data: DatabaseShape): DatabaseShape {
  return {
    organizations: data.organizations.map((organization) => ({ ...organization })),
    users: data.users.map((user) => ({ ...user })),
    telegramBots: data.telegramBots.map((bot) => ({ ...bot })),
    notes: data.notes.map((note) => ({ ...note })),
    customerNotes: data.customerNotes.map((note) => ({ ...note })),
    history: data.history.map((entry) => ({ ...entry })),
    masters: data.masters.map((master) => ({
      ...master,
      weeklySchedule: master.weeklySchedule.map((day) => ({ ...day })),
    })),
    services: data.services.map((service) => ({ ...service })),
    leads: data.leads.map((lead) => ({ ...lead })),
    settings: data.settings.map((setting) => ({ ...setting })),
  };
}

function getDaySchedule(master: Master, dateKey: string) {
  const weekday = getWeekday(dateKey);
  return master.weeklySchedule.find((day) => day.dayOfWeek === weekday) ?? null;
}

function isMasterWorkingForInterval(
  master: Master,
  dateKey: string,
  startMinutes: number,
  durationMinutes: number,
) {
  const schedule = getDaySchedule(master, dateKey);

  if (!schedule || !schedule.isWorking) {
    return false;
  }

  const scheduleStart = timeToMinutes(schedule.startTime);
  const scheduleEnd = timeToMinutes(schedule.endTime);
  const endMinutes = startMinutes + durationMinutes;

  return startMinutes >= scheduleStart && endMinutes <= scheduleEnd;
}

function intervalsOverlap(
  leftStart: number,
  leftDurationMinutes: number,
  rightStart: number,
  rightDurationMinutes: number,
) {
  const leftEnd = leftStart + leftDurationMinutes;
  const rightEnd = rightStart + rightDurationMinutes;
  return leftStart < rightEnd && rightStart < leftEnd;
}

function getAppointmentStartMinutes(appointmentAt: string) {
  return timeToMinutes(appointmentAt.slice(11, 16));
}

function getAvailableMastersForSlot(
  appointmentAt: string,
  serviceId: string | null | undefined,
  data: DatabaseShape,
  options: FindMasterOptions = {},
) {
  const organizationId =
    data.services.find((service) => service.id === serviceId)?.organizationId ??
    getDefaultOrganizationId(data);
  const settings = getOrganizationSettings(data, organizationId);

  if (!isAppointmentInFuture(appointmentAt, settings.minLeadTimeMinutes)) {
    return [];
  }

  const excludedMasterIds = new Set(options.excludedMasterIds ?? []);
  const activeMasters = getActiveMastersFromData(data).filter(
    (master) =>
      master.organizationId === organizationId && !excludedMasterIds.has(master.id),
  );
  const dateKey = getDateKeyFromIso(appointmentAt);
  const startMinutes = getAppointmentStartMinutes(appointmentAt);
  const durationMinutes = getServiceDurationMinutes(serviceId, data);

  return activeMasters.filter((master) => {
    if (!isMasterWorkingForInterval(master, dateKey, startMinutes, durationMinutes)) {
      return false;
    }

    return !data.leads.some((lead) => {
      if (
        lead.id === options.excludeLeadId ||
        lead.masterId !== master.id ||
        !lead.appointmentAt ||
        !isLeadBlockingSlot(lead) ||
        getDateKeyFromIso(lead.appointmentAt) !== dateKey
      ) {
        return false;
      }

      return intervalsOverlap(
        startMinutes,
        durationMinutes,
        getAppointmentStartMinutes(lead.appointmentAt),
        getServiceDurationMinutes(lead.serviceId, data),
      );
    });
  });
}

function getFirstFreeMasterForSlot(
  appointmentAt: string,
  serviceId: string | null | undefined,
  data: DatabaseShape,
  options: FindMasterOptions = {},
) {
  return getAvailableMastersForSlot(appointmentAt, serviceId, data, options)[0] ?? null;
}

function getLeadOverlappingSlot(lead: LeadRecord, dateKey: string, slotStartMinutes: number, data: DatabaseShape) {
  if (
    !lead.appointmentAt ||
    !isLeadBlockingSlot(lead) ||
    getDateKeyFromIso(lead.appointmentAt) !== dateKey
  ) {
    return false;
  }

  return intervalsOverlap(
    getAppointmentStartMinutes(lead.appointmentAt),
    getServiceDurationMinutes(lead.serviceId, data),
    slotStartMinutes,
    DEFAULT_TIME_INCREMENT_MINUTES,
  );
}

function listPotentialStartTimes(
  dateKey: string,
  durationMinutes: number,
  data: DatabaseShape,
  organizationId = getDefaultOrganizationId(data),
) {
  const slots = new Set<string>();

  for (const master of getActiveMastersFromData(data).filter(
    (item) => item.organizationId === organizationId,
  )) {
    const schedule = getDaySchedule(master, dateKey);

    if (!schedule || !schedule.isWorking) {
      continue;
    }

    const scheduleStart = timeToMinutes(schedule.startTime);
    const scheduleEnd = timeToMinutes(schedule.endTime);

    for (
      let current = scheduleStart;
      current + durationMinutes <= scheduleEnd;
      current += DEFAULT_TIME_INCREMENT_MINUTES
    ) {
      slots.add(minutesToTime(current));
    }
  }

  return [...slots].sort((left, right) => timeToMinutes(left) - timeToMinutes(right));
}

function getUpcomingDateKeys(daysAhead: number) {
  const today = new Date();

  return Array.from({ length: daysAhead }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() + index);
    return getDateKeyFromDate(current);
  });
}

function getDefaultServiceId(data: DatabaseShape) {
  const organizationId = getDefaultOrganizationId(data);
  return (
    getActiveServicesFromData(data).find((service) => service.organizationId === organizationId)?.id ??
    data.services.find((service) => service.organizationId === organizationId)?.id ??
    null
  );
}

function getOrganizationIdForService(data: DatabaseShape, serviceId?: string | null) {
  if (!serviceId) {
    return getDefaultOrganizationId(data);
  }

  return (
    data.services.find((service) => service.id === serviceId)?.organizationId ??
    getDefaultOrganizationId(data)
  );
}

function normalizeData(raw: DatabaseShape) {
  const organizations = normalizeOrganizations(raw.organizations);
  const users = normalizeUsers(raw.users, organizations);
  const telegramBots = normalizeTelegramBots(raw.telegramBots, organizations);
  const masters = normalizeMasters(raw.masters).map((master) => ({
    ...master,
    organizationId: master.organizationId ?? getDefaultOrganizationId({ organizations }),
  }));
  const services = normalizeServices(raw.services).map((service) => ({
    ...service,
    organizationId: service.organizationId ?? getDefaultOrganizationId({ organizations }),
  }));
  const settings = normalizeOrganizationSettings(raw.settings, organizations);
  const dataForResolution: DatabaseShape = {
    organizations,
    users,
    telegramBots,
    leads: [],
    notes: (raw.notes ?? []).map((note) => ({
      ...note,
      organizationId: note.organizationId ?? getDefaultOrganizationId({ organizations }),
    })),
    customerNotes: (raw.customerNotes ?? []).map((note) => ({
      ...note,
      organizationId: note.organizationId ?? getDefaultOrganizationId({ organizations }),
    })),
    history: (raw.history ?? []).map((entry) => ({
      ...entry,
      organizationId: entry.organizationId ?? getDefaultOrganizationId({ organizations }),
    })),
    masters,
    services,
    settings,
  };
  let changed =
    !raw.organizations ||
    raw.organizations.length === 0 ||
    !raw.users ||
    raw.users.length === 0 ||
    !raw.telegramBots ||
    !raw.masters ||
    raw.masters.length === 0 ||
    !raw.services ||
    raw.services.length === 0 ||
    !raw.history ||
    !raw.customerNotes ||
    !Array.isArray(raw.settings);

  const sortedLeads = [...(raw.leads ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const leads = sortedLeads.map((lead) => {
    const normalizedLead: LeadRecord = {
      ...lead,
      organizationId: lead.organizationId ?? getDefaultOrganizationId({ organizations }),
      appointmentAt: lead.appointmentAt ?? null,
      masterId: lead.masterId ?? null,
      serviceId:
        lead.serviceId &&
        services.some(
          (service) =>
            service.id === lead.serviceId &&
            service.organizationId ===
              (lead.organizationId ?? getDefaultOrganizationId({ organizations })),
        )
          ? lead.serviceId
          : getDefaultServiceId(dataForResolution),
      finalPrice:
        typeof lead.finalPrice === "number" && Number.isFinite(lead.finalPrice)
          ? lead.finalPrice
          : null,
      confirmedAt:
        lead.status === "CONFIRMED"
          ? lead.confirmedAt ?? lead.updatedAt
          : null,
      cancelledAt:
        lead.status === "CANCELLED"
          ? lead.cancelledAt ?? lead.updatedAt
          : null,
      noShowAt:
        lead.status === "NO_SHOW"
          ? lead.noShowAt ?? lead.updatedAt
          : null,
      completedAt:
        lead.status === "DONE"
          ? lead.completedAt ?? lead.updatedAt
          : null,
      reminderDayBeforeSentAt: lead.reminderDayBeforeSentAt ?? null,
      reminderSameDaySentAt: lead.reminderSameDaySentAt ?? null,
    };

    if (normalizedLead.serviceId !== lead.serviceId) {
      changed = true;
    }

    if (normalizedLead.completedAt !== (lead.completedAt ?? null)) {
      changed = true;
    }

    if (normalizedLead.confirmedAt !== (lead.confirmedAt ?? null)) {
      changed = true;
    }

    if (normalizedLead.cancelledAt !== (lead.cancelledAt ?? null)) {
      changed = true;
    }

    if (normalizedLead.noShowAt !== (lead.noShowAt ?? null)) {
      changed = true;
    }

    if (normalizedLead.reminderDayBeforeSentAt !== (lead.reminderDayBeforeSentAt ?? null)) {
      changed = true;
    }

    if (normalizedLead.reminderSameDaySentAt !== (lead.reminderSameDaySentAt ?? null)) {
      changed = true;
    }

    if (!normalizedLead.appointmentAt) {
      if (normalizedLead.masterId !== null) {
        normalizedLead.masterId = null;
        changed = true;
      }

      dataForResolution.leads.push(normalizedLead);
      return normalizedLead;
    }

    const currentMaster = masters.find((master) => master.id === normalizedLead.masterId);
    const isCurrentMasterValid =
      currentMaster &&
      getAvailableMastersForSlot(
        normalizedLead.appointmentAt,
        normalizedLead.serviceId,
        { ...dataForResolution, leads: [...dataForResolution.leads, normalizedLead] },
        { excludeLeadId: normalizedLead.id },
      ).some((master) => master.id === normalizedLead.masterId);

    if (!isCurrentMasterValid) {
      const nextMaster = getFirstFreeMasterForSlot(
        normalizedLead.appointmentAt,
        normalizedLead.serviceId,
        dataForResolution,
        { excludeLeadId: normalizedLead.id },
      );
      const nextMasterId = nextMaster?.id ?? null;

      if (normalizedLead.masterId !== nextMasterId) {
        normalizedLead.masterId = nextMasterId;
        changed = true;
      }
    }

    dataForResolution.leads.push(normalizedLead);
    return normalizedLead;
  });

    return {
      changed,
      data: {
        organizations,
        users,
        telegramBots,
        notes: dataForResolution.notes,
        customerNotes: dataForResolution.customerNotes,
        history: dataForResolution.history,
        leads,
        masters,
        services,
        settings,
      } satisfies DatabaseShape,
    };
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

async function readDatabase() {
  await ensureDatabase();

  const [organizations, users, telegramBots, settings, masters, schedules, services, leads, notes, customerNotes, history] =
    await Promise.all([
      prisma.organization.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.managerUser.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.telegramBotConnection.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.bookingSettings.findMany(),
      prisma.master.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.masterScheduleDay.findMany({ orderBy: [{ masterId: "asc" }, { dayOfWeek: "asc" }] }),
      prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.lead.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.leadNote.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.customerNote.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.leadHistoryEntry.findMany({ orderBy: { createdAt: "asc" } }),
    ]);

  const scheduleMap = new Map<string, MasterScheduleDay[]>();
  for (const schedule of schedules) {
    const bucket = scheduleMap.get(schedule.masterId) ?? [];
    bucket.push({
      dayOfWeek: schedule.dayOfWeek,
      isWorking: schedule.isWorking,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
    });
    scheduleMap.set(schedule.masterId, bucket);
  }

  const raw: DatabaseShape = {
    organizations: organizations.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    users: users.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      name: item.name,
      email: item.email,
      role: item.role,
      passwordHash: item.passwordHash,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    telegramBots: telegramBots.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      token: item.token,
      username: item.username,
      isActive: item.isActive,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    settings: settings.map((item) => ({
      organizationId: item.organizationId,
      minLeadTimeMinutes: item.minLeadTimeMinutes,
      managerName: item.managerName,
      managerRole: item.managerRole,
      remindersEnabled: item.remindersEnabled,
      dayBeforeReminderEnabled: item.dayBeforeReminderEnabled,
      dayBeforeReminderMinutes: item.dayBeforeReminderMinutes,
      sameDayReminderEnabled: item.sameDayReminderEnabled,
      sameDayReminderMinutes: item.sameDayReminderMinutes,
      welcomeTemplate: item.welcomeTemplate,
      bookingCreatedTemplate: item.bookingCreatedTemplate,
      reminderDayBeforeTemplate: item.reminderDayBeforeTemplate,
      reminderSameDayTemplate: item.reminderSameDayTemplate,
      bookingRescheduledTemplate: item.bookingRescheduledTemplate,
      bookingCancelledTemplate: item.bookingCancelledTemplate,
    })),
    masters: masters.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      name: item.name,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      weeklySchedule: scheduleMap.get(item.id) ?? [],
    })),
    services: services.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      name: item.name,
      durationMinutes: item.durationMinutes,
      price: item.price,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    })),
    leads: leads.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      telegramId: item.telegramId,
      name: item.name,
      phone: item.phone,
      comment: item.comment,
      status: item.status as LeadStatus,
      serviceId: item.serviceId,
      appointmentAt: toIsoString(item.appointmentAt),
      masterId: item.masterId,
      finalPrice: item.finalPrice,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      confirmedAt: toIsoString(item.confirmedAt),
      cancelledAt: toIsoString(item.cancelledAt),
      noShowAt: toIsoString(item.noShowAt),
      completedAt: toIsoString(item.completedAt),
      reminderDayBeforeSentAt: toIsoString(item.reminderDayBeforeSentAt),
      reminderSameDaySentAt: toIsoString(item.reminderSameDaySentAt),
    })),
    notes: notes.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      leadId: item.leadId,
      text: item.text,
      createdAt: item.createdAt.toISOString(),
    })),
    customerNotes: customerNotes.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      customerId: item.customerId,
      text: item.text,
      createdAt: item.createdAt.toISOString(),
    })),
    history: history.map((item) => ({
      id: item.id,
      organizationId: item.organizationId,
      leadId: item.leadId,
      action: item.action as LeadHistoryAction,
      actor: item.actor as LeadHistoryActor,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    })),
  };

  const normalized = normalizeData(raw);

  if (normalized.changed) {
    await writeDatabase(normalized.data);
  }

  return normalized.data;
}

async function writeDatabase(data: DatabaseShape) {
  await prisma.$transaction(async (tx) => {
    await tx.leadHistoryEntry.deleteMany();
    await tx.leadNote.deleteMany();
    await tx.customerNote.deleteMany();
    await tx.lead.deleteMany();
    await tx.masterScheduleDay.deleteMany();
    await tx.telegramBotConnection.deleteMany();
    await tx.bookingSettings.deleteMany();
    await tx.managerUser.deleteMany();
    await tx.service.deleteMany();
    await tx.master.deleteMany();
    await tx.organization.deleteMany();

    if (data.organizations.length > 0) {
      await tx.organization.createMany({
        data: data.organizations.map((item) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    }

    if (data.users.length > 0) {
      await tx.managerUser.createMany({
        data: data.users.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          name: item.name,
          email: item.email,
          role: item.role,
          passwordHash: item.passwordHash,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    }

    if (data.telegramBots.length > 0) {
      await tx.telegramBotConnection.createMany({
        data: data.telegramBots.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          token: item.token,
          username: item.username,
          isActive: item.isActive,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })),
      });
    }

    for (const item of data.settings) {
      await tx.bookingSettings.create({
        data: {
          organizationId: item.organizationId,
          minLeadTimeMinutes: item.minLeadTimeMinutes,
          managerName: item.managerName,
          managerRole: item.managerRole,
          remindersEnabled: item.remindersEnabled,
          dayBeforeReminderEnabled: item.dayBeforeReminderEnabled,
          dayBeforeReminderMinutes: item.dayBeforeReminderMinutes,
          sameDayReminderEnabled: item.sameDayReminderEnabled,
          sameDayReminderMinutes: item.sameDayReminderMinutes,
          welcomeTemplate: item.welcomeTemplate,
          bookingCreatedTemplate: item.bookingCreatedTemplate,
          reminderDayBeforeTemplate: item.reminderDayBeforeTemplate,
          reminderSameDayTemplate: item.reminderSameDayTemplate,
          bookingRescheduledTemplate: item.bookingRescheduledTemplate,
          bookingCancelledTemplate: item.bookingCancelledTemplate,
        },
      });
    }

    if (data.masters.length > 0) {
      await tx.master.createMany({
        data: data.masters.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          name: item.name,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
        })),
      });

      const scheduleRows = data.masters.flatMap((master) =>
        master.weeklySchedule.map((day) => ({
          id: `${master.id}_${day.dayOfWeek}`,
          masterId: master.id,
          dayOfWeek: day.dayOfWeek,
          isWorking: day.isWorking,
          startTime: day.startTime,
          endTime: day.endTime,
        })),
      );

      if (scheduleRows.length > 0) {
        await tx.masterScheduleDay.createMany({ data: scheduleRows });
      }
    }

    if (data.services.length > 0) {
      await tx.service.createMany({
        data: data.services.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          name: item.name,
          durationMinutes: item.durationMinutes,
          price: item.price,
          isActive: item.isActive,
          sortOrder: item.sortOrder,
        })),
      });
    }

    if (data.leads.length > 0) {
      await tx.lead.createMany({
        data: data.leads.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          telegramId: item.telegramId == null ? null : String(item.telegramId),
          name: item.name,
          phone: item.phone,
          comment: item.comment,
          status: item.status as any,
          serviceId: item.serviceId,
          appointmentAt: item.appointmentAt ? new Date(item.appointmentAt) : null,
          masterId: item.masterId,
          finalPrice: item.finalPrice,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          confirmedAt: item.confirmedAt ? new Date(item.confirmedAt) : null,
          cancelledAt: item.cancelledAt ? new Date(item.cancelledAt) : null,
          noShowAt: item.noShowAt ? new Date(item.noShowAt) : null,
          completedAt: item.completedAt ? new Date(item.completedAt) : null,
          reminderDayBeforeSentAt: item.reminderDayBeforeSentAt ? new Date(item.reminderDayBeforeSentAt) : null,
          reminderSameDaySentAt: item.reminderSameDaySentAt ? new Date(item.reminderSameDaySentAt) : null,
        })),
      });
    }

    if (data.notes.length > 0) {
      await tx.leadNote.createMany({
        data: data.notes.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          leadId: item.leadId,
          text: item.text,
          createdAt: new Date(item.createdAt),
        })),
      });
    }

    if (data.history.length > 0) {
      await tx.leadHistoryEntry.createMany({
        data: data.history.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          leadId: item.leadId,
          action: item.action as any,
          actor: item.actor as any,
          message: item.message,
          createdAt: new Date(item.createdAt),
        })),
      });
    }

    if (data.customerNotes.length > 0) {
      await tx.customerNote.createMany({
        data: data.customerNotes.map((item) => ({
          id: item.id,
          organizationId: item.organizationId,
          customerId: item.customerId,
          text: item.text,
          createdAt: new Date(item.createdAt),
        })),
      });
    }
  });
}

export async function importDatabaseSnapshot(snapshot: unknown) {
  const normalized = normalizeData(snapshot as DatabaseShape);
  await writeDatabase(normalized.data);
  return normalized.data;
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function listLeadNotes(leadId: string, data: DatabaseShape): LeadNote[] {
  return data.notes
    .filter((note) => note.leadId === leadId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function listLeadHistory(leadId: string, data: DatabaseShape): LeadHistoryEntry[] {
  return data.history
    .filter((entry) => entry.leadId === leadId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function listCustomerNotes(customerId: string, data: DatabaseShape): CustomerNote[] {
  return data.customerNotes
    .filter((note) => note.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function normalizePhoneKey(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits || value.trim().toLowerCase();
}

function getCustomerIdForLeadRecord(
  lead: Pick<LeadRecord, "id" | "organizationId" | "telegramId" | "phone">,
) {
  const telegramId =
    lead.telegramId == null ? "" : String(lead.telegramId).trim();
  const prefix = `${lead.organizationId}:`;

  if (telegramId) {
    return `${prefix}tg_${telegramId}`;
  }

  const phoneKey = normalizePhoneKey(lead.phone);

  if (phoneKey) {
    return `${prefix}ph_${phoneKey}`;
  }

  return `${prefix}lead_${lead.id}`;
}

function getLeadRevenue(row: LeadRecord, data: DatabaseShape) {
  if (row.status !== "DONE") {
    return 0;
  }

  if (typeof row.finalPrice === "number") {
    return row.finalPrice;
  }

  return (
    data.services.find(
      (service) =>
        service.id === row.serviceId && service.organizationId === row.organizationId,
    )?.price ?? 0
  );
}

function syncReminderStateForScheduledLead(
  lead: Pick<
    LeadRecord,
    | "organizationId"
    | "appointmentAt"
    | "reminderDayBeforeSentAt"
    | "reminderSameDaySentAt"
  >,
  data: DatabaseShape,
  referenceTimestamp: string,
) {
  if (!lead.appointmentAt) {
    lead.reminderDayBeforeSentAt = null;
    lead.reminderSameDaySentAt = null;
    return;
  }

  const settings = getOrganizationSettings(data, lead.organizationId);
  const appointmentDateKey = getDateKeyFromIso(lead.appointmentAt);
  const referenceDateKey = getDateKeyFromIso(referenceTimestamp);
  const diffMinutes = Math.round(
    (new Date(lead.appointmentAt).getTime() - new Date(referenceTimestamp).getTime()) / 60000,
  );

  if (appointmentDateKey === referenceDateKey) {
    lead.reminderSameDaySentAt = referenceTimestamp;
    return;
  }

  if (settings.sameDayReminderEnabled && diffMinutes <= settings.sameDayReminderMinutes) {
    lead.reminderSameDaySentAt = referenceTimestamp;
  }
}

function groupLeadRecordsByCustomer(data: DatabaseShape) {
  const grouped = new Map<string, LeadRecord[]>();

  for (const lead of data.leads) {
    const customerId = getCustomerIdForLeadRecord(lead);
    const bucket = grouped.get(customerId);

    if (bucket) {
      bucket.push(lead);
    } else {
      grouped.set(customerId, [lead]);
    }
  }

  return grouped;
}

function buildCustomerSummaryFromRows(
  customerId: string,
  rows: LeadRecord[],
  data: DatabaseShape,
): CustomerSummary {
  const sortedRows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latestLead = sortedRows[0];
  const lastAppointmentAt =
    [...rows]
      .filter((lead) => Boolean(lead.appointmentAt))
      .sort((a, b) => String(b.appointmentAt).localeCompare(String(a.appointmentAt)))[0]
      ?.appointmentAt ?? null;
  const favoriteServiceMap = new Map<string, number>();

  for (const lead of rows) {
    if (!lead.serviceId) {
      continue;
    }

    favoriteServiceMap.set(lead.serviceId, (favoriteServiceMap.get(lead.serviceId) ?? 0) + 1);
  }

  const favoriteServiceEntry =
    [...favoriteServiceMap.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
  const lastVisitAt =
    [...rows]
      .filter((lead) => lead.status === "DONE")
      .sort((a, b) =>
        String(b.completedAt ?? b.updatedAt).localeCompare(String(a.completedAt ?? a.updatedAt)),
      )[0]?.completedAt ?? null;

  return {
    id: customerId,
    name: latestLead.name,
    phone: latestLead.phone,
    telegramId: latestLead.telegramId ?? null,
    leadsCount: rows.length,
    bookedCount: rows.filter((lead) => ACTIVE_BOOKING_STATUSES.includes(lead.status)).length,
    doneCount: rows.filter((lead) => lead.status === "DONE").length,
    cancelledCount: rows.filter((lead) => lead.status === "CANCELLED").length,
    noShowCount: rows.filter((lead) => lead.status === "NO_SHOW").length,
    totalRevenue: rows.reduce((sum, lead) => sum + getLeadRevenue(lead, data), 0),
    lastLeadAt: latestLead.createdAt,
    lastAppointmentAt,
    lastVisitAt,
    favoriteServiceName:
      data.services.find(
        (service) =>
          service.id === favoriteServiceEntry?.[0] &&
          service.organizationId === latestLead.organizationId,
      )?.name ?? null,
    favoriteServiceCount: favoriteServiceEntry?.[1] ?? 0,
    latestLeadId: latestLead.id,
  };
}

function addHistoryEntry(
  data: DatabaseShape,
  leadId: string,
  action: LeadHistoryAction,
  actor: LeadHistoryActor,
  message: string,
) {
  const lead = data.leads.find((item) => item.id === leadId);
  data.history.push({
    id: createId("history"),
    organizationId: lead?.organizationId ?? getDefaultOrganizationId(data),
    leadId,
    action,
    actor,
    message,
    createdAt: nowIso(),
  });
}

function mapLead(row: LeadRecord, data: DatabaseShape): Lead {
  return {
    ...row,
    customerId: getCustomerIdForLeadRecord(row),
    appointmentAt: row.appointmentAt ?? null,
    masterId: row.masterId ?? null,
    serviceId: row.serviceId ?? null,
    finalPrice: row.finalPrice ?? null,
    completedAt: row.completedAt ?? null,
    notes: listLeadNotes(row.id, data),
    history: listLeadHistory(row.id, data),
    master:
      data.masters.find(
        (master) =>
          master.id === row.masterId && master.organizationId === row.organizationId,
      ) ?? null,
    service:
      data.services.find(
        (service) =>
          service.id === row.serviceId && service.organizationId === row.organizationId,
      ) ?? null,
  };
}

function rebalanceLeadsForMasterRemoval(masterId: string, data: DatabaseShape) {
  const draft = cloneData(data);
  const targetMaster = draft.masters.find((master) => master.id === masterId);

  if (!targetMaster) {
    throw new Error("Master not found");
  }

  targetMaster.isActive = false;
  const activeMasters = getActiveMastersFromData(draft).filter(
    (master) => master.organizationId === targetMaster.organizationId,
  );

  if (
    activeMasters.length === 0 &&
    draft.leads.some(
      (lead) => lead.organizationId === targetMaster.organizationId && lead.appointmentAt,
    )
  ) {
    throw new Error("Нельзя убрать последнего активного мастера, пока есть записи");
  }

  const affectedLeads = draft.leads
    .filter(
      (lead) =>
        lead.organizationId === targetMaster.organizationId &&
        lead.masterId === masterId &&
        lead.appointmentAt,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const lead of affectedLeads) {
    const nextMaster = getFirstFreeMasterForSlot(lead.appointmentAt as string, lead.serviceId, draft, {
      excludeLeadId: lead.id,
      excludedMasterIds: [masterId],
    });

    if (!nextMaster) {
      throw new Error(
        `Нельзя убрать мастера: на слот ${lead.appointmentAt} не хватит свободных мастеров`,
      );
    }

    lead.masterId = nextMaster.id;
  }

  return draft;
}

export async function listMasters() {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  return [...data.masters]
    .filter((master) => master.organizationId === organizationId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listActiveMasters() {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  return getActiveMastersFromData(data).filter(
    (master) => master.organizationId === organizationId,
  );
}

export async function getMasterById(id: string) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  return (
    data.masters.find(
      (master) => master.id === id && master.organizationId === organizationId,
    ) ?? null
  );
}

export async function createMaster(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Master name is required");
  }

  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const master: Master = {
    id: createId("master"),
    organizationId,
    name: trimmedName,
    isActive: true,
    sortOrder:
      data.masters
        .filter((item) => item.organizationId === organizationId)
        .reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1,
    weeklySchedule: createDefaultWeeklySchedule(),
  };

  data.masters.push(master);
  await writeDatabase(data);
  return master;
}

export async function updateMaster(id: string, input: UpdateMasterInput) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Master name is required");
  }

  let data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const master = data.masters.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  if (!master) {
    throw new Error("Master not found");
  }

  const normalizedSchedule = normalizeWeeklySchedule(input.weeklySchedule);

  if (master.isActive && !input.isActive) {
    data = rebalanceLeadsForMasterRemoval(id, data);
  }

  const nextMaster = data.masters.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  if (!nextMaster) {
    throw new Error("Master not found");
  }

  nextMaster.name = trimmedName;
  nextMaster.isActive = input.isActive;
  nextMaster.weeklySchedule = normalizedSchedule;
  await writeDatabase(data);
  return nextMaster;
}

export async function deleteMaster(id: string) {
  let data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const master = data.masters.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  if (!master) {
    throw new Error("Master not found");
  }

  const activeMastersCount = getActiveMastersFromData(data).filter(
    (item) => item.organizationId === organizationId,
  ).length;

  if (master.isActive && activeMastersCount <= 1) {
    throw new Error("Нужно оставить хотя бы одного активного мастера");
  }

  if (master.isActive) {
    data = rebalanceLeadsForMasterRemoval(id, data);
  }

  data.masters = data.masters.filter(
    (item) => item.id !== id || item.organizationId !== organizationId,
  );
  data.leads = data.leads.map((lead) =>
    lead.masterId === id && lead.organizationId === organizationId
      ? { ...lead, masterId: null }
      : lead,
  );
  await writeDatabase(data);
}

export async function listServices() {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  return [...data.services]
    .filter((service) => service.organizationId === organizationId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getBookingSettings() {
  const data = await readDatabase();
  return { ...getOrganizationSettings(data, getDefaultOrganizationId(data)) };
}

export async function updateBookingSettings(input: Partial<BookingSettings>) {
  if (
    input.minLeadTimeMinutes != null &&
    (!Number.isFinite(input.minLeadTimeMinutes) || input.minLeadTimeMinutes < 0)
  ) {
    throw new Error("Booking lead time is invalid");
  }

  if (
    input.sameDayReminderMinutes != null &&
    (!Number.isFinite(input.sameDayReminderMinutes) || input.sameDayReminderMinutes <= 0)
  ) {
    throw new Error("Same day reminder is invalid");
  }

  if (
    input.dayBeforeReminderMinutes != null &&
    (!Number.isFinite(input.dayBeforeReminderMinutes) || input.dayBeforeReminderMinutes <= 0)
  ) {
    throw new Error("Day before reminder is invalid");
  }

  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const currentSettings = getOrganizationSettings(data, organizationId);
  const nextSettings = normalizeBookingSettings({
    ...currentSettings,
    ...input,
  });
  const existingSettings = data.settings.find(
    (item) => item.organizationId === organizationId,
  );

  if (existingSettings) {
    Object.assign(existingSettings, { organizationId, ...nextSettings });
  } else {
    data.settings.push({ organizationId, ...nextSettings });
  }
  await writeDatabase(data);
  return { ...nextSettings };
}

export async function listActiveServices() {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  return getActiveServicesFromData(data).filter(
    (service) => service.organizationId === organizationId,
  );
}

export async function createService(input: UpdateServiceInput) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Service name is required");
  }

  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("Service duration is invalid");
  }

  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const service: Service = {
    id: createId("service"),
    organizationId,
    name: trimmedName,
    durationMinutes: input.durationMinutes,
    price: typeof input.price === "number" && Number.isFinite(input.price) ? input.price : null,
    isActive: input.isActive,
    sortOrder:
      data.services
        .filter((item) => item.organizationId === organizationId)
        .reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1,
  };

  data.services.push(service);
  await writeDatabase(data);
  return service;
}

export async function updateService(id: string, input: UpdateServiceInput) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Service name is required");
  }

  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("Service duration is invalid");
  }

  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const service = data.services.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  if (!service) {
    throw new Error("Service not found");
  }

  if (service.isActive && !input.isActive) {
    const activeServicesCount = getActiveServicesFromData(data).filter(
      (item) => item.organizationId === organizationId,
    ).length;

    if (activeServicesCount <= 1) {
      throw new Error("At least one active service must remain");
    }
  }

  service.name = trimmedName;
  service.durationMinutes = input.durationMinutes;
  service.price = typeof input.price === "number" && Number.isFinite(input.price) ? input.price : null;
  service.isActive = input.isActive;
  await writeDatabase(data);
  return service;
}

export async function deleteService(id: string) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const service = data.services.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  if (!service) {
    throw new Error("Service not found");
  }

  if (data.leads.some((lead) => lead.serviceId === id && lead.organizationId === organizationId)) {
    throw new Error("Service has leads");
  }

  const activeServicesCount = getActiveServicesFromData(data).filter(
    (item) => item.organizationId === organizationId,
  ).length;

  if (service.isActive && activeServicesCount <= 1) {
    throw new Error("At least one active service must remain");
  }

  data.services = data.services.filter(
    (item) => item.id !== id || item.organizationId !== organizationId,
  );
  await writeDatabase(data);
}

export async function listAvailableMastersForAppointment(
  appointmentAt: string,
  options: AppointmentAvailabilityOptions & { serviceId?: string | null } = {},
) {
  const data = await readDatabase();
  return getAvailableMastersForSlot(appointmentAt, options.serviceId ?? null, data, {
    excludeLeadId: options.excludeLeadId,
  });
}

export async function listDayTimeSlots(dateKey: string, serviceId?: string | null) {
  const data = await readDatabase();
  const organizationId = getOrganizationIdForService(data, serviceId ?? null);
  return listPotentialStartTimes(
    dateKey,
    getServiceDurationMinutes(serviceId ?? null, data),
    data,
    organizationId,
  );
}

export async function listAvailableTimeSlotsForDate(
  dateKey: string,
  serviceId?: string | null,
  options: AppointmentAvailabilityOptions = {},
) {
  const data = await readDatabase();
  const durationMinutes = getServiceDurationMinutes(serviceId ?? null, data);
  const organizationId = getOrganizationIdForService(data, serviceId ?? null);

  return listPotentialStartTimes(dateKey, durationMinutes, data, organizationId).filter((time) =>
    getFirstFreeMasterForSlot(`${dateKey}T${time}:00+03:00`, serviceId ?? null, data, {
      excludeLeadId: options.excludeLeadId,
    }) !== null,
  );
}

export async function listAvailableDateKeys(
  daysAhead: number,
  serviceId?: string | null,
  options: AppointmentAvailabilityOptions = {},
) {
  const availableDateKeys: string[] = [];

  for (const dateKey of getUpcomingDateKeys(daysAhead)) {
    const timeSlots = await listAvailableTimeSlotsForDate(
      dateKey,
      serviceId ?? null,
      options,
    );

    if (timeSlots.length > 0) {
      availableDateKeys.push(dateKey);
    }
  }

  return availableDateKeys;
}

export async function listLeads() {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);

  return [...data.leads]
    .filter((lead) => lead.organizationId === organizationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((lead) => mapLead(lead, data));
}

export async function listCustomers() {
  const data = await readDatabase();
  const grouped = groupLeadRecordsByCustomer({
    ...data,
    leads: data.leads.filter((lead) => lead.organizationId === getDefaultOrganizationId(data)),
  });

  return [...grouped.entries()]
    .map(([customerId, rows]) => buildCustomerSummaryFromRows(customerId, rows, data))
    .sort((a, b) => b.lastLeadAt.localeCompare(a.lastLeadAt));
}

export async function getCustomerById(id: string) {
  const data = await readDatabase();
  const grouped = groupLeadRecordsByCustomer({
    ...data,
    leads: data.leads.filter((lead) => lead.organizationId === getDefaultOrganizationId(data)),
  });
  const rows = grouped.get(id);

  if (!rows) {
    return null;
  }

  const leads = [...rows]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((lead) => mapLead(lead, data));
  const history = leads
    .flatMap((lead) =>
      lead.history.map((entry) => ({
        ...entry,
        leadName: lead.name,
        leadStatus: lead.status,
        leadAppointmentAt: lead.appointmentAt,
      })),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    ...buildCustomerSummaryFromRows(id, rows, data),
    leads,
    history,
    notes: listCustomerNotes(id, data),
  };
}

export async function addCustomerNote(customerId: string, text: string) {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Customer note text is required");
  }

  const data = await readDatabase();
  const grouped = groupLeadRecordsByCustomer(data);

  if (!grouped.has(customerId)) {
    throw new Error("Customer not found");
  }

  const note: CustomerNote = {
    id: createId("customer_note"),
    organizationId: grouped.get(customerId)?.[0]?.organizationId ?? getDefaultOrganizationId(data),
    customerId,
    text: trimmedText,
    createdAt: nowIso(),
  };

  data.customerNotes.push(note);
  await writeDatabase(data);
  return note;
}

export async function getLeadById(id: string) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = data.leads.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  return lead ? mapLead(lead, data) : null;
}

export async function isAppointmentSlotAvailable(
  appointmentAt: string,
  options: AppointmentAvailabilityOptions & { serviceId?: string | null } = {},
) {
  const data = await readDatabase();
  return (
    getFirstFreeMasterForSlot(appointmentAt, options.serviceId ?? null, data, {
      excludeLeadId: options.excludeLeadId,
    }) !== null
  );
}

export async function createLead(input: CreateLeadInput) {
  const data = await readDatabase();
  const organizationId = input.organizationId ?? getDefaultOrganizationId(data);
  const id = createId("lead");
  const timestamp = nowIso();
  const serviceId =
    input.serviceId &&
    data.services.some(
      (service) =>
        service.id === input.serviceId && service.organizationId === organizationId,
    )
      ? input.serviceId
      : getDefaultServiceId(data);

  if (input.serviceId && !serviceId) {
    throw new Error("Service is not available");
  }

  if (
    input.appointmentAt &&
    !isAppointmentInFuture(
      input.appointmentAt,
      getOrganizationSettings(data, organizationId).minLeadTimeMinutes,
    )
  ) {
    throw new Error("Appointment slot is in the past");
  }

  const assignedMaster = input.appointmentAt
    ? getFirstFreeMasterForSlot(input.appointmentAt, serviceId, data, { excludeLeadId: null })
    : null;

  if (input.appointmentAt && !assignedMaster) {
    throw new Error("Appointment slot is already taken");
  }

  const lead: LeadRecord = {
    id,
    organizationId,
    telegramId: input.telegramId ?? null,
    name: input.name,
    phone: input.phone,
    comment: input.comment,
    appointmentAt: input.appointmentAt ?? null,
    masterId: assignedMaster?.id ?? null,
    serviceId,
    finalPrice: null,
    confirmedAt: null,
    cancelledAt: null,
    noShowAt: null,
    completedAt: null,
    reminderDayBeforeSentAt: null,
    reminderSameDaySentAt: null,
    status: "NEW",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  syncReminderStateForScheduledLead(lead, data, timestamp);

  data.leads.push(lead);
  addHistoryEntry(
    data,
    lead.id,
    "lead_created",
    input.actor ?? "bot",
    `${getActorLabel(input.actor ?? "bot")} создал новую заявку`,
  );
  await writeDatabase(data);

  return mapLead(lead, data);
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  finalPrice?: number | null,
  options: UpdateLeadOptions = {},
) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const timestamp = nowIso();
  const lead = data.leads.find(
    (item) => item.id === id && item.organizationId === organizationId,
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  const actor = options.actor ?? "crm";
  const previousStatus = lead.status;
  const previousPrice = lead.finalPrice;
  const previousAppointmentAt = lead.appointmentAt;

  lead.status = status;
  lead.updatedAt = timestamp;

  if (typeof finalPrice === "number" && Number.isFinite(finalPrice)) {
    lead.finalPrice = finalPrice;
  }

  if (status === "DONE") {
    if (lead.finalPrice == null) {
      lead.finalPrice = getServicePrice(lead.serviceId, data);
    }
    lead.completedAt = timestamp;
  } else {
    lead.completedAt = null;
  }

  lead.confirmedAt = status === "CONFIRMED" ? timestamp : null;
  lead.cancelledAt = status === "CANCELLED" ? timestamp : null;
  lead.noShowAt = status === "NO_SHOW" ? timestamp : null;

  if (status === "CANCELLED") {
    lead.appointmentAt = null;
    lead.masterId = null;
    lead.reminderDayBeforeSentAt = null;
    lead.reminderSameDaySentAt = null;
  }

  if (previousStatus !== status) {
    addHistoryEntry(
      data,
      lead.id,
      "status_changed",
      actor,
      `${getActorLabel(actor)} изменил статус: ${formatStatusLabel(previousStatus)} -> ${formatStatusLabel(status)}`,
    );
  }

  if (status === "CANCELLED" && previousAppointmentAt) {
    addHistoryEntry(
      data,
      lead.id,
      "appointment_cancelled",
      actor,
      `${getActorLabel(actor)} отменил запись (${formatAppointmentLabel(previousAppointmentAt)})`,
    );
  }

  if (previousPrice !== lead.finalPrice) {
    addHistoryEntry(
      data,
      lead.id,
      "price_updated",
      actor,
      `${getActorLabel(actor)} обновил сумму: ${formatPriceLabel(previousPrice)} -> ${formatPriceLabel(lead.finalPrice)}`,
    );
  }

  await writeDatabase(data);

  return mapLead(lead, data);
}

export async function addLeadNote(
  leadId: string,
  text: string,
  options: UpdateLeadOptions = {},
) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = data.leads.find(
    (item) => item.id === leadId && item.organizationId === organizationId,
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  const id = createId("note");
  const timestamp = nowIso();
  const note: LeadNote = {
    id,
    organizationId: lead.organizationId,
    leadId,
    text,
    createdAt: timestamp,
  };

  data.notes.push(note);
  addHistoryEntry(
    data,
    leadId,
    "note_added",
    options.actor ?? "crm",
    `${getActorLabel(options.actor ?? "crm")} добавил заметку`,
  );
  await writeDatabase(data);

  return note;
}

export async function updateLeadAppointment(
  leadId: string,
  appointmentAt: string | null,
  options: UpdateLeadOptions = {},
) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const timestamp = nowIso();
  const lead = data.leads.find(
    (item) => item.id === leadId && item.organizationId === organizationId,
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (
    appointmentAt &&
    !isAppointmentInFuture(
      appointmentAt,
      getOrganizationSettings(data, lead.organizationId).minLeadTimeMinutes,
    )
  ) {
    throw new Error("Appointment slot is in the past");
  }

  const assignedMaster = appointmentAt
    ? getFirstFreeMasterForSlot(appointmentAt, lead.serviceId, data, { excludeLeadId: leadId })
    : null;

  if (appointmentAt && !assignedMaster) {
    throw new Error("Appointment slot is already taken");
  }

  const previousAppointmentAt = lead.appointmentAt;
  const previousStatus = lead.status;

  lead.appointmentAt = appointmentAt;
  lead.masterId = assignedMaster?.id ?? null;
  lead.updatedAt = timestamp;
  lead.completedAt = null;

  if (appointmentAt) {
    lead.status = "NEW";
    lead.confirmedAt = null;
    lead.cancelledAt = null;
    lead.noShowAt = null;
    lead.reminderDayBeforeSentAt = null;
    lead.reminderSameDaySentAt = null;
    syncReminderStateForScheduledLead(lead, data, timestamp);
  } else {
    lead.status = "CANCELLED";
    lead.confirmedAt = null;
    lead.cancelledAt = timestamp;
    lead.noShowAt = null;
    lead.reminderDayBeforeSentAt = null;
    lead.reminderSameDaySentAt = null;
  }

  if (previousStatus !== lead.status) {
    addHistoryEntry(
      data,
      leadId,
      "status_changed",
      options.actor ?? "crm",
      `${getActorLabel(options.actor ?? "crm")} изменил статус: ${formatStatusLabel(previousStatus)} -> ${formatStatusLabel(lead.status)}`,
    );
  }

  if (previousAppointmentAt !== appointmentAt) {
    addHistoryEntry(
      data,
      leadId,
      appointmentAt ? "appointment_changed" : "appointment_cancelled",
      options.actor ?? "crm",
      appointmentAt
        ? `${getActorLabel(options.actor ?? "crm")} изменил запись: ${formatAppointmentLabel(previousAppointmentAt)} -> ${formatAppointmentLabel(appointmentAt)}`
        : `${getActorLabel(options.actor ?? "crm")} отменил запись (${formatAppointmentLabel(previousAppointmentAt)})`,
    );
  }

  await writeDatabase(data);

  return mapLead(lead, data);
}

export async function updateLeadService(
  leadId: string,
  serviceId: string,
  options: UpdateLeadOptions = {},
) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = data.leads.find(
    (item) => item.id === leadId && item.organizationId === organizationId,
  );
  const service = data.services.find(
    (item) =>
      item.id === serviceId &&
      item.organizationId === organizationId &&
      item.isActive,
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (!service) {
    throw new Error("Service is not available");
  }

  const previousService = data.services.find(
    (item) =>
      item.id === lead.serviceId && item.organizationId === lead.organizationId,
  );

  lead.serviceId = serviceId;
  lead.updatedAt = nowIso();

  if (lead.appointmentAt) {
    const assignedMaster = getFirstFreeMasterForSlot(lead.appointmentAt, serviceId, data, {
      excludeLeadId: leadId,
    });

    if (!assignedMaster) {
      throw new Error("Appointment slot is already taken");
    }

    lead.masterId = assignedMaster.id;
  }

  if (lead.finalPrice == null && service.price != null) {
    lead.finalPrice = service.price;
  }

  addHistoryEntry(
    data,
    leadId,
    "service_changed",
    options.actor ?? "crm",
    `${getActorLabel(options.actor ?? "crm")} изменил услугу: ${previousService?.name ?? "не выбрана"} -> ${service.name}`,
  );

  await writeDatabase(data);
  return mapLead(lead, data);
}

export async function updateLeadMaster(
  leadId: string,
  masterId: string,
  options: UpdateLeadOptions = {},
) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = data.leads.find(
    (item) => item.id === leadId && item.organizationId === organizationId,
  );
  const master = data.masters.find(
    (item) =>
      item.id === masterId &&
      item.organizationId === organizationId &&
      item.isActive,
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (!lead.appointmentAt) {
    throw new Error("Lead does not have an appointment");
  }

  if (!master) {
    throw new Error("Master is not available");
  }

  const availableMasters = getAvailableMastersForSlot(lead.appointmentAt, lead.serviceId, data, {
    excludeLeadId: leadId,
  });

  if (!availableMasters.some((item) => item.id === masterId)) {
    throw new Error("Master is busy at this time");
  }

  const previousMaster = data.masters.find(
    (item) => item.id === lead.masterId && item.organizationId === lead.organizationId,
  );

  lead.masterId = masterId;
  lead.updatedAt = nowIso();
  addHistoryEntry(
    data,
    leadId,
    "master_changed",
    options.actor ?? "crm",
    `${getActorLabel(options.actor ?? "crm")} изменил мастера: ${previousMaster?.name ?? "не назначен"} -> ${master.name}`,
  );
  await writeDatabase(data);

  return mapLead(lead, data);
}

export async function getLatestLeadByTelegramId(telegramId: string) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = [...data.leads]
    .filter(
      (item) => item.telegramId === telegramId && item.organizationId === organizationId,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  return lead ? mapLead(lead, data) : null;
}

export async function getLatestBookedLeadByTelegramId(telegramId: string) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = [...data.leads]
    .filter(
      (item) =>
        item.organizationId === organizationId &&
        item.telegramId === telegramId &&
        item.appointmentAt &&
        ACTIVE_BOOKING_STATUSES.includes(item.status),
    )
    .sort((a, b) => {
      const aTime = a.appointmentAt ?? a.updatedAt;
      const bTime = b.appointmentAt ?? b.updatedAt;
      return bTime.localeCompare(aTime);
    })[0];

  return lead ? mapLead(lead, data) : null;
}

export async function listDueReminders(date = new Date()) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const settings = getOrganizationSettings(data, organizationId);
  const now = date.getTime();

  if (!settings.remindersEnabled) {
    return [];
  }

  return data.leads
    .filter(
      (lead) =>
        lead.organizationId === organizationId &&
        Boolean(lead.telegramId) &&
        Boolean(lead.appointmentAt) &&
        ["NEW", "CONFIRMED"].includes(lead.status),
    )
    .sort((left, right) => (left.appointmentAt ?? "").localeCompare(right.appointmentAt ?? ""))
    .reduce<DueReminder[]>((items, lead) => {
      const appointmentAt = new Date(lead.appointmentAt as string).getTime();
      const diffMinutes = Math.round((appointmentAt - now) / 60000);
      const createdOnSameDay =
        getDateKeyFromIso(lead.createdAt) === getDateKeyFromIso(lead.appointmentAt as string);

      if (
        settings.sameDayReminderEnabled &&
        diffMinutes > 0 &&
        diffMinutes <= settings.sameDayReminderMinutes &&
        !createdOnSameDay &&
        !lead.reminderSameDaySentAt
      ) {
        items.push({ lead: mapLead(lead, data), kind: "same_day" });
      }

      return items;
    }, []);
}

export async function markReminderSent(
  leadId: string,
  kind: ReminderKind,
  options: UpdateLeadOptions = {},
) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const lead = data.leads.find(
    (item) => item.id === leadId && item.organizationId === organizationId,
  );

  if (!lead) {
    throw new Error("Lead not found");
  }

  const actor = options.actor ?? "system";
  const timestamp = nowIso();

  if (kind === "day_before") {
    lead.reminderDayBeforeSentAt = timestamp;
  } else {
    lead.reminderSameDaySentAt = timestamp;
  }

  lead.updatedAt = timestamp;
  addHistoryEntry(
    data,
    leadId,
    "reminder_sent",
    actor,
    `${getActorLabel(actor)} отправил напоминание (${kind === "day_before" ? "за день" : "в день визита"})`,
  );
  await writeDatabase(data);

  return mapLead(lead, data);
}

export async function getMonthlyRevenue(date = new Date()) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const month = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
  }).format(date);

  return data.leads.reduce((sum, lead) => {
    if (lead.organizationId !== organizationId) {
      return sum;
    }
    if (lead.status !== "DONE" || lead.finalPrice == null || !lead.completedAt) {
      return sum;
    }

    const leadMonth = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
    }).format(new Date(lead.completedAt));

    return leadMonth === month ? sum + lead.finalPrice : sum;
  }, 0);
}

export async function countLeads() {
  const data = await readDatabase();
  return data.leads.filter((lead) => lead.organizationId === getDefaultOrganizationId(data)).length;
}

export async function listLeadsAffectingSlot(dateKey: string, time: string) {
  const data = await readDatabase();
  const organizationId = getDefaultOrganizationId(data);
  const slotStart = timeToMinutes(time);

  return data.leads
    .filter(
      (lead) =>
        lead.organizationId === organizationId &&
        getLeadOverlappingSlot(lead, dateKey, slotStart, data),
    )
    .map((lead) => mapLead(lead, data));
}






