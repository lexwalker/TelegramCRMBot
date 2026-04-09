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

function redirectWithParams(path: string, params?: Record<string, string>) {
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
    redirect(`/leads/${id}?master_error=unknown`);
  }

  try {
    await updateLeadMaster(id, masterId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message === "Lead does not have an appointment"
        ? "no_appointment"
        : message === "Master is not available"
          ? "master_unavailable"
          : message === "Master is busy at this time"
            ? "master_busy"
            : "unknown";
    redirect(`/leads/${id}?master_error=${code}`);
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
    redirectWithParams("/masters", { error_code: "master_name_required" });
  }

  try {
    await createMaster(name);
  } catch {
    redirectWithParams("/masters", { error_code: "master_unknown" });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  redirectWithParams("/masters", { success_code: "master_created" });
}

export async function updateMasterAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!id || !name) {
    redirectWithParams("/masters", { error_code: "master_invalid" });
  }

  try {
    await updateMaster(id, name, isActive);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message === "Master name is required"
        ? "master_name_required"
        : message.includes("Нельзя убрать мастера") ||
            message.includes("cannot be removed")
          ? "master_breaks_capacity"
          : message.includes("последнего активного") ||
              message.includes("At least one active")
            ? "master_remove_last_active"
            : "master_unknown";
    redirectWithParams("/masters", { error_code: code });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  redirectWithParams("/masters", { success_code: "master_updated" });
}

export async function deleteMasterAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithParams("/masters", { error_code: "master_missing" });
  }

  try {
    await deleteMaster(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message.includes("At least one active") || message.includes("хотя бы одного")
        ? "master_remove_last_active"
        : message.includes("Нельзя убрать мастера") ||
            message.includes("cannot be removed")
          ? "master_breaks_capacity"
          : message.includes("not found")
            ? "master_missing"
            : "master_unknown";
    redirectWithParams("/masters", { error_code: code });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  redirectWithParams("/masters", { success_code: "master_deleted" });
}
