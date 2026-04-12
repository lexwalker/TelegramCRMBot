import {
  addCustomerNote as addCustomerNoteInDb,
  addLeadNote as addLeadNoteInDb,
  createMaster as createMasterInDb,
  createService as createServiceInDb,
  deleteMaster as deleteMasterInDb,
  deleteService as deleteServiceInDb,
  getCustomerById as getCustomerByIdFromDb,
  getLeadById as getLeadByIdFromDb,
  getBookingSettings as getBookingSettingsFromDb,
  getMonthlyRevenue as getMonthlyRevenueFromDb,
  isAppointmentSlotAvailable as isAppointmentSlotAvailableInDb,
  listActiveMasters as listActiveMastersFromDb,
  listActiveServices as listActiveServicesFromDb,
  listAvailableDateKeys as listAvailableDateKeysInDb,
  listAvailableMastersForAppointment as listAvailableMastersForAppointmentInDb,
  listAvailableTimeSlotsForDate as listAvailableTimeSlotsForDateInDb,
  listCustomers as listCustomersFromDb,
  listDayTimeSlots as listDayTimeSlotsInDb,
  listLeads as listLeadsFromDb,
  listLeadsAffectingSlot as listLeadsAffectingSlotInDb,
  listMasters as listMastersFromDb,
  listServices as listServicesFromDb,
  type LeadStatus,
  updateLeadAppointment as updateLeadAppointmentInDb,
  updateLeadMaster as updateLeadMasterInDb,
  updateLeadService as updateLeadServiceInDb,
  updateLeadStatus as updateLeadStatusInDb,
  updateBookingSettings as updateBookingSettingsInDb,
  updateMaster as updateMasterInDb,
  updateService as updateServiceInDb,
} from "@crm-bot/db";
import { getCurrentManagerSession } from "./auth";

async function getCurrentOrganizationId() {
  const session = await getCurrentManagerSession();
  return session?.organization.id ?? null;
}

export async function getLeads() {
  try {
    const leads = await listLeads();
    return { ok: true as const, leads };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Не удалось подключиться к базе данных.",
    };
  }
}

export async function listLeads() {
  const organizationId = await getCurrentOrganizationId();
  return listLeadsFromDb(organizationId);
}

export async function listCustomers() {
  const organizationId = await getCurrentOrganizationId();
  return listCustomersFromDb(organizationId);
}

export async function getCustomerById(id: string) {
  const organizationId = await getCurrentOrganizationId();
  return getCustomerByIdFromDb(id, organizationId);
}

export async function addCustomerNote(id: string, text: string) {
  const organizationId = await getCurrentOrganizationId();
  return addCustomerNoteInDb(id, text, organizationId);
}

export async function listLeadsAffectingSlot(dateKey: string, time: string) {
  const organizationId = await getCurrentOrganizationId();
  return listLeadsAffectingSlotInDb(dateKey, time, organizationId);
}

export async function listMasters() {
  const organizationId = await getCurrentOrganizationId();
  return listMastersFromDb(organizationId);
}

export async function listActiveMasters() {
  const organizationId = await getCurrentOrganizationId();
  return listActiveMastersFromDb(organizationId);
}

export async function listServices() {
  const organizationId = await getCurrentOrganizationId();
  return listServicesFromDb(organizationId);
}

export async function getBookingSettings() {
  const organizationId = await getCurrentOrganizationId();
  return getBookingSettingsFromDb(organizationId);
}

export async function listActiveServices() {
  const organizationId = await getCurrentOrganizationId();
  return listActiveServicesFromDb(organizationId);
}

export async function listAvailableMastersForAppointment(
  appointmentAt: string,
  excludeLeadId?: string | null,
  serviceId?: string | null,
) {
  const organizationId = await getCurrentOrganizationId();
  return listAvailableMastersForAppointmentInDb(appointmentAt, {
    excludeLeadId,
    serviceId,
    organizationId,
  });
}

export async function listDayTimeSlots(dateKey: string, serviceId?: string | null) {
  const organizationId = await getCurrentOrganizationId();
  return listDayTimeSlotsInDb(dateKey, serviceId, organizationId);
}

