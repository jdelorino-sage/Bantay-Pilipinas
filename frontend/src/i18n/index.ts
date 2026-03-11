import { en } from "./en";
import { fil } from "./fil";

export type Locale = "en" | "fil";

export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = { en, fil };

let currentLocale: Locale = (localStorage.getItem("bp-locale") as Locale) || "en";

export function t(key: TranslationKey): string {
  return translations[currentLocale][key] || translations.en[key] || key;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  localStorage.setItem("bp-locale", locale);
  document.dispatchEvent(new CustomEvent("locale-change", { detail: { locale } }));
}

export function toggleLocale(): void {
  setLocale(currentLocale === "en" ? "fil" : "en");
}
