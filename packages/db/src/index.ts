import fs from "node:fs";
import path from "node:path";

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
};

export type MasterScheduleDay = {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
};

export type Master = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  weeklySchedule: MasterScheduleDay[];
};

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number | null;
  isActive: boolean;
  sortOrder: number;
};

export type LeadNote = {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
};

export type LeadHistoryEntry = {
  id: string;
  leadId: string;
  action: LeadHistoryAction;
  actor: LeadHistoryActor;
  message: string;
  createdAt: string;
};

export type CustomerNote = {
  id: string;
  customerId: string;
  text: string;
  createdAt: string;
};

type LeadRecord = {
  id: string;
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
  leads: LeadRecord[];
  notes: LeadNote[];
  customerNotes: CustomerNote[];
  history: LeadHistoryEntry[];
  masters: Master[];
  services: Service[];
  settings: BookingSettings;
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

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/db.json";
const DEFAULT_TIME_INCREMENT_MINUTES = 60;
const DEFAULT_SERVICE_DURATION_MINUTES = 60;
const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  minLeadTimeMinutes: 0,
  managerName: "Alexander",
  managerRole: "CRM operator",
  remindersEnabled: true,
  dayBeforeReminderEnabled: true,
  dayBeforeReminderMinutes: 24 * 60,
  sameDayReminderEnabled: true,
  sameDayReminderMinutes: 120,
};
const ACTIVE_BOOKING_STATUSES: LeadStatus[] = ["NEW", "CONFIRMED", "IN_PROGRESS"];
const DEFAULT_MASTERS: Master[] = [
  {
    id: "master_1",
    name: "Мастер 1",
    isActive: true,
    sortOrder: 1,
    weeklySchedule: createDefaultWeeklySchedule(),
  },
  {
    id: "master_2",
    name: "Мастер 2",
    isActive: true,
    sortOrder: 2,
    weeklySchedule: createDefaultWeeklySchedule(),
  },
];
const DEFAULT_SERVICES: Service[] = [
  {
    id: "service_basic",
    name: "Базовая услуга",
    durationMinutes: 60,
    price: null,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "service_extended",
    name: "Длительная услуга",
    durationMinutes: 120,
    price: null,
    isActive: true,
    sortOrder: 2,
  },
];

function createDefaultWeeklySchedule(): MasterScheduleDay[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    isWorking: true,
    startTime: "10:00",
    endTime: "20:00",
  }));
}

function resolveDatabasePath(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice(5);
  }

  return databaseUrl;
}

const databasePath = resolveDatabasePath(DATABASE_URL);
const databaseDir = path.dirname(databasePath);

if (databaseDir && databaseDir !== ".") {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const emptyDatabase: DatabaseShape = {
  leads: [],
  notes: [],
  customerNotes: [],
  history: [],
  masters: DEFAULT_MASTERS.map((master) => ({
    ...master,
    weeklySchedule: master.weeklySchedule.map((day) => ({ ...day })),
  })),
  services: DEFAULT_SERVICES.map((service) => ({ ...service })),
  settings: { ...DEFAULT_BOOKING_SETTINGS },
};

export function ensureDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify(emptyDatabase, null, 2));
  }
}

ensureDatabase();

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