export async function listAvailableTimeSlotsForDate(
  dateKey: string,
  serviceId?: string | null,
  excludeLeadId?: string | null,
) {
  const organizationId = await getCurrentOrganizationId();
  return listAvailableTimeSlotsForDateInDb(dateKey, serviceId, {
    excludeLeadId,
    organizationId,
  });
}

export async function listAvailableDateKeys(
  daysAhead: number,
  serviceId?: string | null,
  excludeLeadId?: string | null,
) {
  const organizationId = await getCurrentOrganizationId();
  return listAvailableDateKeysInDb(daysAhead, serviceId, {
    excludeLeadId,
    organizationId,
  });
}

export async function getLeadById(id: string) {
  const organizationId = await getCurrentOrganizationId();
  return getLeadByIdFromDb(id, organizationId);
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
  finalPrice?: number | null,
) {
  const organizationId = await getCurrentOrganizationId();
  return updateLeadStatusInDb(id, status, finalPrice, {
    actor: "crm",
    organizationId,
  });
}

export async function addLeadNote(id: string, text: string) {
  const organizationId = await getCurrentOrganizationId();
  return addLeadNoteInDb(id, text, { actor: "crm", organizationId });
}

export async function updateLeadAppointment(id: string, appointmentAt: string | null) {
  const organizationId = await getCurrentOrganizationId();
  return updateLeadAppointmentInDb(id, appointmentAt, {
    actor: "crm",
    organizationId,
  });
}

export async function updateLeadService(id: string, serviceId: string) {
  const organizationId = await getCurrentOrganizationId();
  return updateLeadServiceInDb(id, serviceId, { actor: "crm", organizationId });
}

export async function updateLeadMaster(id: string, masterId: string) {
  const organizationId = await getCurrentOrganizationId();
  return updateLeadMasterInDb(id, masterId, { actor: "crm", organizationId });
}

export async function isAppointmentSlotAvailable(
  appointmentAt: string,
  excludeLeadId?: string | null,
  serviceId?: string | null,
) {
  const organizationId = await getCurrentOrganizationId();
  return isAppointmentSlotAvailableInDb(appointmentAt, {
    excludeLeadId,
    serviceId,
    organizationId,
  });
}

export async function createMaster(name: string) {
  const organizationId = await getCurrentOrganizationId();
  return createMasterInDb(name, organizationId);
}

export async function updateMaster(
  id: string,
  name: string,
  isActive: boolean,
  weeklySchedule: {
    dayOfWeek: number;
    isWorking: boolean;
    startTime: string;
    endTime: string;
  }[],
) {
  const organizationId = await getCurrentOrganizationId();
  return updateMasterInDb(id, { name, isActive, weeklySchedule }, organizationId);
}

export async function deleteMaster(id: string) {
  const organizationId = await getCurrentOrganizationId();
  return deleteMasterInDb(id, organizationId);
}

export async function createService(
  name: string,
  durationMinutes: number,
  price: number | null,
  isActive: boolean,
) {
  const organizationId = await getCurrentOrganizationId();
  return createServiceInDb({ name, durationMinutes, price, isActive }, organizationId);
}

export async function updateService(
  id: string,
  name: string,
  durationMinutes: number,
  price: number | null,
  isActive: boolean,
) {
  const organizationId = await getCurrentOrganizationId();
  return updateServiceInDb(
    id,
    { name, durationMinutes, price, isActive },
    organizationId,
  );
}

export async function deleteService(id: string) {
  const organizationId = await getCurrentOrganizationId();
  return deleteServiceInDb(id, organizationId);
}

export async function updateBookingSettings(minLeadTimeMinutes: number) {
  const organizationId = await getCurrentOrganizationId();
  return updateBookingSettingsInDb({ minLeadTimeMinutes }, organizationId);
}

export async function updateManagerSettings(input: {
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
}) {
  const organizationId = await getCurrentOrganizationId();
  return updateBookingSettingsInDb(input, organizationId);
}

export async function getMonthlyRevenue(date?: Date) {
  const organizationId = await getCurrentOrganizationId();
  return getMonthlyRevenueFromDb(date, organizationId);
}
