import "dotenv/config";
import { execFileSync } from "node:child_process";
import { Bot, session, type Context, type SessionFlavor } from "grammy";
import { countLeads, createLead } from "@crm-bot/db";
import { HttpsProxyAgent } from "https-proxy-agent";

const token = process.env.TELEGRAM_BOT_TOKEN;
const maskedToken = token ? `${token.slice(0, 10)}...` : "missing";

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

type LeadFormStep = "idle" | "name" | "phone" | "comment";

type LeadDraft = {
  name: string;
  phone: string;
  comment: string;
};

type LeadSession = {
  step: LeadFormStep;
  draft: LeadDraft;
};

type BotContext = Context & SessionFlavor<LeadSession>;

function getInitialSession(): LeadSession {
  return {
    step: "idle",
    draft: {
      name: "",
      phone: "",
      comment: "",
    },
  };
}

function isPhoneValid(phone: string) {
  const normalized = phone.replace(/[^\d+]/g, "");
  return normalized.length >= 10;
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
        "Шаг 1 из 3. Напишите ваше имя.",
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
    const suffix = `В базе сейчас заявок: ${leadCount}.`;

    await ctx.reply(`Бот работает. ${suffix}`);
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text.trim();

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

      await ctx.reply("Шаг 2 из 3. Отправьте телефон для связи.");
      return;
    }

    if (ctx.session.step === "phone") {
      if (!isPhoneValid(text)) {
        await ctx.reply(
          "Телефон выглядит слишком коротким. Отправьте номер ещё раз, например +79991234567.",
        );
        return;
      }

      ctx.session.draft.phone = text;
      ctx.session.step = "comment";

      await ctx.reply("Шаг 3 из 3. Коротко опишите ваш запрос.");
      return;
    }

    if (ctx.session.step === "comment") {
      ctx.session.draft.comment = text;

      const lead = createLead({
        telegramId: ctx.from?.id ? String(ctx.from.id) : null,
        name: ctx.session.draft.name,
        phone: ctx.session.draft.phone,
        comment: ctx.session.draft.comment,
      });

      ctx.session = getInitialSession();

      await ctx.reply(
        [
          "Спасибо. Заявка сохранена.",
          `Номер заявки: ${lead.id}`,
          "При необходимости можно отправить /start и создать новую.",
        ].join("\n"),
      );
    }
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
