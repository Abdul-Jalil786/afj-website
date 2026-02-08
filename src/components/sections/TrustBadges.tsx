import { Shield, Award, CheckCircle, BadgeCheck, GraduationCap, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";

const badges = [
  {
    icon: Shield,
    label: "ISO 9001",
    description: "Quality Certified",
  },
  {
    icon: GraduationCap,
    label: "MiDAS",
    description: "Minibus Trained",
  },
  {
    icon: Award,
    label: "ROSPA Gold",
    description: "Safety Award",
  },
  {
    icon: CheckCircle,
    label: "CQC Registered",
    description: "Care Quality",
  },
  {
    icon: BadgeCheck,
    label: "DVSA Approved",
    description: "Driving Standards",
  },
  {
    icon: ShieldCheck,
    label: "DBS Checked",
    description: "Background Verified",
  },
];

export function TrustBadges() {
  return (
    <section className="py-12 bg-navy">
      <Container>
        <p className="text-center text-sm font-medium tracking-wider uppercase text-green mb-8">
          Fully Accredited &amp; Certified
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
          {badges.map((badge) => (
            <div
              key={badge.label}
              className="flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
                <badge.icon className="h-7 w-7 text-green" />
              </div>
              <span className="text-sm font-semibold text-white">
                {badge.label}
              </span>
              <span className="text-xs text-white/60 mt-0.5">
                {badge.description}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
