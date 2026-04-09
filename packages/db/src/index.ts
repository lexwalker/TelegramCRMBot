import fs from "node:fs";
import path from "node:path";

export type LeadStatus = "NEW" | "IN_PROGRESS" | "DONE";

export type Master = {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type LeadNote = {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
};

type LeadRecord = {
  id: string;
  telegramId: string | null;
  name: string;
  phone: string;
  comment: string;
  appointmentAt: string | null;
  masterId: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type Lead = LeadRecord & {
  notes: LeadNote[];
  master: Master | null;
};

type CreateLeadInput = {
  telegramId?: string | null;
  name: string;
  phone: string;
  comment: string;
  appointmentAt?: string | null;
};

type UpdateMasterInput = {
  name: string;
  isActive: boolean;
};

type DatabaseShape = {
  leads: LeadRecord[];
  notes: LeadNote[];
  masters: Master[];
};

type AppointmentAvailabilityOptions = {
  excludeLeadId?: string | null;
};

type FindMasterOptions = AppointmentAvailabilityOptions & {
  excludedMasterIds?: string[];
};

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/db.json";
const DEFAULT_MASTERS: Master[] = [
  {
    id: "master_1",
    name: "Мастер 1",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "master_2",
    name: "Мастер 2",
    isActive: true,
    sortOrder: 2,
  },
];

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
  masters: DEFAULT_MASTERS,
};

export function ensureDatabase() {
  if (!fs.existsSync(databasePath)) {
    fs.writeFileSync(databasePath, JSON.stringify(emptyDatabase, null, 2));
  }
}

ensureDatabase();

function normalizeMasters(masters: Master[] | undefined) {
  const nextMasters =
    masters && masters.length > 0
      ? masters.map((master, index) => ({
          id: master.id,
          name: master.name,
          isActive: master.isActive ?? true,
          sortOrder: master.sortOrder ?? index + 1,
        }))
      : DEFAULT_MASTERS.map((master) => ({ ...master }));

  return [...nextMasters].sort((a, b) => a.sortOrder - b.sortOrder);
}

function getActiveMastersFromData(data: DatabaseShape) {
  return data.masters
    .filter((master) => master.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getSlotLeads(
  appointmentAt: string,
  data: DatabaseShape,
  options: AppointmentAvailabilityOptions = {},
) {
  return data.leads.filter(
    (lead) =>
      lead.appointmentAt === appointmentAt && lead.id !== options.excludeLeadId,
  );
}

function getAvailableMastersForSlot(
  appointmentAt: string,
  data: DatabaseShape,
  options: FindMasterOptions = {},
) {
  const excludedMasterIds = new Set(options.excludedMasterIds ?? []);
  const activeMasters = getActiveMastersFromData(data).filter(
    (master) => !excludedMasterIds.has(master.id),
  );
  const slotLeads = getSlotLeads(appointmentAt, data, options);
  const occupiedMasterIds = new Set(
    slotLeads
      .map((lead) => lead.masterId)
      .filter((value): value is string => Boolean(value)),
  );

  return activeMasters.filter((master) => !occupiedMasterIds.has(master.id));
}

function getFirstFreeMasterForSlot(
  appointmentAt: string,
  data: DatabaseShape,
  options: FindMasterOptions = {},
) {
  return getAvailableMastersForSlot(appointmentAt, data, options)[0] ?? null;
}

function cloneData(data: DatabaseShape): DatabaseShape {
  return {
    notes: data.notes.map((note) => ({ ...note })),
    masters: data.masters.map((master) => ({ ...master })),
    leads: data.leads.map((lead) => ({ ...lead })),
  };
}

function rebalanceLeadsForMasterRemoval(masterId: string, data: DatabaseShape) {
  const draft = cloneData(data);
  const targetMaster = draft.masters.find((master) => master.id === masterId);

  if (!targetMaster) {
    throw new Error("Master not found");
  }

  targetMaster.isActive = false;
  const activeMasters = getActiveMastersFromData(draft);

  if (activeMasters.length === 0 && draft.leads.some((lead) => lead.appointmentAt)) {
    throw new Error("Нельзя убрать последнего активного мастера, пока есть записи");
  }

  const affectedLeads = draft.leads
    .filter((lead) => lead.masterId === masterId && lead.appointmentAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const lead of affectedLeads) {
    const nextMaster = getFirstFreeMasterForSlot(lead.appointmentAt as string, draft, {
      excludeLeadId: lead.id,
      excludedMasterIds: [masterId],
    });

    if (!nextMaster) {
      throw new Error(
        `Нельзя убрать мастера: на слот ${lead.appointmentAt} не хватит свободных мастеров`,
      );
    }

    lead.masterId = nextMaster.id;
  }

  return draft;
}

function normalizeData(raw: DatabaseShape) {
  const masters = normalizeMasters(raw.masters);
  const activeMasters = masters.filter((master) => master.isActive);
  const occupiedBySlot = new Map<string, Set<string>>();
  let changed = !raw.masters || raw.masters.length === 0;

  const leads = [...(raw.leads ?? [])]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((lead) => {
      const normalizedLead: LeadRecord = {
        ...lead,
        appointmentAt: lead.appointmentAt ?? null,
        masterId: lead.masterId ?? null,
      };

      if (!normalizedLead.appointmentAt) {
        if (normalizedLead.masterId !== null) {
          normalizedLead.masterId = null;
          changed = true;
        }

        return normalizedLead;
      }

      const slotKey = normalizedLead.appointmentAt;
      const occupiedMasters = occupiedBySlot.get(slotKey) ?? new Set<string>();
      const hasValidMaster =
        normalizedLead.masterId &&
        activeMasters.some((master) => master.id === normalizedLead.masterId) &&
        !occupiedMasters.has(normalizedLead.masterId);

      if (hasValidMaster) {
        occupiedMasters.add(normalizedLead.masterId as string);
        occupiedBySlot.set(slotKey, occupiedMasters);
        return normalizedLead;
      }

      const availableMaster = activeMasters.find(
        (master) => !occupiedMasters.has(master.id),
      );
      const nextMasterId = availableMaster?.id ?? null;

      if (normalizedLead.masterId !== nextMasterId) {
        normalizedLead.masterId = nextMasterId;
        changed = true;
      }

      if (availableMaster) {
        occupiedMasters.add(availableMaster.id);
        occupiedBySlot.set(slotKey, occupiedMasters);
      }

      return normalizedLead;
    });

  return {
    changed,
    data: {
      notes: raw.notes ?? [],
      leads,
      masters,
    } satisfies DatabaseShape,
  };
}

function readDatabase(): DatabaseShape {
  ensureDatabase();
  const raw = JSON.parse(fs.readFileSync(databasePath, "utf-8")) as DatabaseShape;
  const normalized = normalizeData(raw);

  if (normalized.changed) {
    fs.writeFileSync(databasePath, JSON.stringify(normalized.data, null, 2));
  }

  return normalized.data;
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

function mapLead(row: LeadRecord, data: DatabaseShape): Lead {
  return {
    ...row,
    appointmentAt: row.appointmentAt ?? null,
    masterId: row.masterId ?? null,
    notes: listLeadNotes(row.id, data),
    master: data.masters.find((master) => master.id === row.masterId) ?? null,
  };
}

export function listMasters(): Master[] {
  const data = readDatabase();
  return [...data.masters].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listActiveMasters(): Master[] {
  return getActiveMastersFromData(readDatabase());
}

export function getMasterById(id: string): Master | null {
  const data = readDatabase();
  return data.masters.find((master) => master.id === id) ?? null;
}

export function createMaster(name: string): Master {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Master name is required");
  }

  const data = readDatabase();
  const master: Master = {
    id: createId("master"),
    name: trimmedName,
    isActive: true,
    sortOrder:
      data.masters.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1,
  };

  data.masters.push(master);
  writeDatabase(data);
  return master;
}

export function updateMaster(id: string, input: UpdateMasterInput): Master {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error("Master name is required");
  }

  let data = readDatabase();
  const master = data.masters.find((item) => item.id === id);

  if (!master) {
    throw new Error("Master not found");
  }

  if (master.isActive && !input.isActive) {
    data = rebalanceLeadsForMasterRemoval(id, data);
  }

  const nextMaster = data.masters.find((item) => item.id === id);

  if (!nextMaster) {
    throw new Error("Master not found");
  }

  nextMaster.name = trimmedName;
  nextMaster.isActive = input.isActive;
  writeDatabase(data);
  return nextMaster;
}

export function deleteMaster(id: string) {
  let data = readDatabase();
  const master = data.masters.find((item) => item.id === id);

  if (!master) {
    throw new Error("Master not found");
  }

  const activeMastersCount = getActiveMastersFromData(data).length;

  if (master.isActive && activeMastersCount <= 1) {
    throw new Error("Нужно оставить хотя бы одного активного мастера");
  }

  if (master.isActive) {
    data = rebalanceLeadsForMasterRemoval(id, data);
  }

  data.masters = data.masters.filter((item) => item.id !== id);
  data.leads = data.leads.map((lead) =>
    lead.masterId === id ? { ...lead, masterId: null } : lead,
  );
  writeDatabase(data);
}

export function listAvailableMastersForAppointment(
  appointmentAt: string,
  options: AppointmentAvailabilityOptions = {},
): Master[] {
  const data = readDatabase();
  return getAvailableMastersForSlot(appointmentAt, data, options);
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
  return getFirstFreeMasterForSlot(appointmentAt, data, options) !== null;
}

export function createLead(input: CreateLeadInput): Lead {
  const data = readDatabase();
  const id = createId("lead");
  const timestamp = nowIso();
  const assignedMaster = input.appointmentAt
    ? getFirstFreeMasterForSlot(input.appointmentAt, data, { excludeLeadId: null })
    : null;

  if (input.appointmentAt && !assignedMaster) {
    throw new Error("Appointment slot is already taken");
  }

  const lead: LeadRecord = {
    id,
    telegramId: input.telegramId ?? null,
    name: input.name,
    phone: input.phone,
    comment: input.comment,
    appointmentAt: input.appointmentAt ?? null,
    masterId: assignedMaster?.id ?? null,
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

  const assignedMaster = appointmentAt
    ? getFirstFreeMasterForSlot(appointmentAt, data, { excludeLeadId: leadId })
    : null;

  if (appointmentAt && !assignedMaster) {
    throw new Error("Appointment slot is already taken");
  }

  lead.appointmentAt = appointmentAt;
  lead.masterId = assignedMaster?.id ?? null;
  lead.updatedAt = timestamp;
  writeDatabase(data);

  return mapLead(lead, data);
}

export function updateLeadMaster(leadId: string, masterId: string): Lead {
  const data = readDatabase();
  const lead = data.leads.find((item) => item.id === leadId);
  const master = data.masters.find((item) => item.id === masterId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  if (!lead.appointmentAt) {
    throw new Error("Lead does not have an appointment");
  }

  if (!master || !master.isActive) {
    throw new Error("Master is not available");
  }

  const availableMasters = getAvailableMastersForSlot(lead.appointmentAt, data, {
    excludeLeadId: leadId,
  });

  if (!availableMasters.some((item) => item.id === masterId)) {
    throw new Error("Master is busy at this time");
  }

  lead.masterId = masterId;
  lead.updatedAt = nowIso();
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
