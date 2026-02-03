import { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase, Clock, ArrowRight, Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CTASection } from "@/components/sections";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Join the AFJ Limited team. Explore current job openings and discover exciting career opportunities in transportation.",
};

interface JobPosting {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  shortDescription: string;
  publishedAt: string;
}

const jobPostings: JobPosting[] = [
  {
    id: "1",
    title: "SEND Transport Driver",
    slug: "send-transport-driver",
    department: "Driving",
    location: "Birmingham",
    type: "Full-time",
    salary: "£25,000 - £28,000",
    shortDescription:
      "We're looking for caring and reliable drivers to transport children with special educational needs safely to school.",
    publishedAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Patient Transport Driver",
    slug: "patient-transport-driver",
    department: "Driving",
    location: "Birmingham",
    type: "Full-time",
    salary: "£24,000 - £27,000",
    shortDescription:
      "Join our NEPTS team to provide compassionate transport services for patients attending medical appointments.",
    publishedAt: "2024-01-12",
  },
  {
    id: "3",
    title: "Vehicle Technician",
    slug: "vehicle-technician",
    department: "Maintenance",
    location: "Birmingham",
    type: "Full-time",
    salary: "£30,000 - £35,000",
    shortDescription:
      "Experienced vehicle technician needed to maintain and repair our fleet of passenger transport vehicles.",
    publishedAt: "2024-01-10",
  },
  {
    id: "4",
    title: "Transport Coordinator",
    slug: "transport-coordinator",
    department: "Operations",
    location: "Birmingham",
    type: "Full-time",
    salary: "£26,000 - £30,000",
    shortDescription:
      "Coordinate daily transport operations, manage driver schedules, and ensure excellent service delivery.",
    publishedAt: "2024-01-08",
  },
  {
    id: "5",
    title: "Passenger Assistant",
    slug: "passenger-assistant",
    department: "Operations",
    location: "Birmingham",
    type: "Part-time",
    salary: "£12.50/hour",
    shortDescription:
      "Support passengers during their journey, ensuring their comfort, safety, and wellbeing at all times.",
    publishedAt: "2024-01-05",
  },
  {
    id: "6",
    title: "Training Instructor",
    slug: "training-instructor",
    department: "Training",
    location: "Birmingham",
    type: "Full-time",
    salary: "£32,000 - £38,000",
    shortDescription:
      "Deliver MiDAS, PATS, and driver training courses to new and existing staff members.",
    publishedAt: "2024-01-03",
  },
];

const departments = [
  "All Departments",
  "Driving",
  "Operations",
  "Maintenance",
  "Administration",
  "Training",
];

const benefits = [
  "Competitive salary packages",
  "Company pension scheme",
  "28 days annual leave",
  "Training and development",
  "Career progression opportunities",
  "Employee assistance program",
  "Uniform provided",
  "Supportive team environment",
];

export default function CareersPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join Our Team
            </h1>
            <p className="text-xl text-white/80">
              We're always looking for talented individuals to join our growing
              team. Explore our current opportunities and take the next step in
              your career.
            </p>
          </div>
        </Container>
      </section>

      {/* Search & Filter */}
      <section className="py-8 border-b">
        <Container>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    dept === "All Departments"
                      ? "bg-green text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Job Listings */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Jobs List */}
            <div className="lg:col-span-2 space-y-4">
              <p className="text-muted-foreground mb-4">
                {jobPostings.length} positions available
              </p>

              {jobPostings.map((job) => (
                <Link key={job.id} href={`/careers/${job.slug}`} className="group block">
                  <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-semibold text-navy group-hover:text-green transition-colors">
                          {job.title}
                        </h3>
                        <Badge variant="outline">{job.department}</Badge>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {job.shortDescription}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {job.type}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {job.salary}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Benefits */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    Why Work With Us?
                  </h3>
                  <ul className="space-y-3">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green mt-2 mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Spontaneous Application */}
              <Card className="border-0 shadow-md bg-green/5">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    Don't See a Suitable Role?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We're always interested in hearing from talented individuals.
                    Send us your CV for future opportunities.
                  </p>
                  <Button asChild size="sm">
                    <Link href="/contact">
                      Send Your CV
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </section>

      <CTASection
        title="Have Questions About Careers?"
        description="Our recruitment team is happy to help. Get in touch to learn more about working at AFJ Limited."
        primaryCta={{ text: "Contact HR", href: "/contact" }}
        secondaryCta={{ text: "View All Jobs", href: "/careers" }}
      />
    </>
  );
}
