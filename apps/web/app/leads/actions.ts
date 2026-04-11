"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { LeadStatus, MasterScheduleDay } from "@crm-bot/db";
import {
  addCustomerNote,
  addLeadNote,
  createMaster,
  createService,
  deleteMaster,
  deleteService,
  getLeadById,
  isAppointmentSlotAvailable,
  updateLeadAppointment,
  updateLeadMaster,
  updateLeadStatus,
  updateBookingSettings,
  updateManagerSettings,
  updateMaster,
  updateService,
} from "../../lib/leads";
import { notifyLeadCancelled, notifyLeadRescheduled } from "../../lib/telegram";

const allowedStatuses: LeadStatus[] = [
  "NEW",
  "CONFIRMED",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
  "NO_SHOW",
];
const TIMEZONE_OFFSET = "+03:00";
const WEEKDAY_RANGE = [0, 1, 2, 3, 4, 5, 6] as const;

function buildAppointmentIso(date: string, time: string) {
  return `${date}T${time}:00${TIMEZONE_OFFSET}`;
}

function revalidateLeadViews(id: string) {
  revalidatePath("/");
  revalidatePath("/clients");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  revalidatePath("/calendar");
  revalidatePath("/masters");
  revalidatePath("/profile");
}

function redirectWithParams(path: string, params?: Record<string, string>) {
  const search = new URLSearchParams(params);
  redirect(search.size > 0 ? `${path}?${search.toString()}` : path);
}

function parseOptionalPrice(rawValue: FormDataEntryValue | null) {
  const value = String(rawValue ?? "").trim();

  if (!value) {
    return null;
  }

  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) ? normalized : Number.NaN;
}

function parseServiceDuration(rawValue: FormDataEntryValue | null) {
  const value = Number(String(rawValue ?? "").trim());
  return Number.isFinite(value) ? value : Number.NaN;
}

function parseNonNegativeInteger(rawValue: FormDataEntryValue | null) {
  const value = Number(String(rawValue ?? "").trim());
  return Number.isInteger(value) && value >= 0 ? value : Number.NaN;
}

function parseBoolean(rawValue: FormDataEntryValue | null) {
  return String(rawValue ?? "") === "true";
}

function parseWeeklySchedule(formData: FormData): MasterScheduleDay[] {
  return WEEKDAY_RANGE.map((dayOfWeek) => ({
    dayOfWeek,
    isWorking: String(formData.get(`schedule_${dayOfWeek}_isWorking`) ?? "false") === "true",
    startTime: String(formData.get(`schedule_${dayOfWeek}_start`) ?? "10:00"),
    endTime: String(formData.get(`schedule_${dayOfWeek}_end`) ?? "20:00"),
  }));
}

export async function updateLeadStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  const finalPrice = parseOptionalPrice(formData.get("finalPrice"));

  if (!id || !allowedStatuses.includes(status)) {
    throw new Error("Invalid lead status payload");
  }

  if (Number.isNaN(finalPrice)) {
    redirect(`/leads/${id}?status_error=price_invalid`);
  }

  const lead = await getLeadById(id);

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (status === "DONE" && finalPrice == null && lead.service?.price == null) {
    redirect(`/leads/${id}?status_error=price_required`);
  }

  await updateLeadStatus(id, status, finalPrice);
  revalidateLeadViews(id);
  redirect(`/leads/${id}`);
}

export async function quickUpdateLeadStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;

  if (!id || !allowedStatuses.includes(status) || status === "DONE") {
    throw new Error("Invalid quick status payload");
  }

  await updateLeadStatus(id, status);
  revalidateLeadViews(id);
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

export async function addCustomerNoteAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "");
  const text = String(formData.get("text") ?? "").trim();

  if (!customerId || !text) {
    throw new Error("Invalid customer note payload");
  }

  await addCustomerNote(customerId, text);
  revalidatePath("/clients");
  revalidatePath(`/clients/${customerId}`);
  redirect(`/clients/${customerId}`);
}

export async function rescheduleLeadAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  if (!id || !date || !time) {
    throw new Error("Invalid appointment payload");
  }

  const lead = await getLeadById(id);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const appointmentAt = buildAppointmentIso(date, time);
  const isAvailable = await isAppointmentSlotAvailable(
    appointmentAt,
    id,
    lead.serviceId,
  );

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
  const weeklySchedule = parseWeeklySchedule(formData);

  if (!id || !name) {
    redirectWithParams("/masters", { error_code: "master_invalid" });
  }

  try {
    await updateMaster(id, name, isActive, weeklySchedule);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message === "Master name is required"
        ? "master_name_required"
        : message.includes("Нельзя убрать мастера") || message.includes("cannot be removed")
          ? "master_breaks_capacity"
          : message.includes("последнего активного") || message.includes("At least one active")
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
        : message.includes("Нельзя убрать мастера") || message.includes("cannot be removed")
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

export async function createServiceAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = parseServiceDuration(formData.get("durationMinutes"));
  const price = parseOptionalPrice(formData.get("price"));
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!name) {
    redirectWithParams("/masters", { error_code: "service_name_required" });
  }

  if (Number.isNaN(durationMinutes)) {
    redirectWithParams("/masters", { error_code: "service_duration_invalid" });
  }

  if (Number.isNaN(price)) {
    redirectWithParams("/masters", { error_code: "service_price_invalid" });
  }

  try {
    await createService(name, durationMinutes, price, isActive);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message === "Service name is required"
        ? "service_name_required"
        : message === "Service duration is invalid"
          ? "service_duration_invalid"
          : "service_unknown";
    redirectWithParams("/masters", { error_code: code });
  }

  revalidatePath("/");
  revalidatePath("/masters");
  redirectWithParams("/masters", { success_code: "service_created" });
}

