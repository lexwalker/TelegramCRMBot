import Link from "next/link";
import { getCurrentLocale } from "../../lib/i18n";
import { loginAction } from "../auth/actions";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams?: Promise<{
    error_code?: string;
    email?: string;
    verified?: string;
  }>;
};

function FormShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
      <section className="w-full rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--surface)] p-8 shadow-[var(--shadow-lg)] sm:p-10">
        <h1
          className="text-4xl font-semibold tracking-[-0.05em] text-[color:var(--foreground)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--foreground-soft)] sm:text-base">
          {description}
        </p>
        {children}
      </section>
    </main>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = await getCurrentLocale();
  const params = (await searchParams) ?? {};

  const text = {
    title: locale === "ru" ? "Вход в CRM" : "Sign in to CRM",
    description:
      locale === "ru"
        ? "Войдите в аккаунт владельца или менеджера, чтобы открыть CRM."
        : "Sign in with your owner or manager account to open the CRM.",
    email: locale === "ru" ? "Email" : "Email",
    password: locale === "ru" ? "Пароль" : "Password",
    submit: locale === "ru" ? "Войти" : "Sign in",
    register: locale === "ru" ? "Нет аккаунта? Зарегистрировать бизнес" : "No account? Register your business",
    verified:
      locale === "ru"
        ? "Почта подтверждена. Теперь можно войти в CRM."
        : "Email verified. You can now sign in to the CRM.",
  };

  const errors: Record<string, string> = {
    invalid_credentials:
      locale === "ru" ? "Неверный email или пароль." : "Incorrect email or password.",
    email_not_verified:
      locale === "ru"
        ? "Сначала подтвердите почту по ссылке из письма."
        : "Please verify your email first using the link from the email.",
  };

  const errorText = params.error_code ? errors[params.error_code] : null;
  const verifiedText = params.verified === "1" ? text.verified : null;

  return (
    <FormShell title={text.title} description={text.description}>
      {verifiedText ? (
        <div className="mt-6 rounded-[1.4rem] border border-[rgba(53,201,120,0.18)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--success)]">
          {verifiedText}
        </div>
      ) : null}

      {errorText ? (
        <div className="mt-6 rounded-[1.4rem] border border-[color:var(--danger-soft)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--danger)]">
          {errorText}
        </div>
      ) : null}

      <form action={loginAction} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm text-[color:var(--muted)]">{text.email}</label>
          <input
            type="email"
            name="email"
            required
            defaultValue={params.email ?? ""}
            className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[color:var(--muted)]">{text.password}</label>
          <input
            type="password"
            name="password"
            required
            className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
          >
            {text.submit}
          </button>
          <Link
            href="/register"
            className="text-sm font-medium text-[color:var(--accent-strong)] transition hover:opacity-80"
          >
            {text.register}
          </Link>
        </div>
      </form>
    </FormShell>
  );
}
