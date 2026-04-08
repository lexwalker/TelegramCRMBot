import {
  addLeadNote as addLeadNoteInDb,
  getLeadById as getLeadByIdFromDb,
  listLeads as listLeadsFromDb,
  type LeadStatus,
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
