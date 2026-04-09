"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "@crm-bot/db";
import {
  addLeadNote,
  createMaster,
  deleteMaster,
  getLeadById,
  isAppointmentSlotAvailable,
  updateLeadAppointment,
  updateLeadMaster,
  updateLeadStatus,
  updateMaster,
} from "../../lib/leads";
import {
  notifyLeadCancelled,
  notifyLeadRescheduled,
} from "../../lib/telegram";

const allowedStatuses: LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE"];
const TIMEZONE_OFFSET = "+03:00";

function buildAppointmentIso(date: string, time: string) {
  return `${date}T${time}:00${TIMEZONE_OFFSET}`;
}

function revalidateLeadViews(id: string) {
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/masters");
}

function masterRedirect(path: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(search.size > 0 ? `${path}?${search.toString()}` : path);
}

export async function updateLeadStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;

  if (!id || !allowedStatuses.includes(status)) {
    throw new Error("Invalid lead status payload");
  }

  await updateLeadStatus(id, status);
  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function addLeadNoteAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "").trim();

  if (!id || !text) {
    throw new Error("Invalid lead note payload");
  }

  await addLeadNote(id, text);
  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function rescheduleLeadAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!id || !date || !time) {
    throw new Error("Invalid appointment payload");
  }

  const appointmentAt = buildAppointmentIso(date, time);
  const isAvailable = await isAppointmentSlotAvailable(appointmentAt, id);

  if (!isAvailable) {
    redirect(`/leads/${id}?error=slot_taken`);
  }

  const updatedLead = await updateLeadAppointment(id, appointmentAt);

  try {
    await notifyLeadRescheduled(updatedLead);
  } catch (error) {
    console.error("[web] Failed to notify client about reschedule:", error);
  }

  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function changeLeadMasterAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const masterId = String(formData.get("masterId") ?? "");

  if (!id || !masterId) {
    throw new Error("Invalid lead master payload");
  }

  try {
    await updateLeadMaster(id, masterId);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось поменять мастера";
    redirect(`/leads/${id}?master_error=${encodeURIComponent(message)}`);
  }

  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function cancelLeadAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Invalid cancel payload");
  }

  const leadBeforeCancel = await getLeadById(id);
  const previousAppointmentAt = leadBeforeCancel?.appointmentAt ?? null;
  const updatedLead = await updateLeadAppointment(id, null);

  try {
    await notifyLeadCancelled(updatedLead, previousAppointmentAt);
  } catch (error) {
    console.error("[web] Failed to notify client about cancellation:", error);
  }

  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function createMasterAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    masterRedirect("/masters", { error: "Укажите имя мастера" });
  }

  try {
    await createMaster(name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать мастера";
    masterRedirect("/masters", { error: message });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  masterRedirect("/masters", { success: "Мастер добавлен" });
}

export async function updateMasterAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !name) {
    masterRedirect("/masters", { error: "Некорректные данные мастера" });
  }

  try {
    await updateMaster(id, name, isActive);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось обновить мастера";
    masterRedirect("/masters", { error: message });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  masterRedirect("/masters", { success: "Мастер обновлен" });
}

export async function deleteMasterAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    masterRedirect("/masters", { error: "Не найден мастер для удаления" });
  }

  try {
    await deleteMaster(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить мастера";
    masterRedirect("/masters", { error: message });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  masterRedirect("/masters", { success: "Мастер удален" });
}
