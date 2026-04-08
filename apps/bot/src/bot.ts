import "dotenv/config";
import { execFileSync } from "node:child_process";
import { Bot, InlineKeyboard, session, type Context, type SessionFlavor } from "grammy";
import { countLeads, createLead } from "@crm-bot/db";
import { HttpsProxyAgent } from "https-proxy-agent";

const token = process.env.TELEGRAM_BOT_TOKEN;
const maskedToken = token ? `${token.slice(0, 10)}...` : "missing";
const MOSCOW_TIMEZONE = "Europe/Moscow";
const MOSCOW_OFFSET = "+03:00";
const DATE_OPTIONS_DAYS = 7;
const TIME_SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00"] as const;

type LeadFormStep = "idle" | "name" | "phone" | "comment" | "date" | "time";

type LeadDraft = {
  name: string;
  phone: string;
  comment: string;
  selectedDate: string | null;
};

type LeadSession = {
  step: LeadFormStep;
  draft: LeadDraft;
};

type BotContext = Context & SessionFlavor<LeadSession>;

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

function getInitialSession(): LeadSession {
  return {
    step: "idle",
    draft: {
      name: "",
      phone: "",
      comment: "",
      selectedDate: null,
    },
  };
}

function isPhoneValid(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized.length >= 10;
}

function normalizePhone(phone: string) {
  return phone.trim();
}