function normalizeBookingSettings(settings: BookingSettings | undefined): BookingSettings {
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

  return {
    minLeadTimeMinutes,
    managerName,
    managerRole,
    remindersEnabled,
    dayBeforeReminderEnabled,
    dayBeforeReminderMinutes,
    sameDayReminderEnabled,
    sameDayReminderMinutes,
  };
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
    notes: data.notes.map((note) => ({ ...note })),
    customerNotes: data.customerNotes.map((note) => ({ ...note })),
    history: data.history.map((entry) => ({ ...entry })),
    masters: data.masters.map((master) => ({
      ...master,
      weeklySchedule: master.weeklySchedule.map((day) => ({ ...day })),
    })),
    services: data.services.map((service) => ({ ...service })),
    leads: data.leads.map((lead) => ({ ...lead })),
    settings: { ...data.settings },
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
  if (!isAppointmentInFuture(appointmentAt, data.settings.minLeadTimeMinutes)) {
    return [];
  }

  const excludedMasterIds = new Set(options.excludedMasterIds ?? []);
  const activeMasters = getActiveMastersFromData(data).filter(
    (master) => !excludedMasterIds.has(master.id),
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

function listPotentialStartTimes(dateKey: string, durationMinutes: number, data: DatabaseShape) {
  const slots = new Set<string>();

  for (const master of getActiveMastersFromData(data)) {
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
  return getActiveServicesFromData(data)[0]?.id ?? data.services[0]?.id ?? null;
}

function normalizeData(raw: DatabaseShape) {
  const masters = normalizeMasters(raw.masters);
  const services = normalizeServices(raw.services);
  const dataForResolution: DatabaseShape = {
    leads: [],
    notes: raw.notes ?? [],
    customerNotes: raw.customerNotes ?? [],
    history: raw.history ?? [],
    masters,
    services,
    settings: normalizeBookingSettings(raw.settings),
  };
  let changed =
    !raw.masters ||
    raw.masters.length === 0 ||
    !raw.services ||
    raw.services.length === 0 ||
    !raw.history ||
    !raw.customerNotes;

  const sortedLeads = [...(raw.leads ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const leads = sortedLeads.map((lead) => {
    const normalizedLead: LeadRecord = {
      ...lead,
      appointmentAt: lead.appointmentAt ?? null,
      masterId: lead.masterId ?? null,
      serviceId:
        lead.serviceId && services.some((service) => service.id === lead.serviceId)
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
      notes: raw.notes ?? [],
      customerNotes: raw.customerNotes ?? [],
      history: raw.history ?? [],
      leads,
      masters,
      services,
      settings: normalizeBookingSettings(raw.settings),
    } satisfies DatabaseShape,
  };
}

function readDatabase(): DatabaseShape {
  ensureDatabase();
  const raw = JSON.parse(fs.readFileSync(databasePath, "utf-8")) as DatabaseShape;
  const normalized = normalizeData(raw);

  if (normalized.changed) {
    fs.writeFileSync(databasePath, JSON.stringify(normalized.data, null, 2));
  }

  return normalized.data;
}

function writeDatabase(data: DatabaseShape) {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
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

function getCustomerIdForLeadRecord(lead: Pick<LeadRecord, "id" | "telegramId" | "phone">) {
  const telegramId =
    lead.telegramId == null ? "" : String(lead.telegramId).trim();

  if (telegramId) {
    return `tg_${telegramId}`;
  }

  const phoneKey = normalizePhoneKey(lead.phone);

  if (phoneKey) {
    return `ph_${phoneKey}`;
  }

  return `lead_${lead.id}`;
}

function getLeadRevenue(row: LeadRecord, data: DatabaseShape) {
  if (row.status !== "DONE") {
    return 0;
  }

  if (typeof row.finalPrice === "number") {
    return row.finalPrice;
  }

  return data.services.find((service) => service.id === row.serviceId)?.price ?? 0;
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
      data.services.find((service) => service.id === favoriteServiceEntry?.[0])?.name ?? null,
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
  data.history.push({
    id: createId("history"),
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
    master: data.masters.find((master) => master.id === row.masterId) ?? null,
    service: data.services.find((service) => service.id === row.serviceId) ?? null,
  };
}

function rebalanceLeadsForMasterRemoval(masterId: string, data: DatabaseShape) {
  const draft = cloneData(data);
  const targetMaster = draft.masters.find((master) => master.id === masterId);

  if (!targetMaster) {
    throw new Error("Master not found");
  }

  targetMaster.isActive = false;
  const activeMasters = getActiveMastersFromData(draft);

  if (activeMasters.length === 0 && draft.leads.some((lead) => lead.appointmentAt)) {
    throw new Error("Нельзя убрать последнего активного мастера, пока есть записи");
  }

  const affectedLeads = draft.leads
    .filter((lead) => lead.masterId === masterId && lead.appointmentAt)
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

export function listMasters(): Master[] {
  const data = readDatabase();
  return [...data.masters].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listActiveMasters(): Master[] {
  return getActiveMastersFromData(readDatabase());
}

export function getMasterById(id: string): Master | null {
  const data = readDatabase();
  return data.masters.find((master) => master.id === id) ?? null;
}

export function createMaster(name: string): Master {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Master name is required");
  }

  const data = readDatabase();
  const master: Master = {
    id: createId("master"),
    name: trimmedName,
    isActive: true,
    sortOrder:
      data.masters.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1,
    weeklySchedule: createDefaultWeeklySchedule(),
  };

  data.masters.push(master);
  writeDatabase(data);
  return master;
}

export function updateMaster(id: string, input: UpdateMasterInput): Master {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Master name is required");
  }

  let data = readDatabase();
  const master = data.masters.find((item) => item.id === id);

  if (!master) {
    throw new Error("Master not found");
  }

  const normalizedSchedule = normalizeWeeklySchedule(input.weeklySchedule);

  if (master.isActive && !input.isActive) {
    data = rebalanceLeadsForMasterRemoval(id, data);
  }

  const nextMaster = data.masters.find((item) => item.id === id);

  if (!nextMaster) {
    throw new Error("Master not found");
  }

  nextMaster.name = trimmedName;
  nextMaster.isActive = input.isActive;
  nextMaster.weeklySchedule = normalizedSchedule;
  writeDatabase(data);
  return nextMaster;
}

export function deleteMaster(id: string) {
  let data = readDatabase();
  const master = data.masters.find((item) => item.id === id);

  if (!master) {
    throw new Error("Master not found");
  }

  const activeMastersCount = getActiveMastersFromData(data).length;

  if (master.isActive && activeMastersCount <= 1) {
    throw new Error("Нужно оставить хотя бы одного активного мастера");
  }

  if (master.isActive) {
    data = rebalanceLeadsForMasterRemoval(id, data);
  }

  data.masters = data.masters.filter((item) => item.id !== id);
  data.leads = data.leads.map((lead) =>
    lead.masterId === id ? { ...lead, masterId: null } : lead,
  );
  writeDatabase(data);
}

export function listServices(): Service[] {
  const data = readDatabase();
  return [...data.services].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getBookingSettings(): BookingSettings {
  return { ...readDatabase().settings };
}

export function updateBookingSettings(input: Partial<BookingSettings>): BookingSettings {
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

  const data = readDatabase();
  data.settings = normalizeBookingSettings({
    ...data.settings,
    ...input,
  });
  writeDatabase(data);
  return { ...data.settings };
}

export function listActiveServices(): Service[] {
  return getActiveServicesFromData(readDatabase());
}

export function createService(input: UpdateServiceInput): Service {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Service name is required");
  }

  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("Service duration is invalid");
  }

  const data = readDatabase();
  const service: Service = {
    id: createId("service"),
    name: trimmedName,
    durationMinutes: input.durationMinutes,
    price: typeof input.price === "number" && Number.isFinite(input.price) ? input.price : null,
    isActive: input.isActive,
    sortOrder:
      data.services.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1,
  };

  data.services.push(service);
  writeDatabase(data);
  return service;
}

export function updateService(id: string, input: UpdateServiceInput): Service {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Service name is required");
  }

  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes <= 0) {
    throw new Error("Service duration is invalid");
  }

  const data = readDatabase();
  const service = data.services.find((item) => item.id === id);

  if (!service) {
    throw new Error("Service not found");
  }

  if (service.isActive && !input.isActive) {
    const activeServicesCount = getActiveServicesFromData(data).length;

    if (activeServicesCount <= 1) {
      throw new Error("At least one active service must remain");
    }
  }

  service.name = trimmedName;
  service.durationMinutes = input.durationMinutes;
  service.price = typeof input.price === "number" && Number.isFinite(input.price) ? input.price : null;
  service.isActive = input.isActive;
  writeDatabase(data);
  return service;
}

export function deleteService(id: string) {
  const data = readDatabase();
  const service = data.services.find((item) => item.id === id);

  if (!service) {
    throw new Error("Service not found");
  }

  if (data.leads.some((lead) => lead.serviceId === id)) {
    throw new Error("Service has leads");
  }

  const activeServicesCount = getActiveServicesFromData(data).length;

  if (service.isActive && activeServicesCount <= 1) {
    throw new Error("At least one active service must remain");
  }

  data.services = data.services.filter((item) => item.id !== id);
  writeDatabase(data);
}

export function listAvailableMastersForAppointment(
  appointmentAt: string,
  options: AppointmentAvailabilityOptions & { serviceId?: string | null } = {},
): Master[] {
  const data = readDatabase();
  return getAvailableMastersForSlot(appointmentAt, options.serviceId ?? null, data, {
    excludeLeadId: options.excludeLeadId,
  });
}

export function listDayTimeSlots(dateKey: string, serviceId?: string | null) {
  const data = readDatabase();
  return listPotentialStartTimes(
    dateKey,
    getServiceDurationMinutes(serviceId ?? null, data),
    data,
  );
}

export function listAvailableTimeSlotsForDate(
  dateKey: string,
  serviceId?: string | null,
  options: AppointmentAvailabilityOptions = {},
) {
  const data = readDatabase();
  const durationMinutes = getServiceDurationMinutes(serviceId ?? null, data);

  return listPotentialStartTimes(dateKey, durationMinutes, data).filter((time) =>
    getFirstFreeMasterForSlot(`${dateKey}T${time}:00+03:00`, serviceId ?? null, data, {
      excludeLeadId: options.excludeLeadId,
    }) !== null,
  );
}

export function listAvailableDateKeys(
  daysAhead: number,
  serviceId?: string | null,
  options: AppointmentAvailabilityOptions = {},
) {
  return getUpcomingDateKeys(daysAhead).filter(
    (dateKey) =>
      listAvailableTimeSlotsForDate(dateKey, serviceId ?? null, options).length > 0,
  );
}

export function listLeads(): Lead[] {
  const data = readDatabase();

  return [...data.leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((lead) => mapLead(lead, data));
}

export function listCustomers(): CustomerSummary[] {
  const data = readDatabase();
  const grouped = groupLeadRecordsByCustomer(data);

  return [...grouped.entries()]
    .map(([customerId, rows]) => buildCustomerSummaryFromRows(customerId, rows, data))
    .sort((a, b) => b.lastLeadAt.localeCompare(a.lastLeadAt));
}

export function getCustomerById(id: string): Customer | null {
  const data = readDatabase();
  const grouped = groupLeadRecordsByCustomer(data);
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

export function addCustomerNote(customerId: string, text: string): CustomerNote {
  const trimmedText = text.trim();

  if (!trimmedText) {
    throw new Error("Customer note text is required");
  }

  const data = readDatabase();
  const grouped = groupLeadRecordsByCustomer(data);

  if (!grouped.has(customerId)) {
    throw new Error("Customer not found");
  }

  const note: CustomerNote = {
    id: createId("customer_note"),
    customerId,
    text: trimmedText,
    createdAt: nowIso(),
  };

  data.customerNotes.push(note);
  writeDatabase(data);
  return note;
}

export function getLeadById(id: string): Lead | null {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === id);

  return lead ? mapLead(lead, data) : null;
}

export function isAppointmentSlotAvailable(
  appointmentAt: string,
  options: AppointmentAvailabilityOptions & { serviceId?: string | null } = {},
) {
  const data = readDatabase();
  return (
    getFirstFreeMasterForSlot(appointmentAt, options.serviceId ?? null, data, {
      excludeLeadId: options.excludeLeadId,
    }) !== null
  );
}

export function createLead(input: CreateLeadInput): Lead {
  const data = readDatabase();
  const id = createId("lead");
  const timestamp = nowIso();
  const serviceId =
    input.serviceId && data.services.some((service) => service.id === input.serviceId)
      ? input.serviceId
      : getDefaultServiceId(data);

  if (input.serviceId && !serviceId) {
    throw new Error("Service is not available");
  }

  if (input.appointmentAt && !isAppointmentInFuture(input.appointmentAt, data.settings.minLeadTimeMinutes)) {
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

  data.leads.push(lead);
  addHistoryEntry(
    data,
    lead.id,
    "lead_created",
    input.actor ?? "bot",
    `${getActorLabel(input.actor ?? "bot")} создал новую заявку`,
  );
  writeDatabase(data);

  return mapLead(lead, data);
}

export function updateLeadStatus(
  id: string,
  status: LeadStatus,
  finalPrice?: number | null,
  options: UpdateLeadOptions = {},
): Lead {
  const data = readDatabase();
  const timestamp = nowIso();
  const lead = data.leads.find((item) => item.id === id);

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

  writeDatabase(data);

  return mapLead(lead, data);
}

export function addLeadNote(
  leadId: string,
  text: string,
  options: UpdateLeadOptions = {},
): LeadNote {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const id = createId("note");
  const timestamp = nowIso();
  const note: LeadNote = {
    id,
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
  writeDatabase(data);

  return note;
}

export function updateLeadAppointment(
  leadId: string,
  appointmentAt: string | null,
  options: UpdateLeadOptions = {},
): Lead {
  const data = readDatabase();
  const timestamp = nowIso();
  const lead = data.leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (appointmentAt && !isAppointmentInFuture(appointmentAt, data.settings.minLeadTimeMinutes)) {
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

  writeDatabase(data);

  return mapLead(lead, data);
}

export function updateLeadService(
  leadId: string,
  serviceId: string,
  options: UpdateLeadOptions = {},
): Lead {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === leadId);
  const service = data.services.find((item) => item.id === serviceId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (!service || !service.isActive) {
    throw new Error("Service is not available");
  }

  const previousService = data.services.find((item) => item.id === lead.serviceId);

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

  writeDatabase(data);
  return mapLead(lead, data);
}

export function updateLeadMaster(
  leadId: string,
  masterId: string,
  options: UpdateLeadOptions = {},
): Lead {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === leadId);
  const master = data.masters.find((item) => item.id === masterId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (!lead.appointmentAt) {
    throw new Error("Lead does not have an appointment");
  }

  if (!master || !master.isActive) {
    throw new Error("Master is not available");
  }

  const availableMasters = getAvailableMastersForSlot(lead.appointmentAt, lead.serviceId, data, {
    excludeLeadId: leadId,
  });

  if (!availableMasters.some((item) => item.id === masterId)) {
    throw new Error("Master is busy at this time");
  }

  const previousMaster = data.masters.find((item) => item.id === lead.masterId);

  lead.masterId = masterId;
  lead.updatedAt = nowIso();
  addHistoryEntry(
    data,
    leadId,
    "master_changed",
    options.actor ?? "crm",
    `${getActorLabel(options.actor ?? "crm")} изменил мастера: ${previousMaster?.name ?? "не назначен"} -> ${master.name}`,
  );
  writeDatabase(data);

  return mapLead(lead, data);
}

export function getLatestLeadByTelegramId(telegramId: string): Lead | null {
  const data = readDatabase();
  const lead = [...data.leads]
    .filter((item) => item.telegramId === telegramId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  return lead ? mapLead(lead, data) : null;
}

export function getLatestBookedLeadByTelegramId(telegramId: string): Lead | null {
  const data = readDatabase();
  const lead = [...data.leads]
    .filter(
      (item) =>
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

export function listDueReminders(date = new Date()): DueReminder[] {
  const data = readDatabase();
  const settings = data.settings;
  const now = date.getTime();

  if (!settings.remindersEnabled) {
    return [];
  }

  return data.leads
    .filter(
      (lead) =>
        Boolean(lead.telegramId) &&
        Boolean(lead.appointmentAt) &&
        ["NEW", "CONFIRMED"].includes(lead.status),
    )
    .sort((left, right) => (left.appointmentAt ?? "").localeCompare(right.appointmentAt ?? ""))
    .reduce<DueReminder[]>((items, lead) => {
      const appointmentAt = new Date(lead.appointmentAt as string).getTime();
      const diffMinutes = Math.round((appointmentAt - now) / 60000);

      if (
        settings.sameDayReminderEnabled &&
        diffMinutes > 0 &&
        diffMinutes <= settings.sameDayReminderMinutes &&
        !lead.reminderSameDaySentAt
      ) {
        items.push({ lead: mapLead(lead, data), kind: "same_day" });
        return items;
      }

      if (
        settings.dayBeforeReminderEnabled &&
        diffMinutes > settings.sameDayReminderMinutes &&
        diffMinutes <= settings.dayBeforeReminderMinutes &&
        !lead.reminderDayBeforeSentAt
      ) {
        items.push({ lead: mapLead(lead, data), kind: "day_before" });
      }

      return items;
    }, []);
}

export function markReminderSent(
  leadId: string,
  kind: ReminderKind,
  options: UpdateLeadOptions = {},
) {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === leadId);

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
  writeDatabase(data);

  return mapLead(lead, data);
}

export function getMonthlyRevenue(date = new Date()) {
  const data = readDatabase();
  const month = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
  }).format(date);

  return data.leads.reduce((sum, lead) => {
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

export function countLeads() {
  return readDatabase().leads.length;
}

export function listLeadsAffectingSlot(dateKey: string, time: string) {
  const data = readDatabase();
  const slotStart = timeToMinutes(time);

  return data.leads
    .filter((lead) => getLeadOverlappingSlot(lead, dateKey, slotStart, data))
    .map((lead) => mapLead(lead, data));
}
