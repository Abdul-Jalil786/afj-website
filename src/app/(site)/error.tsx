"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Site error:", error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-6xl font-bold text-navy">Oops!</div>
        <h1 className="mb-4 text-2xl font-semibold text-navy">
          Something went wrong
        </h1>
        <p className="mb-8 text-gray-600">
          We encountered an unexpected error. Please try again, or return to the
          homepage if the problem persists.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg">
            Try Again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
