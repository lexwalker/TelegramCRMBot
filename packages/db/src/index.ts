import * as jsonStore from "./json-store.js";
import * as postgresStore from "./postgres-store.js";

const usePostgres = /^postgres(?:ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");

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

export async function listMasters() {
  return usePostgres ? postgresStore.listMasters() : Promise.resolve(jsonStore.listMasters());
}

export async function listActiveMasters() {
  return usePostgres
    ? postgresStore.listActiveMasters()
    : Promise.resolve(jsonStore.listActiveMasters());
}

export async function getMasterById(id: string) {
  return usePostgres ? postgresStore.getMasterById(id) : Promise.resolve(jsonStore.getMasterById(id));
}

export async function createMaster(name: string) {
  return usePostgres ? postgresStore.createMaster(name) : Promise.resolve(jsonStore.createMaster(name));
}

export async function updateMaster(
  id: string,
  input: Parameters<typeof jsonStore.updateMaster>[1],
) {
  return usePostgres
    ? postgresStore.updateMaster(id, input)
    : Promise.resolve(jsonStore.updateMaster(id, input));
}

export async function deleteMaster(id: string) {
  return usePostgres ? postgresStore.deleteMaster(id) : Promise.resolve(jsonStore.deleteMaster(id));
}

export async function listServices() {
  return usePostgres ? postgresStore.listServices() : Promise.resolve(jsonStore.listServices());
}

export async function getBookingSettings() {
  return usePostgres
    ? postgresStore.getBookingSettings()
    : Promise.resolve(jsonStore.getBookingSettings());
}

export async function updateBookingSettings(input: Parameters<typeof jsonStore.updateBookingSettings>[0]) {
  return usePostgres
    ? postgresStore.updateBookingSettings(input)
    : Promise.resolve(jsonStore.updateBookingSettings(input));
}

export async function listActiveServices() {
  return usePostgres
    ? postgresStore.listActiveServices()
    : Promise.resolve(jsonStore.listActiveServices());
}

export async function createService(input: Parameters<typeof jsonStore.createService>[0]) {
  return usePostgres
    ? postgresStore.createService(input)
    : Promise.resolve(jsonStore.createService(input));
}

export async function updateService(
  id: string,
  input: Parameters<typeof jsonStore.updateService>[1],
) {
  return usePostgres
    ? postgresStore.updateService(id, input)
    : Promise.resolve(jsonStore.updateService(id, input));
}

export async function deleteService(id: string) {
  return usePostgres ? postgresStore.deleteService(id) : Promise.resolve(jsonStore.deleteService(id));
}

export async function listAvailableMastersForAppointment(
  appointmentAt: string,
  options: Parameters<typeof jsonStore.listAvailableMastersForAppointment>[1] = {},
) {
  return usePostgres
    ? postgresStore.listAvailableMastersForAppointment(appointmentAt, options)
    : Promise.resolve(jsonStore.listAvailableMastersForAppointment(appointmentAt, options));
}

export async function listDayTimeSlots(dateKey: string, serviceId?: string | null) {
  return usePostgres
    ? postgresStore.listDayTimeSlots(dateKey, serviceId)
    : Promise.resolve(jsonStore.listDayTimeSlots(dateKey, serviceId));
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

export async function listLeads() {
  return usePostgres ? postgresStore.listLeads() : Promise.resolve(jsonStore.listLeads());
}

export async function listCustomers() {
  return usePostgres ? postgresStore.listCustomers() : Promise.resolve(jsonStore.listCustomers());
}

export async function getCustomerById(id: string) {
  return usePostgres ? postgresStore.getCustomerById(id) : Promise.resolve(jsonStore.getCustomerById(id));
}

export async function addCustomerNote(customerId: string, text: string) {
  return usePostgres
    ? postgresStore.addCustomerNote(customerId, text)
    : Promise.resolve(jsonStore.addCustomerNote(customerId, text));
}

export async function getLeadById(id: string) {
  return usePostgres ? postgresStore.getLeadById(id) : Promise.resolve(jsonStore.getLeadById(id));
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

export async function getMonthlyRevenue(date = new Date()) {
  return usePostgres
    ? postgresStore.getMonthlyRevenue(date)
    : Promise.resolve(jsonStore.getMonthlyRevenue(date));
}

export async function countLeads() {
  return usePostgres ? postgresStore.countLeads() : Promise.resolve(jsonStore.countLeads());
}

export async function listLeadsAffectingSlot(dateKey: string, time: string) {
  return usePostgres
    ? postgresStore.listLeadsAffectingSlot(dateKey, time)
    : Promise.resolve(jsonStore.listLeadsAffectingSlot(dateKey, time));
}
