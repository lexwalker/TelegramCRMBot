import "dotenv/config";
import { execFileSync } from "node:child_process";
import {
  Bot,
  InlineKeyboard,
  session,
  type Context,
  type SessionFlavor,
} from "grammy";
import {
  countLeads,
  createLead,
  getLatestBookedLeadByTelegramId,
  listActiveServices,
  listAvailableDateKeys,
  listAvailableTimeSlotsForDate,
  updateLeadAppointment,
} from "@crm-bot/db";
import { HttpsProxyAgent } from "https-proxy-agent";

const token = process.env.TELEGRAM_BOT_TOKEN;
const maskedToken = token ? `${token.slice(0, 10)}...` : "missing";
const DATE_OPTIONS_DAYS = 7;

type LeadFormStep =
  | "idle"
  | "service"
  | "name"
  | "phone"
  | "comment"
  | "date"
  | "time";
type BookingMode = "create" | "reschedule";

type LeadDraft = {
  serviceId: string | null;
  serviceName: string | null;
  name: string;
  phone: string;
  comment: string;
  selectedDate: string | null;
};

type LeadSession = {
  step: LeadFormStep;
  bookingMode: BookingMode;
  targetLeadId: string | null;
  targetServiceId: string | null;
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
    const firstProxy = proxyValue.includes(";") ? proxyValue.split(";")[0] : proxyValue;

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
  const envProxy = process.env.HTTPS_PROXY ?? process.env.HTTP_PROXY ?? process.env.ALL_PROXY;

  if (envProxy) {
    return normalizeProxyUrl(envProxy);
  }

  return getWindowsProxyUrl();
}

