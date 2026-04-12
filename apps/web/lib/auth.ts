import bcrypt from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SESSION_COOKIE_NAME } from "./auth-shared";

function loadAuthEnv() {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const candidates = [
    path.resolve(currentDir, "../.env"),
    path.resolve(currentDir, "../../.env"),
    path.resolve(currentDir, "../../../.env"),
  ];

  for (const envPath of candidates) {
    loadEnv({ path: envPath, override: true, quiet: true });
  }
}

loadAuthEnv();

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return value;
  }

  let trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return undefined;
  }

  return trimmed;
}

process.env.CRM_BASE_URL = normalizeEnvValue(process.env.CRM_BASE_URL);
process.env.DATABASE_URL = normalizeEnvValue(process.env.DATABASE_URL);
process.env.SMTP_HOST = normalizeEnvValue(process.env.SMTP_HOST);
process.env.SMTP_PORT = normalizeEnvValue(process.env.SMTP_PORT);
process.env.SMTP_SECURE = normalizeEnvValue(process.env.SMTP_SECURE);
process.env.SMTP_USER = normalizeEnvValue(process.env.SMTP_USER);
process.env.SMTP_PASS = normalizeEnvValue(process.env.SMTP_PASS);
process.env.SMTP_FROM = normalizeEnvValue(process.env.SMTP_FROM);

const SESSION_TTL_DAYS = 30;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const CRM_BASE_URL = process.env.CRM_BASE_URL ?? "http://localhost:3001";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_SECURE =
  process.env.SMTP_SECURE == null
    ? SMTP_PORT === 465
    : ["1", "true", "yes", "on"].includes(process.env.SMTP_SECURE.toLowerCase());
const DEFAULT_ROLE = "owner";

async function getPrismaClient() {
  const { prisma } = await import("@crm-bot/db/prisma");
  return prisma;
}

type RegisterOwnerInput = {
  businessName: string;
  name: string;
  email: string;
  password: string;
};

type CurrentManagerSession = {
  sessionId: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerifiedAt: string | null;
  };
};

function now() {
  return new Date();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function slugifyBusinessName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `business-${crypto.randomBytes(3).toString("hex")}`;
}

async function createUniqueOrganizationSlug(name: string) {
  const prisma = await getPrismaClient();
  const baseSlug = slugifyBusinessName(name);
  let candidate = baseSlug;
  let counter = 2;

  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function getDefaultMasters(organizationId: string) {
  return [
    {
      id: createId("master"),
      organizationId,
      name: "Мастер 1",
      isActive: true,
      sortOrder: 1,
    },
    {
      id: createId("master"),
      organizationId,
      name: "Мастер 2",
      isActive: true,
      sortOrder: 2,
    },
  ];
}

function getDefaultMasterSchedule(masterId: string) {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    id: createId("schedule"),
    masterId,
    dayOfWeek,
    isWorking: dayOfWeek >= 1 && dayOfWeek <= 5,
    startTime: "10:00",
    endTime: "19:00",
  }));
}

function getDefaultServices(organizationId: string) {
  return [
    {
      id: createId("service"),
      organizationId,
      name: "Базовая услуга",
      durationMinutes: 60,
      price: null,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: createId("service"),
      organizationId,
      name: "Длительная услуга",
      durationMinutes: 120,
      price: null,
      isActive: true,
      sortOrder: 2,
    },
  ];
}

function getDefaultBookingSettings(organizationId: string, managerName: string) {
  return {
    organizationId,
    minLeadTimeMinutes: 0,
    managerName,
    managerRole: "Owner",
    remindersEnabled: true,
    dayBeforeReminderEnabled: false,
    dayBeforeReminderMinutes: 181,
    sameDayReminderEnabled: true,
    sameDayReminderMinutes: 180,
    welcomeTemplate: [
      "Рада помочь с записью.",
      "Сначала выберите услугу, а дальше я быстро проведу вас до удобного времени.",
    ].join("\n"),
    bookingCreatedTemplate: [
      "Готово, запись сохранена.",
      "Заявка: {lead_id}",
      "Услуга: {service_name}",
      "Когда ждём: {appointment}",
      "Если запись оформлена заранее, я аккуратно напомню о ней за 3 часа до визита.",
      "Если захотите перенести запись, отправьте {reschedule_command}.",
      "Если захотите отменить запись, отправьте {cancel_command}.",
    ].join("\n"),
    reminderDayBeforeTemplate: [
      "Небольшое напоминание о вашей записи.",
      "Ждём вас: {appointment}",
      "Если планы изменились, ниже можно быстро перенести или отменить запись.",
    ].join("\n"),
    reminderSameDayTemplate: [
      "Небольшое напоминание о вашей записи.",
      "Ждём вас: {appointment}",
      "Если планы изменились, ниже можно быстро перенести или отменить запись.",
    ].join("\n"),
    bookingRescheduledTemplate: [
      "Запись обновили.",
      "Новое время: {appointment}",
      "Если новое время не подходит, можно воспользоваться {reschedule_command} или {cancel_command}.",
    ].join("\n"),
    bookingCancelledTemplate: [
      "Запись отменили.",
      "Отменённое время: {appointment}",
      "Если захотите выбрать новое время, просто отправьте {start_command}.",
    ].join("\n"),
  };
}

