import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Container>
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-green border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Container>
    </div>
  );
}
