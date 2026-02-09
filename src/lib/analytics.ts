import { hasAnalyticsConsent } from "@/lib/consent";

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function" && hasAnalyticsConsent();
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!canTrack()) return;
  window.gtag("event", eventName, params);
}

export function trackFormSubmission(formName: string, success: boolean, step?: number): void {
  trackEvent(success ? "form_submission_success" : "form_submission_error", {
    form_name: formName,
    ...(step !== undefined && { form_step: step }),
  });
}

export function trackPhoneClick(): void {
  trackEvent("phone_click", { link_type: "tel" });
}

export function trackEmailClick(): void {
  trackEvent("email_click", { link_type: "mailto" });
}

export function trackBookNowClick(): void {
  trackEvent("book_now_click");
}
