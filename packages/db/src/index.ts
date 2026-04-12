import * as jsonStore from "./json-store.js";
import * as postgresStore from "./postgres-store.js";
export { prisma } from "./prisma.js";

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return value;
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

const databaseUrl = normalizeEnvValue(process.env.DATABASE_URL);

if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
}

const usePostgres = /^postgres(?:ql)?:\/\//i.test(databaseUrl ?? "");

export type {
  BookingSettings,
  BotTemplateVariables,
  Customer,
  CustomerNote,
  CustomerSummary,
  DueReminder,
  Lead,
  LeadHistoryAction,
  LeadHistoryActor,
  LeadHistoryEntry,
  LeadNote,
  LeadStatus,
  ManagerUser,
  Master,
  MasterScheduleDay,
  Organization,
  OrganizationSettings,
  ReminderKind,
  Service,
  TelegramBotConnection,
} from "./json-store.js";

export const renderBotTemplate = jsonStore.renderBotTemplate;

export async function ensureDatabase() {
  return usePostgres ? postgresStore.ensureDatabase() : Promise.resolve(jsonStore.ensureDatabase());
}

export async function listMasters(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.listMasters(organizationId)
    : Promise.resolve(jsonStore.listMasters(organizationId));
}

export async function listActiveMasters(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.listActiveMasters(organizationId)
    : Promise.resolve(jsonStore.listActiveMasters(organizationId));
}

export async function getMasterById(id: string, organizationId?: string | null) {
  return usePostgres
    ? postgresStore.getMasterById(id, organizationId)
    : Promise.resolve(jsonStore.getMasterById(id, organizationId));
}

export async function createMaster(name: string, organizationId?: string | null) {
  return usePostgres
    ? postgresStore.createMaster(name, organizationId)
    : Promise.resolve(jsonStore.createMaster(name, organizationId));
}

export async function updateMaster(
  id: string,
  input: Parameters<typeof jsonStore.updateMaster>[1],
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.updateMaster(id, input, organizationId)
    : Promise.resolve(jsonStore.updateMaster(id, input, organizationId));
}

export async function deleteMaster(id: string, organizationId?: string | null) {
  return usePostgres
    ? postgresStore.deleteMaster(id, organizationId)
    : Promise.resolve(jsonStore.deleteMaster(id, organizationId));
}

export async function listServices(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.listServices(organizationId)
    : Promise.resolve(jsonStore.listServices(organizationId));
}

export async function getBookingSettings(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.getBookingSettings(organizationId)
    : Promise.resolve(jsonStore.getBookingSettings(organizationId));
}

export async function updateBookingSettings(
  input: Parameters<typeof jsonStore.updateBookingSettings>[0],
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.updateBookingSettings(input, organizationId)
    : Promise.resolve(jsonStore.updateBookingSettings(input, organizationId));
}

export async function listActiveServices(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.listActiveServices(organizationId)
    : Promise.resolve(jsonStore.listActiveServices(organizationId));
}

export async function createService(
  input: Parameters<typeof jsonStore.createService>[0],
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.createService(input, organizationId)
    : Promise.resolve(jsonStore.createService(input, organizationId));
}

export async function updateService(
  id: string,
  input: Parameters<typeof jsonStore.updateService>[1],
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.updateService(id, input, organizationId)
    : Promise.resolve(jsonStore.updateService(id, input, organizationId));
}

export async function deleteService(id: string, organizationId?: string | null) {
  return usePostgres
    ? postgresStore.deleteService(id, organizationId)
    : Promise.resolve(jsonStore.deleteService(id, organizationId));
}

export async function listAvailableMastersForAppointment(
  appointmentAt: string,
  options: Parameters<typeof jsonStore.listAvailableMastersForAppointment>[1] = {},
) {
  return usePostgres
    ? postgresStore.listAvailableMastersForAppointment(appointmentAt, options)
    : Promise.resolve(jsonStore.listAvailableMastersForAppointment(appointmentAt, options));
}

export async function listDayTimeSlots(
  dateKey: string,
  serviceId?: string | null,
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.listDayTimeSlots(dateKey, serviceId, organizationId)
    : Promise.resolve(jsonStore.listDayTimeSlots(dateKey, serviceId, organizationId));
}

export async function listAvailableTimeSlotsForDate(
  dateKey: string,
  serviceId?: string | null,
  options: Parameters<typeof jsonStore.listAvailableTimeSlotsForDate>[2] = {},
) {
  return usePostgres
    ? postgresStore.listAvailableTimeSlotsForDate(dateKey, serviceId, options)
    : Promise.resolve(jsonStore.listAvailableTimeSlotsForDate(dateKey, serviceId, options));
}

export async function listAvailableDateKeys(
  daysAhead: number,
  serviceId?: string | null,
  options: Parameters<typeof jsonStore.listAvailableDateKeys>[2] = {},
) {
  return usePostgres
    ? postgresStore.listAvailableDateKeys(daysAhead, serviceId, options)
    : Promise.resolve(jsonStore.listAvailableDateKeys(daysAhead, serviceId, options));
}

export async function listLeads(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.listLeads(organizationId)
    : Promise.resolve(jsonStore.listLeads(organizationId));
}

