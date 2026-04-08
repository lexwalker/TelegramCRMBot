"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus } from "@crm-bot/db";
import { addLeadNote, updateLeadStatus } from "../../lib/leads";

const allowedStatuses: LeadStatus[] = ["NEW", "IN_PROGRESS", "DONE"];

export async function updateLeadStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;

  if (!id || !allowedStatuses.includes(status)) {
    throw new Error("Invalid lead status payload");
  }

  await updateLeadStatus(id, status);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function addLeadNoteAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const text = String(formData.get("text") ?? "").trim();

  if (!id || !text) {
    throw new Error("Invalid lead note payload");
  }

  await addLeadNote(id, text);
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}
