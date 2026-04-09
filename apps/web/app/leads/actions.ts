"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "@crm-bot/db";
import {
  addLeadNote,
  isAppointmentSlotAvailable,
  updateLeadAppointment,
  updateLeadStatus,
} from "../../lib/leads";

const allowedStatuses: LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE"];
const TIMEZONE_OFFSET = "+03:00";

function buildAppointmentIso(date: string, time: string) {
  return `${date}T${time}:00${TIMEZONE_OFFSET}`;
}

function revalidateLeadViews(id: string) {
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/calendar");
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

  await updateLeadAppointment(id, appointmentAt);
  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function cancelLeadAppointmentAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Invalid cancel payload");
  }

  await updateLeadAppointment(id, null);
  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}
