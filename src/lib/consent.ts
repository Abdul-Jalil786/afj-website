export const CONSENT_COOKIE_NAME = "cookie-consent";

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

export function getConsent(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

  if (!cookie) return null;

  try {
    return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  const consent = getConsent();
  return consent?.analytics === true;
}

export function setConsent(preferences: ConsentPreferences): void {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);

  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(preferences)
  )}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;

  window.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: preferences }));
}