function getVerificationUrl(token: string) {
  const url = new URL("/verify-email/confirm", CRM_BASE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

async function getMailTransport() {
  const smtpHost = normalizeEnvValue(process.env.SMTP_HOST);
  const smtpFrom = normalizeEnvValue(process.env.SMTP_FROM);
  const smtpUser = normalizeEnvValue(process.env.SMTP_USER);
  const smtpPass = normalizeEnvValue(process.env.SMTP_PASS);

  if (!smtpHost || !smtpFrom) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });
}

export function getSmtpConfigurationSummary() {
  const host = normalizeEnvValue(process.env.SMTP_HOST);
  const from = normalizeEnvValue(process.env.SMTP_FROM);

  return {
    configured: Boolean(host && from),
    host: host ?? null,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    from: from ?? null,
  };
}

async function sendVerificationEmail(input: {
  email: string;
  name: string;
  businessName: string;
  verificationUrl: string;
}) {
  const transport = await getMailTransport();

  const smtpFrom = normalizeEnvValue(process.env.SMTP_FROM);

  if (!transport || !smtpFrom) {
    console.log(`[auth] Email verification for ${input.email}: ${input.verificationUrl}`);
    return {
      delivered: false,
      verificationUrl: input.verificationUrl,
    };
  }

  await transport.sendMail({
    from: smtpFrom,
    to: input.email,
    subject: `Подтверждение почты для ${input.businessName}`,
    text: [
      `Здравствуйте, ${input.name}!`,
      "",
      `Подтвердите почту для входа в CRM:`,
      input.verificationUrl,
      "",
      `Ссылка действует ${EMAIL_VERIFICATION_TTL_HOURS} часа.`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #141414;">
        <p>Здравствуйте, ${input.name}!</p>
        <p>Подтвердите почту для входа в CRM.</p>
        <p>
          <a href="${input.verificationUrl}" style="display: inline-block; padding: 12px 18px; background: #4d63ff; color: white; text-decoration: none; border-radius: 999px;">
            Подтвердить почту
          </a>
        </p>
        <p>Если кнопка не открывается, используйте ссылку:</p>
        <p><a href="${input.verificationUrl}">${input.verificationUrl}</a></p>
        <p>Ссылка действует ${EMAIL_VERIFICATION_TTL_HOURS} часа.</p>
      </div>
    `,
  });

  return {
    delivered: true,
    verificationUrl: input.verificationUrl,
  };
}

export async function sendSmtpTestEmail(input: {
  email: string;
  name: string;
  managerName?: string;
}) {
  const transport = await getMailTransport();
  const smtpFrom = normalizeEnvValue(process.env.SMTP_FROM);

  if (!transport || !smtpFrom) {
    return { ok: false as const, code: "smtp_not_configured" };
  }

  const greetingName = input.name || "there";
  const managerName = input.managerName || "CRM Bot";

  await transport.sendMail({
    from: smtpFrom,
    to: input.email,
    subject: "SMTP test from CRM Bot",
    text: [
      `Hello, ${greetingName}!`,
      "",
      "This is a test email from your CRM SMTP configuration.",
      `Sent by: ${managerName}`,
      `SMTP host: ${getSmtpConfigurationSummary().host ?? "unknown"}`,
      "",
      "If you received this message, email verification delivery is ready.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #141414;">
        <p>Hello, ${greetingName}!</p>
        <p>This is a test email from your CRM SMTP configuration.</p>
        <p><strong>Sent by:</strong> ${managerName}</p>
        <p><strong>SMTP host:</strong> ${getSmtpConfigurationSummary().host ?? "unknown"}</p>
        <p>If you received this message, email verification delivery is ready.</p>
      </div>
    `,
  });

  return { ok: true as const };
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearCurrentSession() {
  const prisma = await getPrismaClient();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.managerSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentManagerSession(): Promise<CurrentManagerSession | null> {
  const prisma = await getPrismaClient();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.managerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!session || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    sessionId: session.id,
    organization: {
      id: session.user.organization.id,
      name: session.user.organization.name,
      slug: session.user.organization.slug,
    },
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      emailVerifiedAt: session.user.emailVerifiedAt?.toISOString() ?? null,
    },
  };
}

export async function registerOrganizationOwner(input: RegisterOwnerInput) {
  const prisma = await getPrismaClient();
  const businessName = input.businessName.trim();
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;

  if (!businessName) {
    return { ok: false as const, code: "business_name_required" };
  }

  if (!name) {
    return { ok: false as const, code: "name_required" };
  }

  if (!email || !email.includes("@")) {
    return { ok: false as const, code: "email_invalid" };
  }

  if (password.length < 8) {
    return { ok: false as const, code: "password_too_short" };
  }

  const existingUser = await prisma.managerUser.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { ok: false as const, code: "email_taken" };
  }

  const slug = await createUniqueOrganizationSlug(businessName);
  const passwordHash = await bcrypt.hash(password, 12);
  const organizationId = createId("org");
  const userId = createId("manager");
  const verificationToken = createToken();
  const verificationTokenHash = hashToken(verificationToken);
  const verificationExpiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
  );

  await prisma.$transaction(async (tx) => {
    await tx.organization.create({
      data: {
        id: organizationId,
        name: businessName,
        slug,
      },
    });

    await tx.managerUser.create({
      data: {
        id: userId,
        organizationId,
        name,
        email,
        role: DEFAULT_ROLE,
        passwordHash,
      },
    });

    const masters = getDefaultMasters(organizationId);
    const services = getDefaultServices(organizationId);

    await tx.bookingSettings.create({
      data: getDefaultBookingSettings(organizationId, name),
    });

    await tx.master.createMany({
      data: masters,
    });

    await tx.masterScheduleDay.createMany({
      data: masters.flatMap((master) => getDefaultMasterSchedule(master.id)),
    });

    await tx.service.createMany({
      data: services,
    });

    await tx.emailVerificationToken.create({
      data: {
        id: createId("verify"),
        userId,
        tokenHash: verificationTokenHash,
        expiresAt: verificationExpiresAt,
      },
    });
  });

  const verificationUrl = getVerificationUrl(verificationToken);
  const mailResult = await sendVerificationEmail({
    email,
    name,
    businessName,
    verificationUrl,
  });

  return {
    ok: true as const,
    email,
    delivered: mailResult.delivered,
    verificationUrl: mailResult.verificationUrl,
  };
}