function getInitialSession(): LeadSession {
  return {
    step: "idle",
    bookingMode: "create",
    targetLeadId: null,
    targetServiceId: null,
    draft: {
      serviceId: null,
      serviceName: null,
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

function formatDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00+03:00`);
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Moscow",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatAppointment(appointmentAt: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(appointmentAt));
}

function buildAppointmentIso(dateKey: string, time: string) {
  return `${dateKey}T${time}:00+03:00`;
}

function getTelegramId(ctx: BotContext) {
  return ctx.from?.id ? String(ctx.from.id) : null;
}

function buildServiceKeyboard() {
  const keyboard = new InlineKeyboard();
  const services = listActiveServices();

  services.forEach((service, index) => {
    const priceLabel = service.price == null ? "цена уточняется" : `${service.price} ₽`;
    keyboard.text(
      `${service.name} • ${service.durationMinutes} мин • ${priceLabel}`,
      `service:${service.id}`,
    );

    if (index < services.length - 1) {
      keyboard.row();
    }
  });

  return keyboard;
}

function getFlowServiceId(ctx: BotContext) {
  return ctx.session.bookingMode === "reschedule"
    ? ctx.session.targetServiceId
    : ctx.session.draft.serviceId;
}

function buildDateKeyboard(serviceId: string | null, excludeLeadId?: string | null) {
  const keyboard = new InlineKeyboard();
  const dateKeys = serviceId
    ? listAvailableDateKeys(DATE_OPTIONS_DAYS, serviceId, { excludeLeadId })
    : [];

  if (dateKeys.length === 0) {
    keyboard.text("Отмена", "booking:cancel");
    return keyboard;
  }

  dateKeys.forEach((dateKey, index) => {
    keyboard.text(formatDateLabel(dateKey), `date:${dateKey}`);

    if (index % 2 === 1 || index === dateKeys.length - 1) {
      keyboard.row();
    }
  });

  keyboard.text("Отмена", "booking:cancel");
  return keyboard;
}

function buildTimeKeyboard(
  dateKey: string,
  serviceId: string | null,
  excludeLeadId?: string | null,
) {
  const keyboard = new InlineKeyboard();
  const availableTimeSlots = serviceId
    ? listAvailableTimeSlotsForDate(dateKey, serviceId, { excludeLeadId })
    : [];

  availableTimeSlots.forEach((time, index) => {
    keyboard.text(time, `time:${time}`);

    if (index % 2 === 1 || index === availableTimeSlots.length - 1) {
      keyboard.row();
    }
  });

  keyboard.text("Другой день", `nav:date:${dateKey}`).text("Отмена", "booking:cancel");

  return keyboard;
}

function buildCancelBookingKeyboard(leadId: string) {
  return new InlineKeyboard()
    .text("Да, отменить", `cancel:confirm:${leadId}`)
    .text("Нет", "cancel:abort");
}

async function showDateSelection(ctx: BotContext) {
  ctx.session.step = "date";
  ctx.session.draft.selectedDate = null;
  const excludeLeadId = ctx.session.bookingMode === "reschedule" ? ctx.session.targetLeadId : null;
  const serviceId = getFlowServiceId(ctx);
  const availableDateKeys = serviceId
    ? listAvailableDateKeys(DATE_OPTIONS_DAYS, serviceId, { excludeLeadId })
    : [];
  const title =
    ctx.session.bookingMode === "reschedule"
      ? "Выберите новый день записи."
      : "Выберите удобный день записи.";

  if (!serviceId || availableDateKeys.length === 0) {
    ctx.session = getInitialSession();
    await ctx.reply(
      [
        "Пока не вижу свободных слотов под эту услугу на ближайшие 7 дней.",
        "Попробуйте чуть позже или напишите менеджеру, и мы постараемся подобрать время вручную.",
      ].join("\n"),
    );
    return;
  }

  await ctx.reply(
    [
      `Шаг ${ctx.session.bookingMode === "reschedule" ? "1" : "5"} из ${ctx.session.bookingMode === "reschedule" ? "2" : "6"}. ${title}`,
      "Показываю ближайшие 7 дней, где ещё есть свободное время.",
    ].join("\n"),
    {
      reply_markup: buildDateKeyboard(serviceId, excludeLeadId),
    },
  );
}

async function moveFromPhoneToComment(ctx: BotContext, rawPhone: string) {
  const phone = normalizePhone(rawPhone);

  if (!isPhoneValid(phone)) {
    await ctx.reply(
      "Похоже, номер получился слишком коротким. Отправьте его ещё раз, пожалуйста, например в формате +79991234567.",
    );
    return;
  }

  ctx.session.draft.phone = phone;
  ctx.session.step = "comment";

  await ctx.reply("Шаг 4 из 6. Коротко расскажите, с чем вам помочь.");
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
    const services = listActiveServices();

    if (services.length === 0) {
      await ctx.reply("Сейчас услуги для записи ещё не настроены. Напишите менеджеру, и он быстро всё подготовит.");
      return;
    }

    ctx.session = getInitialSession();
    ctx.session.bookingMode = "create";
    ctx.session.step = "service";

    await ctx.reply(
      [
        "Здравствуйте. Я помогу быстро оставить заявку и выбрать удобное время.",
        "",
        "Шаг 1 из 6. Для начала выберите услугу.",
      ].join("\n"),
      {
        reply_markup: buildServiceKeyboard(),
      },
    );
  }

  bot.command("start", startLeadFlow);
  bot.command("new", startLeadFlow);

  bot.command("cancel", async (ctx) => {
    ctx.session = getInitialSession();
    await ctx.reply(
      [
        "Хорошо, текущую операцию отменил.",
        "Когда будете готовы начать заново, просто отправьте /start.",
      ].join("\n"),
    );
  });

  bot.command("ping", async (ctx) => {
    const leadCount = countLeads();
    await ctx.reply(`Бот работает. В базе сейчас заявок: ${leadCount}.`);
  });

  bot.command("reschedule", async (ctx) => {
    const telegramId = getTelegramId(ctx);

    if (!telegramId) {
      await ctx.reply("Не смог определить ваш Telegram-профиль. Попробуйте ещё раз чуть позже.");
      return;
    }

    const lead = getLatestBookedLeadByTelegramId(telegramId);

    if (!lead || !lead.appointmentAt) {
      await ctx.reply(
        "Пока не вижу активной записи для переноса. Если хотите оформить новую, отправьте /start.",
      );
      return;
    }

    ctx.session = getInitialSession();
    ctx.session.bookingMode = "reschedule";
    ctx.session.targetLeadId = lead.id;
    ctx.session.targetServiceId = lead.serviceId;

    await ctx.reply(
      [
        "Нашёл вашу последнюю запись.",
        `Услуга: ${lead.service?.name ?? "не указана"}`,
        `Сейчас вы записаны на: ${formatAppointment(lead.appointmentAt)}`,
      ].join("\n"),
    );

    await showDateSelection(ctx);
  });

  bot.command("cancel_booking", async (ctx) => {
    const telegramId = getTelegramId(ctx);

    if (!telegramId) {
      await ctx.reply("Не смог определить ваш Telegram-профиль. Попробуйте ещё раз чуть позже.");
      return;
    }

    const lead = getLatestBookedLeadByTelegramId(telegramId);

    if (!lead || !lead.appointmentAt) {
      await ctx.reply("Сейчас не вижу активной записи, которую можно отменить.");
      return;
    }

    await ctx.reply(
      [
        "Пожалуйста, подтвердите отмену записи.",
        `Текущая запись: ${formatAppointment(lead.appointmentAt)}`,
      ].join("\n"),
      {
        reply_markup: buildCancelBookingKeyboard(lead.id),
      },
    );
  });

  bot.callbackQuery("booking:cancel", async (ctx) => {
    ctx.session = getInitialSession();
    await ctx.answerCallbackQuery({ text: "Операция отменена" });
    await ctx.editMessageText(
      [
        "Хорошо, операцию отменил.",
        "Если захотите начать заново, просто отправьте /start.",
      ].join("\n"),
    );
  });

  bot.callbackQuery("cancel:abort", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Отмена записи прервана" });
    await ctx.editMessageText("Хорошо, отмену записи не выполняю.");
  });

  bot.callbackQuery(/^cancel:confirm:/, async (ctx) => {
    const leadId = ctx.callbackQuery.data.slice("cancel:confirm:".length);
    const telegramId = getTelegramId(ctx);

    if (!telegramId) {
      await ctx.answerCallbackQuery({ text: "Не удалось определить профиль" });
      return;
    }

    const lead = getLatestBookedLeadByTelegramId(telegramId);

    if (!lead || lead.id !== leadId || !lead.appointmentAt) {
      await ctx.answerCallbackQuery({ text: "Запись уже недоступна" });
      await ctx.editMessageText("Похоже, эта запись уже отменена или больше недоступна.");
      return;
    }

    updateLeadAppointment(leadId, null, { actor: "bot" });

    await ctx.answerCallbackQuery({ text: "Запись отменена" });
    await ctx.editMessageText(
      [
        "Готово, запись отменена.",
        "Если захотите выбрать новое время, отправьте /start.",
      ].join("\n"),
    );
  });

  bot.callbackQuery(/^service:/, async (ctx) => {
    if (ctx.session.step !== "service") {
      await ctx.answerCallbackQuery({ text: "Начните запись через /start" });
      return;
    }

    const serviceId = ctx.callbackQuery.data.slice("service:".length);
    const service = listActiveServices().find((item) => item.id === serviceId);

    if (!service) {
      await ctx.answerCallbackQuery({ text: "Эта услуга сейчас недоступна" });
      return;
    }

    ctx.session.draft.serviceId = service.id;
    ctx.session.draft.serviceName = service.name;
    ctx.session.step = "name";

    await ctx.answerCallbackQuery({ text: `Услуга: ${service.name}` });
    await ctx.editMessageText(
      [
        "Отлично, услуга выбрана.",
        `${service.name} • ${service.durationMinutes} мин`,
      ].join("\n"),
    );
    await ctx.reply("Шаг 2 из 6. Подскажите, как к вам обращаться.");
  });

  bot.callbackQuery(/^nav:date:/, async (ctx) => {
    if (ctx.session.step !== "time") {
      await ctx.answerCallbackQuery({
        text: "Сначала начните новую операцию через /start или /reschedule",
      });
      return;
    }

    const serviceId = getFlowServiceId(ctx);

    ctx.session.step = "date";
    ctx.session.draft.selectedDate = null;

    await ctx.answerCallbackQuery();
    await ctx.editMessageText(
      [
        `Шаг ${ctx.session.bookingMode === "reschedule" ? "1" : "5"} из ${ctx.session.bookingMode === "reschedule" ? "2" : "6"}. Выберите удобный день записи.`,
        "Показываю ближайшие 7 дней с доступными слотами.",
      ].join("\n"),
      {
        reply_markup: buildDateKeyboard(serviceId, ctx.session.targetLeadId),
      },
    );
  });

  bot.callbackQuery(/^date:/, async (ctx) => {
    if (ctx.session.step !== "date") {
      await ctx.answerCallbackQuery({
        text: "Сначала начните новую операцию через /start или /reschedule",
      });
      return;
    }

    const dateKey = ctx.callbackQuery.data.slice("date:".length);
    const serviceId = getFlowServiceId(ctx);
    const availableTimeSlots = serviceId
      ? listAvailableTimeSlotsForDate(dateKey, serviceId, {
          excludeLeadId:
            ctx.session.bookingMode === "reschedule" ? ctx.session.targetLeadId : null,
        })
      : [];

    if (availableTimeSlots.length === 0) {
      await ctx.answerCallbackQuery({ text: "На этот день свободных слотов уже нет" });
      await ctx.editMessageText(
        [
          "На этот день свободное время уже закончилось.",
          "Давайте выберем другой день.",
        ].join("\n"),
        {
          reply_markup: buildDateKeyboard(serviceId, ctx.session.targetLeadId),
        },
      );
      return;
    }

    ctx.session.draft.selectedDate = dateKey;
    ctx.session.step = "time";

    await ctx.answerCallbackQuery({
      text: `Выбрали дату: ${formatDateLabel(dateKey)}`,
    });
    await ctx.editMessageText(
      [
        `Шаг ${ctx.session.bookingMode === "reschedule" ? "2" : "6"} из ${ctx.session.bookingMode === "reschedule" ? "2" : "6"}. Выберите удобное время.`,
        `Дата: ${formatDateLabel(dateKey)}`,
      ].join("\n"),
      {
        reply_markup: buildTimeKeyboard(dateKey, serviceId, ctx.session.targetLeadId),
      },
    );
  });

  bot.callbackQuery(/^time:/, async (ctx) => {
    if (ctx.session.step !== "time" || !ctx.session.draft.selectedDate) {
      await ctx.answerCallbackQuery({
        text: "Сначала выберите дату через /start или /reschedule",
      });
      return;
    }

    const time = ctx.callbackQuery.data.slice("time:".length);
    const serviceId = getFlowServiceId(ctx);

    if (!serviceId) {
      await ctx.answerCallbackQuery({ text: "Не нашёл услугу, начните заново" });
      return;
    }

    const appointmentAt = buildAppointmentIso(ctx.session.draft.selectedDate, time);
    const availableTimeSlots = listAvailableTimeSlotsForDate(
      ctx.session.draft.selectedDate,
      serviceId,
      {
        excludeLeadId:
          ctx.session.bookingMode === "reschedule" ? ctx.session.targetLeadId : null,
      },
    );

    if (!availableTimeSlots.includes(time)) {
      await ctx.answerCallbackQuery({ text: "Это время уже заняли, давайте выберем другое" });
      await ctx.editMessageText(
        [
          "Похоже, это время уже успели занять.",
          `Дата: ${formatDateLabel(ctx.session.draft.selectedDate)}`,
          "Выберите, пожалуйста, другой слот.",
        ].join("\n"),
        {
          reply_markup: buildTimeKeyboard(
            ctx.session.draft.selectedDate,
            serviceId,
            ctx.session.targetLeadId,
          ),
        },
      );
      return;
    }

    if (ctx.session.bookingMode === "reschedule" && ctx.session.targetLeadId) {
      const updatedLead = updateLeadAppointment(ctx.session.targetLeadId, appointmentAt, {
        actor: "bot",
      });
      ctx.session = getInitialSession();

      await ctx.answerCallbackQuery({ text: "Запись перенесена" });
      await ctx.editMessageText(
        [
          "Готово, запись перенесена.",
          `Новое время: ${formatAppointment(appointmentAt)}`,
        ].join("\n"),
      );
      await ctx.reply(
        [
          "Всё получилось.",
          `Номер заявки: ${updatedLead.id}`,
          `Новая дата и время: ${formatAppointment(appointmentAt)}`,
        ].join("\n"),
      );
      return;
    }

    const lead = createLead({
      telegramId: getTelegramId(ctx),
      name: ctx.session.draft.name,
      phone: ctx.session.draft.phone,
      comment: ctx.session.draft.comment,
      appointmentAt,
      serviceId,
      actor: "bot",
    });

    const serviceName = ctx.session.draft.serviceName ?? lead.service?.name ?? "Услуга";
    ctx.session = getInitialSession();

    await ctx.answerCallbackQuery({ text: "Время выбрано" });
    await ctx.editMessageText(
      [
        "Отлично, дату и время выбрали.",
        `Запись: ${formatAppointment(appointmentAt)}`,
      ].join("\n"),
    );
    await ctx.reply(
      [
        "Спасибо, всё сохранил.",
        `Номер заявки: ${lead.id}`,
        `Услуга: ${serviceName}`,
        `Дата и время записи: ${formatAppointment(appointmentAt)}`,
        "Если захотите перенести запись, отправьте /reschedule.",
        "Если захотите отменить запись, отправьте /cancel_booking.",
      ].join("\n"),
    );
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();
    console.log(`[bot] Text message at step=${ctx.session.step}: ${text}`);

    if (ctx.session.step === "idle") {
      await ctx.reply(
        [
          "Я готов помочь с записью.",
          "Чтобы оставить новую заявку, отправьте /start.",
          "Чтобы перенести запись, отправьте /reschedule.",
          "Чтобы отменить запись, отправьте /cancel_booking.",
          "Если хотите остановить текущий ввод, используйте /cancel.",
        ].join("\n"),
      );
      return;
    }

    if (ctx.session.step === "service") {
      await ctx.reply("Чтобы выбрать услугу, нажмите, пожалуйста, на кнопку под сообщением.");
      return;
    }

    if (ctx.session.step === "name") {
      ctx.session.draft.name = text;
      ctx.session.step = "phone";

      await ctx.reply("Шаг 3 из 6. Отправьте, пожалуйста, телефон для связи.");
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
        "Чтобы выбрать дату и время, используйте кнопки под сообщением. Если захотите начать заново, отправьте /cancel.",
      );
    }
  });

  bot.on("message:contact", async (ctx) => {
    console.log(`[bot] Contact message at step=${ctx.session.step}: ${ctx.message.contact.phone_number}`);

    if (ctx.session.step !== "phone") {
      await ctx.reply(
        "Контакт пришёл не в тот шаг анкеты. Если хотите начать новую заявку, отправьте /start.",
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
