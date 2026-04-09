import { cookies } from "next/headers";

export type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

const THEME_COOKIE = "crm_theme";
const THEMES: Theme[] = ["light", "dark"];
const THEME_PREFERENCES: ThemePreference[] = ["light", "dark", "system"];

export function isTheme(value: string | undefined | null): value is Theme {
  return Boolean(value && THEMES.includes(value as Theme));
}

export function isThemePreference(
  value: string | undefined | null,
): value is ThemePreference {
  return Boolean(
    value && THEME_PREFERENCES.includes(value as ThemePreference),
  );
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemTheme: Theme = "light",
): Theme {
  return preference === "system" ? systemTheme : preference;
}

export async function getCurrentThemePreference(): Promise<ThemePreference> {
  const cookieStore = await cookies();
  const value = cookieStore.get(THEME_COOKIE)?.value;
  return isThemePreference(value) ? value : "system";
}

export async function getCurrentTheme(): Promise<Theme> {
  const preference = await getCurrentThemePreference();
  return resolveThemePreference(preference);
}

export function getThemeCookieName() {
  return THEME_COOKIE;
}