function getUpcomingDateKeys() {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: MOSCOW_TIMEZONE,
  });
  const dates: string[] = [];

  for (let dayOffset = 0; dayOffset < DATE_OPTIONS_DAYS; dayOffset += 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + dayOffset);
    dates.push(formatter.format(date));
  }

  return dates;
}

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00${MOSCOW_OFFSET}`);
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: MOSCOW_TIMEZONE,
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatAppointment(appointmentAt: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: MOSCOW_TIMEZONE,
  }).format(new Date(appointmentAt));
}

function buildAppointmentIso(dateKey: string, time: string) {
  return `${dateKey}T${time}:00${MOSCOW_OFFSET}`;
}

function buildDateKeyboard() {
  const keyboard = new InlineKeyboard();
  const dateKeys = getUpcomingDateKeys();

  dateKeys.forEach((dateKey, index) => {
    keyboard.text(formatDateLabel(dateKey), `date:${dateKey}`);

    if (index % 2 === 1 || index === dateKeys.length - 1) {
      keyboard.row();
    }
  });

  keyboard.text("Отмена", "booking:cancel");
  return keyboard;
}

function buildTimeKeyboard(dateKey: string) {
  const keyboard = new InlineKeyboard();

  TIME_SLOTS.forEach((time, index) => {
    keyboard.text(time, `time:${time}`);

    if (index % 2 === 1 || index === TIME_SLOTS.length - 1) {
      keyboard.row();
    }
  });

  keyboard
    .text("Другой день", `nav:date:${dateKey}`)
    .text("Отмена", "booking:cancel");

  return keyboard;
}

async function showDateSelection(ctx: BotContext) {
  ctx.session.step = "date";
  ctx.session.draft.selectedDate = null;

  await ctx.reply(
    [
      "Шаг 4 из 5. Выберите удобный день записи.",
      "Показываю ближайшие 7 дней.",
    ].join("\n"),
    {
      reply_markup: buildDateKeyboard(),
    },
  );
}

async function moveFromPhoneToComment(ctx: BotContext, rawPhone: string) {
  const phone = normalizePhone(rawPhone);

  if (!isPhoneValid(phone)) {
    await ctx.reply(
      "Телефон выглядит слишком коротким. Отправьте номер еще раз, например +79991234567.",
    );
    return;
  }

  ctx.session.draft.phone = phone;
  ctx.session.step = "comment";

  await ctx.reply("Шаг 3 из 5. Коротко опишите ваш запрос.");
}

if (!token) {
  console.warn("TELEGRAM_BOT_TOKEN is not set. Bot startup skipped.");
} else {
  const proxyUrl = resolveProxyUrl();
  const bot = new Bot<BotContext>(
    token,
    proxyUrl
      ? {
          client: {
            baseFetchConfig: {
              agent: new HttpsProxyAgent(proxyUrl),
            },
          },
        }
      : undefined,
  );

  console.log(`[bot] Process started. Token: ${maskedToken}`);
  console.log(`[bot] Proxy: ${proxyUrl ?? "not configured"}`);

  bot.use(
    session({
      initial: getInitialSession,
    }),
  );

  async function startLeadFlow(ctx: BotContext) {
    ctx.session = getInitialSession();
    ctx.session.step = "name";

    await ctx.reply(
      [
        "Привет. Я помогу оставить заявку.",
        "",
        "Шаг 1 из 5. Напишите ваше имя.",
      ].join("\n"),
    );
  }

  bot.command("start", startLeadFlow);
  bot.command("new", startLeadFlow);

  bot.command("cancel", async (ctx) => {
    ctx.session = getInitialSession();
    await ctx.reply(
      [
        "Текущая заявка отменена.",
        "Чтобы начать заново, отправьте /start",
      ].join("\n"),
    );
  });

  bot.command("ping", async (ctx) => {
    const leadCount = countLeads();
    await ctx.reply(`Бот работает. В базе сейчас заявок: ${leadCount}.`);
  });

  bot.callbackQuery("booking:cancel", async (ctx) => {
    ctx.session = getInitialSession();
    await ctx.answerCallbackQuery({ text: "Запись отменена" });
    await ctx.editMessageText(
      [
        "Заявка отменена.",
        "Если захотите начать заново, отправьте /start",
      ].join("\n"),
    );
  });

  bot.callbackQuery(/^nav:date:/, async (ctx) => {
    if (ctx.session.step !== "time") {
      await ctx.answerCallbackQuery({
        text: "Сначала начните новую заявку через /start",
      });
      return;
    }

    ctx.session.step = "date";
    ctx.session.draft.selectedDate = null;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      [
        "Шаг 4 из 5. Выберите удобный день записи.",
        "Показываю ближайшие 7 дней.",
      ].join("\n"),
      {
        reply_markup: buildDateKeyboard(),
      },
    );
  });

  bot.callbackQuery(/^date:/, async (ctx) => {
    if (ctx.session.step !== "date") {
      await ctx.answerCallbackQuery({
        text: "Сначала начните новую заявку через /start",
      });
      return;
    }

    const dateKey = ctx.callbackQuery.data.slice("date:".length);
    ctx.session.draft.selectedDate = dateKey;
    ctx.session.step = "time";

    await ctx.answerCallbackQuery({
      text: `Дата выбрана: ${formatDateLabel(dateKey)}`,
    });
    await ctx.editMessageText(
      [
        "Шаг 5 из 5. Выберите удобное время.",
        `Дата: ${formatDateLabel(dateKey)}`,
      ].join("\n"),
      {
        reply_markup: buildTimeKeyboard(dateKey),
      },
    );
  });

  bot.callbackQuery(/^time:/, async (ctx) => {
    if (ctx.session.step !== "time" || !ctx.session.draft.selectedDate) {
      await ctx.answerCallbackQuery({
        text: "Сначала выберите дату заново через /start",
      });
      return;
    }

    const time = ctx.callbackQuery.data.slice("time:".length);
    const appointmentAt = buildAppointmentIso(ctx.session.draft.selectedDate, time);

    const lead = createLead({
      telegramId: ctx.from?.id ? String(ctx.from.id) : null,
      name: ctx.session.draft.name,
      phone: ctx.session.draft.phone,
      comment: ctx.session.draft.comment,
      appointmentAt,
    });

    ctx.session = getInitialSession();

    await ctx.answerCallbackQuery({
      text: "Время выбрано",
    });
    await ctx.editMessageText(
      [
        "Дата и время выбраны.",
        `Запись: ${formatAppointment(appointmentAt)}`,
      ].join("\n"),
    );
    await ctx.reply(
      [
        "Спасибо. Заявка сохранена.",
        `Номер заявки: ${lead.id}`,
        `Дата и время записи: ${formatAppointment(appointmentAt)}`,
        "При необходимости можно отправить /start и создать новую.",
      ].join("\n"),
    );
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    console.log(`[bot] Text message at step=${ctx.session.step}: ${text}`);

    if (ctx.session.step === "idle") {
      await ctx.reply(
        [
          "Чтобы оставить заявку, отправьте /start",
          "Если захотите отменить ввод, используйте /cancel",
        ].join("\n"),
      );
      return;
    }

    if (ctx.session.step === "name") {
      ctx.session.draft.name = text;
      ctx.session.step = "phone";

      await ctx.reply("Шаг 2 из 5. Отправьте телефон для связи.");
      return;
    }

    if (ctx.session.step === "phone") {
      await moveFromPhoneToComment(ctx, text);
      return;
    }

    if (ctx.session.step === "comment") {
      ctx.session.draft.comment = text;
      await showDateSelection(ctx);
      return;
    }

    if (ctx.session.step === "date" || ctx.session.step === "time") {
      await ctx.reply(
        "Для выбора даты и времени используйте кнопки под сообщением. Если хотите начать заново, отправьте /cancel.",
      );
    }
  });

  bot.on("message:contact", async (ctx) => {
    console.log(
      `[bot] Contact message at step=${ctx.session.step}: ${ctx.message.contact.phone_number}`,
    );

    if (ctx.session.step !== "phone") {
      await ctx.reply(
        "Контакт получен вне шага ввода телефона. Если хотите начать новую заявку, отправьте /start.",
      );
      return;
    }

    await moveFromPhoneToComment(ctx, ctx.message.contact.phone_number);
  });

  bot.catch((error) => {
    console.error("[bot] Runtime error:", error.error);
  });

  process.on("unhandledRejection", (error) => {
    console.error("[bot] Unhandled rejection:", error);
  });

  void (async () => {
    try {
      console.log("[bot] Checking Telegram connection...");
      const me = await bot.api.getMe();
      console.log(`[bot] Connected as @${me.username}`);

      await bot.start({
        drop_pending_updates: true,
        onStart() {
          console.log("[bot] Polling started");
        },
      });
    } catch (error) {
      console.error("[bot] Startup failed:", error);
    }
  })();
}
