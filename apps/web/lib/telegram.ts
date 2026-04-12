import { execFileSync } from "node:child_process";
import * as https from "node:https";
import { getBookingSettings, renderBotTemplate, type Lead } from "@crm-bot/db";
import { HttpsProxyAgent } from "https-proxy-agent";

const MOSCOW_TIMEZONE = "Europe/Moscow";

function normalizeProxyUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `http://${value}`;
}

function getWindowsProxyUrl() {
  if (process.platform !== "win32") {
    return null;
  }

  try {
    const raw = execFileSync(
      "reg",
      [
        "query",
        "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
        "/v",
        "ProxyServer",
      ],
      { encoding: "utf8" },
    );

    const match = raw.match(/ProxyServer\s+REG_\w+\s+(.+)/);

    if (!match?.[1]) {
      return null;
    }

    const proxyValue = match[1].trim();
    const firstProxy = proxyValue.includes(";")
      ? proxyValue.split(";")[0]
      : proxyValue;

    if (firstProxy.includes("=")) {
      const httpsMatch = firstProxy.match(/https=([^;]+)/i);
      const httpMatch = firstProxy.match(/http=([^;]+)/i);
      const target = httpsMatch?.[1] ?? httpMatch?.[1];
      return target ? normalizeProxyUrl(target.trim()) : null;
    }

    return normalizeProxyUrl(firstProxy);
  } catch {
    return null;
  }
}

function resolveProxyUrl() {
  const envProxy =
    process.env.HTTPS_PROXY ??
    process.env.HTTP_PROXY ??
    process.env.ALL_PROXY;

  if (envProxy) {
    return normalizeProxyUrl(envProxy);
  }

  return getWindowsProxyUrl();
}

function formatAppointment(appointmentAt: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: MOSCOW_TIMEZONE,
  }).format(new Date(appointmentAt));
}

function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    return Promise.resolve(false);
  }

  const url = new URL(`https://api.telegram.org/bot${token}/sendMessage`);
  const payload = JSON.stringify({
    chat_id: chatId,
    text,
  });
  const proxyUrl = resolveProxyUrl();

  return new Promise<boolean>((resolve, reject) => {
    const request = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        agent: proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined,
      },
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += String(chunk);
        });

        response.on("end", () => {
          if (!response.statusCode || response.statusCode >= 400) {
            reject(
              new Error(
                `Telegram sendMessage failed with status ${response.statusCode ?? "unknown"}: ${body}`,
              ),
            );
            return;
          }

          resolve(true);
        });
      },
    );

    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

function hasTelegramChat(lead: Lead) {
  return Boolean(lead.telegramId);
}

async function buildTemplateVariables(lead: Lead, appointment: string | null) {
  const settings = await getBookingSettings(lead.organizationId);
  return {
    client_name: lead.name,
    service_name: lead.service?.name ?? "",
    appointment: appointment ?? "",
    lead_id: lead.id,
    manager_name: settings.managerName,
    start_command: "/start",
    reschedule_command: "/reschedule",
    cancel_command: "/cancel_booking",
  };
}

export async function notifyLeadRescheduled(lead: Lead) {
  if (!lead.telegramId || !lead.appointmentAt) {
    return false;
  }

  const settings = await getBookingSettings(lead.organizationId);
  const variables = await buildTemplateVariables(
    lead,
    formatAppointment(lead.appointmentAt),
  );

  return sendTelegramMessage(
    lead.telegramId,
    renderBotTemplate(
      settings.bookingRescheduledTemplate,
      variables,
    ),
  );
}

export async function notifyLeadCancelled(lead: Lead, previousAppointmentAt: string | null) {
  if (!hasTelegramChat(lead) || !previousAppointmentAt) {
    return false;
  }

  const settings = await getBookingSettings(lead.organizationId);
  const variables = await buildTemplateVariables(
    lead,
    formatAppointment(previousAppointmentAt),
  );

  return sendTelegramMessage(
    lead.telegramId as string,
    renderBotTemplate(
      settings.bookingCancelledTemplate,
      variables,
    ),
  );
}
