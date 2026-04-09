import {
  addLeadNote as addLeadNoteInDb,
  createMaster as createMasterInDb,
  deleteMaster as deleteMasterInDb,
  getLeadById as getLeadByIdFromDb,
  isAppointmentSlotAvailable as isAppointmentSlotAvailableInDb,
  listActiveMasters as listActiveMastersFromDb,
  listAvailableMastersForAppointment as listAvailableMastersForAppointmentInDb,
  listLeads as listLeadsFromDb,
  listMasters as listMastersFromDb,
  type LeadStatus,
  updateLeadAppointment as updateLeadAppointmentInDb,
  updateLeadMaster as updateLeadMasterInDb,
  updateLeadStatus as updateLeadStatusInDb,
  updateMaster as updateMasterInDb,
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

export function listMasters() {
  return Promise.resolve(listMastersFromDb());
}

export function listActiveMasters() {
  return Promise.resolve(listActiveMastersFromDb());
}

export function listAvailableMastersForAppointment(
  appointmentAt: string,
  excludeLeadId?: string | null,
) {
  return Promise.resolve(
    listAvailableMastersForAppointmentInDb(appointmentAt, { excludeLeadId }),
  );
}

export function getLeadById(id: string) {
  return Promise.resolve(getLeadByIdFromDb(id));
}

export function updateLeadStatus(id: string, status: LeadStatus) {
  return Promise.resolve(updateLeadStatusInDb(id, status));
}

export function addLeadNote(id: string, text: string) {
  return Promise.resolve(addLeadNoteInDb(id, text));
}

export function updateLeadAppointment(id: string, appointmentAt: string | null) {
  return Promise.resolve(updateLeadAppointmentInDb(id, appointmentAt));
}

export function updateLeadMaster(id: string, masterId: string) {
  return Promise.resolve(updateLeadMasterInDb(id, masterId));
}

export function isAppointmentSlotAvailable(
  appointmentAt: string,
  excludeLeadId?: string | null,
) {
  return Promise.resolve(
    isAppointmentSlotAvailableInDb(appointmentAt, { excludeLeadId }),
  );
}

export function createMaster(name: string) {
  return Promise.resolve(createMasterInDb(name));
}

export function updateMaster(id: string, name: string, isActive: boolean) {
  return Promise.resolve(updateMasterInDb(id, { name, isActive }));
}

export function deleteMaster(id: string) {
  return Promise.resolve(deleteMasterInDb(id));
}