export async function listCustomers(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.listCustomers(organizationId)
    : Promise.resolve(jsonStore.listCustomers(organizationId));
}

export async function getCustomerById(id: string, organizationId?: string | null) {
  return usePostgres
    ? postgresStore.getCustomerById(id, organizationId)
    : Promise.resolve(jsonStore.getCustomerById(id, organizationId));
}

export async function addCustomerNote(
  customerId: string,
  text: string,
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.addCustomerNote(customerId, text, organizationId)
    : Promise.resolve(jsonStore.addCustomerNote(customerId, text, organizationId));
}

export async function getLeadById(id: string, organizationId?: string | null) {
  return usePostgres
    ? postgresStore.getLeadById(id, organizationId)
    : Promise.resolve(jsonStore.getLeadById(id, organizationId));
}

export async function isAppointmentSlotAvailable(
  appointmentAt: string,
  options: Parameters<typeof jsonStore.isAppointmentSlotAvailable>[1] = {},
) {
  return usePostgres
    ? postgresStore.isAppointmentSlotAvailable(appointmentAt, options)
    : Promise.resolve(jsonStore.isAppointmentSlotAvailable(appointmentAt, options));
}

export async function createLead(input: Parameters<typeof jsonStore.createLead>[0]) {
  return usePostgres ? postgresStore.createLead(input) : Promise.resolve(jsonStore.createLead(input));
}

export async function updateLeadStatus(
  id: string,
  status: Parameters<typeof jsonStore.updateLeadStatus>[1],
  finalPrice?: number | null,
  options: Parameters<typeof jsonStore.updateLeadStatus>[3] = {},
) {
  return usePostgres
    ? postgresStore.updateLeadStatus(id, status, finalPrice, options)
    : Promise.resolve(jsonStore.updateLeadStatus(id, status, finalPrice, options));
}

export async function addLeadNote(
  leadId: string,
  text: string,
  options: Parameters<typeof jsonStore.addLeadNote>[2] = {},
) {
  return usePostgres
    ? postgresStore.addLeadNote(leadId, text, options)
    : Promise.resolve(jsonStore.addLeadNote(leadId, text, options));
}

export async function updateLeadAppointment(
  leadId: string,
  appointmentAt: string | null,
  options: Parameters<typeof jsonStore.updateLeadAppointment>[2] = {},
) {
  return usePostgres
    ? postgresStore.updateLeadAppointment(leadId, appointmentAt, options)
    : Promise.resolve(jsonStore.updateLeadAppointment(leadId, appointmentAt, options));
}

export async function updateLeadService(
  leadId: string,
  serviceId: string,
  options: Parameters<typeof jsonStore.updateLeadService>[2] = {},
) {
  return usePostgres
    ? postgresStore.updateLeadService(leadId, serviceId, options)
    : Promise.resolve(jsonStore.updateLeadService(leadId, serviceId, options));
}

export async function updateLeadMaster(
  leadId: string,
  masterId: string,
  options: Parameters<typeof jsonStore.updateLeadMaster>[2] = {},
) {
  return usePostgres
    ? postgresStore.updateLeadMaster(leadId, masterId, options)
    : Promise.resolve(jsonStore.updateLeadMaster(leadId, masterId, options));
}

export async function getLatestLeadByTelegramId(telegramId: string) {
  return usePostgres
    ? postgresStore.getLatestLeadByTelegramId(telegramId)
    : Promise.resolve(jsonStore.getLatestLeadByTelegramId(telegramId));
}

export async function getLatestBookedLeadByTelegramId(telegramId: string) {
  return usePostgres
    ? postgresStore.getLatestBookedLeadByTelegramId(telegramId)
    : Promise.resolve(jsonStore.getLatestBookedLeadByTelegramId(telegramId));
}

export async function listDueReminders(date = new Date()) {
  return usePostgres
    ? postgresStore.listDueReminders(date)
    : Promise.resolve(jsonStore.listDueReminders(date));
}

export async function markReminderSent(
  leadId: string,
  kind: Parameters<typeof jsonStore.markReminderSent>[1],
  options: Parameters<typeof jsonStore.markReminderSent>[2] = {},
) {
  return usePostgres
    ? postgresStore.markReminderSent(leadId, kind, options)
    : Promise.resolve(jsonStore.markReminderSent(leadId, kind, options));
}

export async function getMonthlyRevenue(date = new Date(), organizationId?: string | null) {
  return usePostgres
    ? postgresStore.getMonthlyRevenue(date, organizationId)
    : Promise.resolve(jsonStore.getMonthlyRevenue(date, organizationId));
}

export async function countLeads(organizationId?: string | null) {
  return usePostgres
    ? postgresStore.countLeads(organizationId)
    : Promise.resolve(jsonStore.countLeads(organizationId));
}

export async function listLeadsAffectingSlot(
  dateKey: string,
  time: string,
  organizationId?: string | null,
) {
  return usePostgres
    ? postgresStore.listLeadsAffectingSlot(dateKey, time, organizationId)
    : Promise.resolve(jsonStore.listLeadsAffectingSlot(dateKey, time, organizationId));
}
