"use server";

import { redirect } from "next/navigation";
import { loginManager, registerOrganizationOwner } from "../../lib/auth";

function redirectWithParams(pathname: string, params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      search.set(key, value);
    }
  }

  const query = search.toString();
  redirect(query ? `${pathname}?${query}` : pathname);
}

export async function registerOwnerAction(formData: FormData) {
  const businessName = String(formData.get("businessName") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    redirectWithParams("/register", { error_code: "password_mismatch" });
  }

  const result = await registerOrganizationOwner({
    businessName,
    name,
    email,
    password,
  });

  if (!result.ok) {
    redirectWithParams("/register", { error_code: result.code });
  }

  redirectWithParams("/verify-email", {
    sent: "1",
    email: result.email,
    debug_link:
      !result.delivered && process.env.NODE_ENV !== "production"
        ? result.verificationUrl
        : undefined,
  });
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const result = await loginManager({ email, password });

  if (!result.ok) {
    redirectWithParams("/login", { error_code: result.code, email });
  }

  redirect("/");
}
