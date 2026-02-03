import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <Container>
        <div className="text-center">
          <h1 className="text-9xl font-bold text-green mb-4">404</h1>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-md mx-auto">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Link>
            </Button>
            <Button variant="outlineWhite" size="lg" asChild>
              <Link href="/contact">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
