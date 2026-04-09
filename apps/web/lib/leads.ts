import {
  addLeadNote as addLeadNoteInDb,
  getLeadById as getLeadByIdFromDb,
  isAppointmentSlotAvailable as isAppointmentSlotAvailableInDb,
  listLeads as listLeadsFromDb,
  type LeadStatus,
  updateLeadAppointment as updateLeadAppointmentInDb,
  updateLeadStatus as updateLeadStatusInDb,
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

export function isAppointmentSlotAvailable(
  appointmentAt: string,
  excludeLeadId?: string | null,
) {
  return Promise.resolve(
    isAppointmentSlotAvailableInDb(appointmentAt, { excludeLeadId }),
  );
}
