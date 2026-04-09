import fs from "node:fs";
import path from "node:path";

export type LeadStatus = "NEW" | "IN_PROGRESS" | "DONE";

export type LeadNote = {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
};

export type Lead = {
  id: string;
  telegramId: string | null;
  name: string;
  phone: string;
  comment: string;
  appointmentAt: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes: LeadNote[];
};

type CreateLeadInput = {
  telegramId?: string | null;
  name: string;
  phone: string;
  comment: string;
  appointmentAt?: string | null;
};

type DatabaseShape = {
  leads: Omit<Lead, "notes">[];
  notes: LeadNote[];
};

type AppointmentAvailabilityOptions = {
  excludeLeadId?: string | null;
};

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/db.json";

function resolveDatabasePath(databaseUrl: string) {
  if (databaseUrl.startsWith("file:")) {
    return databaseUrl.slice(5);
  }

  return databaseUrl;
}

const databasePath = resolveDatabasePath(DATABASE_URL);
const databaseDir = path.dirname(databasePath);

if (databaseDir && databaseDir !== ".") {
  fs.mkdirSync(databaseDir, { recursive: true });
}

const emptyDatabase: DatabaseShape = {
  leads: [],
  notes: [],
};

export function ensureDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify(emptyDatabase, null, 2));
  }
}

ensureDatabase();

function readDatabase(): DatabaseShape {
  ensureDatabase();
  const raw = JSON.parse(fs.readFileSync(databasePath, "utf-8")) as DatabaseShape;

  return {
    notes: raw.notes ?? [],
    leads: (raw.leads ?? []).map((lead) => ({
      ...lead,
      appointmentAt: lead.appointmentAt ?? null,
    })),
  };
}

function writeDatabase(data: DatabaseShape) {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function listLeadNotes(leadId: string, data: DatabaseShape): LeadNote[] {
  return data.notes
    .filter((note) => note.leadId === leadId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mapLead(row: Omit<Lead, "notes">, data: DatabaseShape): Lead {
  return {
    ...row,
    appointmentAt: row.appointmentAt ?? null,
    notes: listLeadNotes(row.id, data),
  };
}

export function listLeads(): Lead[] {
  const data = readDatabase();

  return [...data.leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((lead) => mapLead(lead, data));
}

export function getLeadById(id: string): Lead | null {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === id);

  return lead ? mapLead(lead, data) : null;
}

export function isAppointmentSlotAvailable(
  appointmentAt: string,
  options: AppointmentAvailabilityOptions = {},
) {
  const data = readDatabase();

  return !data.leads.some(
    (lead) =>
      lead.appointmentAt === appointmentAt && lead.id !== options.excludeLeadId,
  );
}

export function createLead(input: CreateLeadInput): Lead {
  const data = readDatabase();
  const id = createId("lead");
  const timestamp = nowIso();

  if (
    input.appointmentAt &&
    !isAppointmentSlotAvailable(input.appointmentAt, { excludeLeadId: null })
  ) {
    throw new Error("Appointment slot is already taken");
  }

  const lead: Omit<Lead, "notes"> = {
    id,
    telegramId: input.telegramId ?? null,
    name: input.name,
    phone: input.phone,
    comment: input.comment,
    appointmentAt: input.appointmentAt ?? null,
    status: "NEW",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.leads.push(lead);
  writeDatabase(data);

  return mapLead(lead, data);
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead {
  const data = readDatabase();
  const timestamp = nowIso();
  const lead = data.leads.find((item) => item.id === id);

  if (!lead) {
    throw new Error("Lead not found");
  }

  lead.status = status;
  lead.updatedAt = timestamp;
  writeDatabase(data);

  return mapLead(lead, data);
}

export function addLeadNote(leadId: string, text: string): LeadNote {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const id = createId("note");
  const timestamp = nowIso();
  const note: LeadNote = {
    id,
    leadId,
    text,
    createdAt: timestamp,
  };

  data.notes.push(note);
  writeDatabase(data);

  return note;
}

export function updateLeadAppointment(
  leadId: string,
  appointmentAt: string | null,
): Lead {
  const data = readDatabase();
  const timestamp = nowIso();
  const lead = data.leads.find((item) => item.id === leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (
    appointmentAt &&
    !isAppointmentSlotAvailable(appointmentAt, { excludeLeadId: leadId })
  ) {
    throw new Error("Appointment slot is already taken");
  }

  lead.appointmentAt = appointmentAt;
  lead.updatedAt = timestamp;
  writeDatabase(data);

  return mapLead(lead, data);
}

export function getLatestLeadByTelegramId(telegramId: string): Lead | null {
  const data = readDatabase();
  const lead = [...data.leads]
    .filter((item) => item.telegramId === telegramId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  return lead ? mapLead(lead, data) : null;
}

export function getLatestBookedLeadByTelegramId(telegramId: string): Lead | null {
  const data = readDatabase();
  const lead = [...data.leads]
    .filter((item) => item.telegramId === telegramId && item.appointmentAt)
    .sort((a, b) => {
      const aTime = a.appointmentAt ?? a.updatedAt;
      const bTime = b.appointmentAt ?? b.updatedAt;
      return bTime.localeCompare(aTime);
    })[0];

  return lead ? mapLead(lead, data) : null;
}

export function countLeads() {
  return readDatabase().leads.length;
}
