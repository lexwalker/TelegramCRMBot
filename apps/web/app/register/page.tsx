import Link from "next/link";
import { getCurrentLocale } from "../../lib/i18n";
import { registerOwnerAction } from "../auth/actions";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams?: Promise<{
    error_code?: string;
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
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
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

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const locale = await getCurrentLocale();
  const params = (await searchParams) ?? {};

  const text = {
    title: locale === "ru" ? "Регистрация бизнеса" : "Create your business account",
    description:
      locale === "ru"
        ? "Создайте первый аккаунт владельца. После подтверждения почты можно будет войти в CRM."
        : "Create the first owner account. After email verification you can sign in to the CRM.",
    businessName: locale === "ru" ? "Название бизнеса" : "Business name",
    managerName: locale === "ru" ? "Ваше имя" : "Your name",
    email: locale === "ru" ? "Email" : "Email",
    password: locale === "ru" ? "Пароль" : "Password",
    confirmPassword: locale === "ru" ? "Повторите пароль" : "Confirm password",
    submit: locale === "ru" ? "Создать аккаунт" : "Create account",
    login: locale === "ru" ? "Уже есть аккаунт? Войти" : "Already have an account? Sign in",
  };

  const errors: Record<string, string> = {
    business_name_required:
      locale === "ru" ? "Укажите название бизнеса." : "Please enter the business name.",
    name_required: locale === "ru" ? "Укажите имя владельца." : "Please enter your name.",
    email_invalid:
      locale === "ru" ? "Проверьте email. Похоже, он введён некорректно." : "Please enter a valid email.",
    password_too_short:
      locale === "ru"
        ? "Пароль должен быть не короче 8 символов."
        : "Password must be at least 8 characters long.",
    email_taken:
      locale === "ru"
        ? "Этот email уже используется. Попробуйте войти или использовать другой адрес."
        : "This email is already used. Try signing in or choose another address.",
    password_mismatch:
      locale === "ru" ? "Пароли не совпадают." : "Passwords do not match.",
  };

  const errorText = params.error_code ? errors[params.error_code] : null;

  return (
    <FormShell title={text.title} description={text.description}>
      {errorText ? (
        <div className="mt-6 rounded-[1.4rem] border border-[color:var(--danger-soft)] bg-[color:var(--surface-strong)] p-4 text-sm text-[color:var(--danger)]">
          {errorText}
        </div>
      ) : null}

      <form action={registerOwnerAction} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm text-[color:var(--muted)]">{text.businessName}</label>
          <input
            type="text"
            name="businessName"
            required
            className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[color:var(--muted)]">{text.managerName}</label>
          <input
            type="text"
            name="name"
            required
            className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[color:var(--muted)]">{text.email}</label>
          <input
            type="email"
            name="email"
            required
            className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm text-[color:var(--muted)]">{text.password}</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[color:var(--muted)]">{text.confirmPassword}</label>
            <input
              type="password"
              name="confirmPassword"
              required
              minLength={8}
              className="mt-2 w-full rounded-[1.3rem] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-medium text-[color:var(--accent-foreground)] transition hover:bg-[color:var(--accent-strong)]"
          >
            {text.submit}
          </button>
          <Link
            href="/login"
            className="text-sm font-medium text-[color:var(--accent-strong)] transition hover:opacity-80"
          >
            {text.login}
          </Link>
        </div>
      </form>
    </FormShell>
  );
}
