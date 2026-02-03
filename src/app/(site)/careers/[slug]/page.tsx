"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { MapPin, Briefcase, Clock, Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { client, jobPostingBySlugQuery } from "@/lib/sanity";
import { PortableTextRenderer } from "@/components/shared/PortableTextRenderer";
import type { PortableTextBlock } from "@portabletext/types";

interface JobPosting {
  _id: string;
  title: string;
  slug: { current: string };
  department: string;
  location: string;
  type: string;
  salary: string;
  shortDescription: string;
  description?: PortableTextBlock[] | string;
  requirements?: string[];
  benefits?: string[];
  publishedAt: string;
  closingDate?: string;
}

// Fallback data
const fallbackJobs: Record<string, JobPosting> = {
  "send-transport-driver": {
    _id: "1",
    title: "SEND Transport Driver",
    slug: { current: "send-transport-driver" },
    department: "Driving",
    location: "Birmingham",
    type: "Full-time",
    salary: "£25,000 - £28,000",
    shortDescription:
      "We're looking for caring and reliable drivers to transport children with special educational needs safely to school.",
    description: `AFJ Limited is seeking dedicated SEND Transport Drivers to join our Home-to-School transport team. In this rewarding role, you will be responsible for safely transporting children with special educational needs and disabilities to and from school.

You will be a patient, caring individual who understands the importance of providing a safe and comfortable environment for vulnerable children. You should have excellent communication skills and the ability to remain calm in challenging situations.`,
    requirements: [
      "Full UK driving licence (held for at least 2 years)",
      "Category D1 licence or willingness to obtain",
      "Enhanced DBS check (we can process this for you)",
      "Experience working with children or vulnerable groups",
      "Excellent communication skills",
      "Patient and compassionate nature",
      "Reliable and punctual",
      "Right to work in the UK",
    ],
    benefits: [
      "Competitive salary",
      "Company pension scheme",
      "28 days annual leave (including bank holidays)",
      "Full training provided (MiDAS, safeguarding, first aid)",
      "Term-time only working pattern available",
      "Uniform provided",
      "Employee assistance program",
      "Career progression opportunities",
    ],
    publishedAt: "2024-01-15",
    closingDate: "2024-02-15",
  },
  "patient-transport-driver": {
    _id: "2",
    title: "Patient Transport Driver",
    slug: { current: "patient-transport-driver" },
    department: "Driving",
    location: "Birmingham",
    type: "Full-time",
    salary: "£24,000 - £27,000",
    shortDescription:
      "Join our NEPTS team to provide compassionate transport services for patients attending medical appointments.",
    description: `We are looking for compassionate Patient Transport Drivers to join our Non-Emergency Patient Transport Service (NEPTS) team. You will provide essential transport services for patients attending hospital appointments and healthcare visits.

You will be a caring individual who can provide a calm and reassuring experience for patients. You should be physically fit, as the role involves assisting patients with mobility.`,
    requirements: [
      "Full UK driving licence",
      "Enhanced DBS check",
      "First aid qualification (or willingness to obtain)",
      "Experience in healthcare or patient care (desirable)",
      "Physically fit to assist with patient handling",
      "Excellent communication skills",
      "Compassionate and patient nature",
      "Flexible approach to shift patterns",
    ],
    benefits: [
      "Competitive salary",
      "NHS pension scheme",
      "Full training provided",
      "Overtime opportunities",
      "Uniform provided",
      "Career development",
      "Supportive team environment",
      "Making a difference to patients' lives",
    ],
    publishedAt: "2024-01-12",
    closingDate: "2024-02-12",
  },
};

export default function JobDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [job, setJob] = useState<JobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function fetchJob() {
      try {
        const fetchedJob = await client.fetch(jobPostingBySlugQuery, { slug });
        if (fetchedJob) {
          setJob(fetchedJob);
        } else if (fallbackJobs[slug]) {
          setJob(fallbackJobs[slug]);
        } else {
          setNotFoundState(true);
        }
      } catch (error) {
        console.error("Error fetching job:", error);
        if (fallbackJobs[slug]) {
          setJob(fallbackJobs[slug]);
        } else {
          setNotFoundState(true);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchJob();
  }, [slug]);

  if (notFoundState) {
    notFound();
  }

  if (isLoading || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Build apply email URL
  const emailSubject = encodeURIComponent(`Application for: ${job.title}`);
  const emailBody = encodeURIComponent(
    `Dear Hiring Manager,\n\nI am writing to apply for the ${job.title} position at AFJ Limited.\n\n[Please attach your CV and cover letter]\n\nThank you for your consideration.\n\nBest regards,`
  );
  const applyHref = `mailto:careers@afjltd.co.uk?subject=${emailSubject}&body=${emailBody}`;

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 bg-navy">
        <Container>
          <Link
            href="/careers"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Careers
          </Link>

          <Badge variant="secondary" className="mb-4">
            {job.department}
          </Badge>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-6 text-white/80">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              {job.location}
            </div>
            <div className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              {job.type}
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              {job.salary}
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Posted {formatDate(job.publishedAt)}
            </div>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-navy mb-6">
                  About the Role
                </h2>
                {typeof job.description === "string" ? (
                  <div className="prose prose-lg max-w-none">
                    {job.description.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="mb-4 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                ) : job.description ? (
                  <PortableTextRenderer
                    value={job.description}
                    className="prose prose-lg max-w-none"
                  />
                ) : (
                  <p className="text-muted-foreground">{job.shortDescription}</p>
                )}
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-navy mb-6">
                    Requirements
                  </h2>
                  <ul className="space-y-3">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green mr-3 mt-0.5 flex-shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-navy mb-6">
                    What We Offer
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green mr-3 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside>
              <Card className="border-0 shadow-lg sticky top-24">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    Apply for this Role
                  </h3>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Salary</span>
                      <span className="font-medium">{job.salary}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{job.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Job Type</span>
                      <span className="font-medium">{job.type}</span>
                    </div>
                    {job.closingDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Closing Date</span>
                        <span className="font-medium">
                          {formatDate(job.closingDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button asChild className="w-full mb-3" size="lg">
                    <a href={applyHref}>Apply Now</a>
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Or email your CV to{" "}
                    <a
                      href="mailto:careers@afjltd.co.uk"
                      className="text-green hover:underline"
                    >
                      careers@afjltd.co.uk
                    </a>
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
