import Link from "next/link";
import { getCurrentLocale } from "../../lib/i18n";

export const dynamic = "force-dynamic";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    sent?: string;
    email?: string;
    error?: string;
    debug_link?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const locale = await getCurrentLocale();
  const params = (await searchParams) ?? {};

  const text = {
    title: locale === "ru" ? "Подтверждение почты" : "Verify your email",
    sent:
      locale === "ru"
        ? "Мы отправили письмо со ссылкой для подтверждения."
        : "We sent an email with a verification link.",
    openMail:
      locale === "ru"
        ? "Откройте письмо и перейдите по ссылке, после этого можно будет войти в CRM."
        : "Open the email and follow the link, then you will be able to sign in to the CRM.",
    invalid:
      locale === "ru"
        ? "Ссылка недействительна или уже использована."
        : "This link is invalid or has already been used.",
    expired:
      locale === "ru"
        ? "Срок действия ссылки истёк. Позже добавим удобную повторную отправку прямо из CRM."
        : "This link has expired. We will add an easy resend flow next.",
    login: locale === "ru" ? "Перейти ко входу" : "Go to sign in",
    debug: locale === "ru" ? "Тестовая ссылка для локальной разработки" : "Local development verification link",
  };

  const errorText =
    params.error === "expired"
      ? text.expired
      : params.error === "invalid"
        ? text.invalid
        : null;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
      <section className="w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-lg)] sm:p-10">
        <h1
          className="text-4xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {text.title}
        </h1>

        {params.sent === "1" ? (
          <div className="mt-6 space-y-3 text-sm leading-7 text-[color:var(--foreground-soft)] sm:text-base">
            <p>{text.sent}</p>
            {params.email ? <p>{params.email}</p> : null}
            <p>{text.openMail}</p>
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-6 rounded-[1.4rem] border border-[color:var(--danger-soft)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--danger)]">
            {errorText}
          </div>
        ) : null}

        {params.debug_link ? (
          <div className="mt-6 rounded-[1.4rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4 text-sm">
            <p className="font-medium text-[color:var(--foreground)]">{text.debug}</p>
            <Link
              href={params.debug_link}
              className="mt-2 block break-all text-[color:var(--accent-strong)] hover:underline"
            >
              {params.debug_link}
            </Link>
          </div>
        ) : null}

        <div className="mt-8">
          <Link
            href="/login"
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
          >
            {text.login}
          </Link>
        </div>
      </section>
    </main>
  );
}
