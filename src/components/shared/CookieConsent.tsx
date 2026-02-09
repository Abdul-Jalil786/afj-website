"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { getConsent, setConsent, type ConsentPreferences } from "@/lib/consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = getConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = useCallback(() => {
    setConsent({ analytics: true, marketing: true });
    setVisible(false);
  }, []);

  const handleRejectNonEssential = useCallback(() => {
    setConsent({ analytics: false, marketing: false });
    setVisible(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    const preferences: ConsentPreferences = { analytics, marketing };
    setConsent(preferences);
    setVisible(false);
  }, [analytics, marketing]);

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg motion-safe:animate-[slideUp_300ms_ease-out]"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-[#001c34]">
              We value your privacy
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              We use cookies to enhance your browsing experience, analyse site
              traffic, and support our marketing efforts. You can manage your
              preferences or learn more in our{" "}
              <Link
                href="/cookie-policy"
                className="font-medium text-[#00a85b] underline hover:text-[#008a4a]"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#001c34] transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a85b]"
              aria-expanded={showPreferences}
              aria-controls="cookie-preferences"
            >
              Manage Preferences
            </button>
            <button
              onClick={handleRejectNonEssential}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#001c34] transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a85b]"
            >
              Reject Non-Essential
            </button>
            <button
              onClick={handleAcceptAll}
              className="rounded-md bg-[#00a85b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#008a4a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a85b]"
            >
              Accept All
            </button>
          </div>
        </div>

        {showPreferences && (
          <div
            id="cookie-preferences"
            className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <h3 className="text-sm font-semibold text-[#001c34]">
              Cookie Preferences
            </h3>

            <div className="mt-3 space-y-3">
              {/* Essential - always on */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Essential
                  </span>
                  <p className="text-xs text-gray-500">
                    Required for the website to function. Cannot be disabled.
                  </p>
                </div>
                <button
                  disabled
                  aria-label="Essential cookies are always enabled"
                  className="relative inline-flex h-6 w-11 cursor-not-allowed items-center rounded-full bg-[#00a85b] opacity-60"
                >
                  <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white" />
                </button>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Analytics
                  </span>
                  <p className="text-xs text-gray-500">
                    Google Analytics, GTM, and Microsoft Clarity for
                    understanding site usage.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={analytics}
                  aria-label="Toggle analytics cookies"
                  onClick={() => setAnalytics(!analytics)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a85b] ${
                    analytics ? "bg-[#00a85b]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      analytics ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Marketing
                  </span>
                  <p className="text-xs text-gray-500">
                    Used for targeted advertising and measuring ad effectiveness.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={marketing}
                  aria-label="Toggle marketing cookies"
                  onClick={() => setMarketing(!marketing)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a85b] ${
                    marketing ? "bg-[#00a85b]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                      marketing ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSavePreferences}
                className="rounded-md bg-[#001c34] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#002d52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a85b]"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