export async function verifyEmailToken(token: string) {
  const prisma = await getPrismaClient();
  const tokenHash = hashToken(token);
  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!verification) {
    return { ok: false as const, code: "invalid_token" };
  }

  if (verification.expiresAt.getTime() <= Date.now()) {
    await prisma.emailVerificationToken.delete({ where: { id: verification.id } });
    return { ok: false as const, code: "expired_token" };
  }

  await prisma.$transaction([
    prisma.managerUser.update({
      where: { id: verification.userId },
      data: {
        emailVerifiedAt: now(),
      },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: verification.userId },
    }),
  ]);

  return {
    ok: true as const,
    email: verification.user.email,
  };
}

export async function loginManager(input: { email: string; password: string }) {
  const prisma = await getPrismaClient();
  const email = normalizeEmail(input.email);
  const user = await prisma.managerUser.findUnique({
    where: { email },
    include: {
      organization: true,
    },
  });

  if (!user || !user.passwordHash) {
    return { ok: false as const, code: "invalid_credentials" };
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    return { ok: false as const, code: "invalid_credentials" };
  }

  if (!user.emailVerifiedAt) {
    return { ok: false as const, code: "email_not_verified" };
  }

  const sessionToken = createToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.managerSession.create({
    data: {
      id: createId("session"),
      userId: user.id,
      tokenHash: hashToken(sessionToken),
      expiresAt,
    },
  });

  await setSessionCookie(sessionToken, expiresAt);

  return {
    ok: true as const,
    organizationSlug: user.organization.slug,
  };
}
