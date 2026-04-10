import {
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

export function listLeads() {
  return Promise.resolve(listLeadsFromDb());
}

export function listCustomers() {
  return Promise.resolve(listCustomersFromDb());
}

export function getCustomerById(id: string) {
  return Promise.resolve(getCustomerByIdFromDb(id));
}

export function listLeadsAffectingSlot(dateKey: string, time: string) {
  return Promise.resolve(listLeadsAffectingSlotInDb(dateKey, time));
}

export function listMasters() {
  return Promise.resolve(listMastersFromDb());
}

export function listActiveMasters() {
  return Promise.resolve(listActiveMastersFromDb());
}

export function listServices() {
  return Promise.resolve(listServicesFromDb());
}

export function getBookingSettings() {
  return Promise.resolve(getBookingSettingsFromDb());
}

export function listActiveServices() {
  return Promise.resolve(listActiveServicesFromDb());
}

export function listAvailableMastersForAppointment(
  appointmentAt: string,
  excludeLeadId?: string | null,
  serviceId?: string | null,
) {
  return Promise.resolve(
    listAvailableMastersForAppointmentInDb(appointmentAt, { excludeLeadId, serviceId }),
  );
}

export function listDayTimeSlots(dateKey: string, serviceId?: string | null) {
  return Promise.resolve(listDayTimeSlotsInDb(dateKey, serviceId));
}

export function listAvailableTimeSlotsForDate(
  dateKey: string,
  serviceId?: string | null,
  excludeLeadId?: string | null,
) {
  return Promise.resolve(
    listAvailableTimeSlotsForDateInDb(dateKey, serviceId, { excludeLeadId }),
  );
}

export function listAvailableDateKeys(
  daysAhead: number,
  serviceId?: string | null,
  excludeLeadId?: string | null,
) {
  return Promise.resolve(
    listAvailableDateKeysInDb(daysAhead, serviceId, { excludeLeadId }),
  );
}

export function getLeadById(id: string) {
  return Promise.resolve(getLeadByIdFromDb(id));
}

export function updateLeadStatus(id: string, status: LeadStatus, finalPrice?: number | null) {
  return Promise.resolve(updateLeadStatusInDb(id, status, finalPrice, { actor: "crm" }));
}

export function addLeadNote(id: string, text: string) {
  return Promise.resolve(addLeadNoteInDb(id, text, { actor: "crm" }));
}

export function updateLeadAppointment(id: string, appointmentAt: string | null) {
  return Promise.resolve(updateLeadAppointmentInDb(id, appointmentAt, { actor: "crm" }));
}

export function updateLeadService(id: string, serviceId: string) {
  return Promise.resolve(updateLeadServiceInDb(id, serviceId, { actor: "crm" }));
}

export function updateLeadMaster(id: string, masterId: string) {
  return Promise.resolve(updateLeadMasterInDb(id, masterId, { actor: "crm" }));
}

export function isAppointmentSlotAvailable(
  appointmentAt: string,
  excludeLeadId?: string | null,
  serviceId?: string | null,
) {
  return Promise.resolve(
    isAppointmentSlotAvailableInDb(appointmentAt, { excludeLeadId, serviceId }),
  );
}

export function createMaster(name: string) {
  return Promise.resolve(createMasterInDb(name));
}

export function updateMaster(
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
  return Promise.resolve(updateMasterInDb(id, { name, isActive, weeklySchedule }));
}

export function deleteMaster(id: string) {
  return Promise.resolve(deleteMasterInDb(id));
}

export function createService(
  name: string,
  durationMinutes: number,
  price: number | null,
  isActive: boolean,
) {
  return Promise.resolve(createServiceInDb({ name, durationMinutes, price, isActive }));
}

export function updateService(
  id: string,
  name: string,
  durationMinutes: number,
  price: number | null,
  isActive: boolean,
) {
  return Promise.resolve(
    updateServiceInDb(id, { name, durationMinutes, price, isActive }),
  );
}

export function deleteService(id: string) {
  return Promise.resolve(deleteServiceInDb(id));
}

export function updateBookingSettings(minLeadTimeMinutes: number) {
  return Promise.resolve(updateBookingSettingsInDb({ minLeadTimeMinutes }));
}

export function updateManagerSettings(input: {
  managerName: string;
  managerRole: string;
  remindersEnabled: boolean;
  dayBeforeReminderEnabled: boolean;
  dayBeforeReminderMinutes: number;
  sameDayReminderEnabled: boolean;
  sameDayReminderMinutes: number;
}) {
  return Promise.resolve(updateBookingSettingsInDb(input));
}

export function getMonthlyRevenue(date?: Date) {
  return Promise.resolve(getMonthlyRevenueFromDb(date));
}