export async function updateServiceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = parseServiceDuration(formData.get("durationMinutes"));
  const price = parseOptionalPrice(formData.get("price"));
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!id || !name) {
    redirectWithParams("/masters", { error_code: "service_invalid" });
  }

  if (Number.isNaN(durationMinutes)) {
    redirectWithParams("/masters", { error_code: "service_duration_invalid" });
  }

  if (Number.isNaN(price)) {
    redirectWithParams("/masters", { error_code: "service_price_invalid" });
  }

  try {
    await updateService(id, name, durationMinutes, price, isActive);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message === "Service name is required"
        ? "service_name_required"
        : message === "Service duration is invalid"
          ? "service_duration_invalid"
          : message.includes("At least one active")
            ? "service_remove_last_active"
            : "service_unknown";
    redirectWithParams("/masters", { error_code: code });
  }

  revalidatePath("/");
  revalidatePath("/masters");
  revalidatePath("/leads");
  revalidatePath("/calendar");
  redirectWithParams("/masters", { success_code: "service_updated" });
}

export async function deleteServiceAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirectWithParams("/masters", { error_code: "service_missing" });
  }

  try {
    await deleteService(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const code =
      message.includes("Service has leads")
        ? "service_has_leads"
        : message.includes("At least one active")
          ? "service_remove_last_active"
          : message.includes("not found")
            ? "service_missing"
            : "service_unknown";
    redirectWithParams("/masters", { error_code: code });
  }

  revalidatePath("/");
  revalidatePath("/masters");
  revalidatePath("/leads");
  redirectWithParams("/masters", { success_code: "service_deleted" });
}

export async function updateBookingSettingsAction(formData: FormData) {
  const minLeadTimeMinutes = parseNonNegativeInteger(formData.get("minLeadTimeMinutes"));

  if (Number.isNaN(minLeadTimeMinutes)) {
    redirectWithParams("/masters", { error_code: "booking_lead_time_invalid" });
  }

  try {
    await updateBookingSettings(minLeadTimeMinutes);
  } catch {
    redirectWithParams("/masters", { error_code: "booking_settings_unknown" });
  }

  revalidatePath("/masters");
  revalidatePath("/calendar");
  revalidatePath("/leads");
  redirectWithParams("/masters", { success_code: "booking_settings_updated" });
}

export async function updateManagerSettingsAction(formData: FormData) {
  const managerName = String(formData.get("managerName") ?? "").trim();
  const managerRole = String(formData.get("managerRole") ?? "").trim();
  const remindersEnabled = parseBoolean(formData.get("remindersEnabled"));
  const singleReminderEnabled = parseBoolean(formData.get("singleReminderEnabled"));
  const reminderMinutes = parseNonNegativeInteger(formData.get("reminderMinutes"));
  const welcomeTemplate = String(formData.get("welcomeTemplate") ?? "").trim();
  const bookingCreatedTemplate = String(formData.get("bookingCreatedTemplate") ?? "").trim();
  const reminderTemplate = String(formData.get("reminderTemplate") ?? "").trim();
  const bookingRescheduledTemplate = String(
    formData.get("bookingRescheduledTemplate") ?? "",
  ).trim();
  const bookingCancelledTemplate = String(
    formData.get("bookingCancelledTemplate") ?? "",
  ).trim();

  if (!managerName) {
    redirectWithParams("/profile", { error_code: "manager_name_required" });
  }

  if (!managerRole) {
    redirectWithParams("/profile", { error_code: "manager_role_required" });
  }

  if (Number.isNaN(reminderMinutes)) {
    redirectWithParams("/profile", { error_code: "reminder_invalid" });
  }

  if (
    !welcomeTemplate ||
    !bookingCreatedTemplate ||
    !reminderTemplate ||
    !bookingRescheduledTemplate ||
    !bookingCancelledTemplate
  ) {
    redirectWithParams("/profile", { error_code: "template_required" });
  }

  try {
    await updateManagerSettings({
      managerName,
      managerRole,
      remindersEnabled,
      dayBeforeReminderEnabled: false,
      dayBeforeReminderMinutes: reminderMinutes + 1,
      sameDayReminderEnabled: singleReminderEnabled,
      sameDayReminderMinutes: reminderMinutes,
      welcomeTemplate,
      bookingCreatedTemplate,
      reminderDayBeforeTemplate: reminderTemplate,
      reminderSameDayTemplate: reminderTemplate,
      bookingRescheduledTemplate,
      bookingCancelledTemplate,
    });
  } catch {
    redirectWithParams("/profile", { error_code: "manager_settings_unknown" });
  }

  revalidatePath("/profile");
  revalidatePath("/masters");
  revalidatePath("/leads");
  redirectWithParams("/profile", { success_code: "manager_settings_updated" });
}
