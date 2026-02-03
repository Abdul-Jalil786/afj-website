"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Briefcase, Clock, ArrowRight, Search, Smartphone, Download } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CTASection } from "@/components/sections";
import { client, jobPostingsQuery } from "@/lib/sanity";

interface JobPosting {
  _id: string;
  title: string;
  slug: { current: string };
  department: string;
  location: string;
  type: string;
  salary: string;
  shortDescription: string;
  publishedAt: string;
}

// SEO-optimized fallback job data
const fallbackJobs: JobPosting[] = [
  {
    _id: "1",
    title: "SEND Transport Driver",
    slug: { current: "send-transport-driver" },
    department: "Driving",
    location: "Birmingham",
    type: "Full-time",
    salary: "£25,000 - £28,000",
    shortDescription:
      "Join our team of dedicated drivers transporting children with special educational needs safely to school. Full training provided including MiDAS certification. Make a real difference to vulnerable children's lives every day.",
    publishedAt: "2024-01-15",
  },
  {
    _id: "2",
    title: "Patient Transport Driver",
    slug: { current: "patient-transport-driver" },
    department: "Driving",
    location: "Birmingham",
    type: "Full-time",
    salary: "£24,000 - £27,000",
    shortDescription:
      "Provide compassionate Non-Emergency Patient Transport (NEPTS) services across the West Midlands. Help patients access vital healthcare appointments with dignity and care. NHS pension scheme available.",
    publishedAt: "2024-01-12",
  },
  {
    _id: "3",
    title: "Vehicle Technician",
    slug: { current: "vehicle-technician" },
    department: "Maintenance",
    location: "Birmingham",
    type: "Full-time",
    salary: "£30,000 - £35,000",
    shortDescription:
      "Experienced vehicle technician needed for our modern Birmingham workshop. Maintain our fleet of minibuses and wheelchair accessible vehicles. Monday-Friday hours, manufacturer training opportunities.",
    publishedAt: "2024-01-10",
  },
  {
    _id: "4",
    title: "Transport Coordinator",
    slug: { current: "transport-coordinator" },
    department: "Operations",
    location: "Birmingham",
    type: "Full-time",
    salary: "£26,000 - £30,000",
    shortDescription:
      "Coordinate daily transport operations from our Birmingham control room. Manage driver schedules, handle client communications, and ensure service excellence. Great career progression opportunities.",
    publishedAt: "2024-01-08",
  },
  {
    _id: "5",
    title: "Passenger Assistant",
    slug: { current: "passenger-assistant" },
    department: "Operations",
    location: "Birmingham",
    type: "Part-time",
    salary: "£12.50/hour",
    shortDescription:
      "Rewarding part-time role supporting vulnerable passengers during their journeys. Perfect for those seeking flexible, term-time hours. Full training in safeguarding and first aid provided.",
    publishedAt: "2024-01-05",
  },
  {
    _id: "6",
    title: "Training Instructor",
    slug: { current: "training-instructor" },
    department: "Training",
    location: "Birmingham",
    type: "Full-time",
    salary: "£32,000 - £38,000",
    shortDescription:
      "Deliver MiDAS, PATS, and driver training at our Birmingham training academy. Shape the next generation of transport professionals. Support to gain additional qualifications.",
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
  "Full training and development",
  "Career progression opportunities",
  "Employee assistance programme",
  "Uniform provided",
  "Supportive team environment",
  "Modern fleet and facilities",
  "Free on-site parking",
];

export default function CareersPage() {
  const [jobs, setJobs] = useState<JobPosting[]>(fallbackJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const fetchedJobs = await client.fetch(jobPostingsQuery);
        if (fetchedJobs && fetchedJobs.length > 0) {
          setJobs(fetchedJobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        // Keep fallback data
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // Filter jobs by search and department
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !job.title.toLowerCase().includes(query) &&
          !job.shortDescription.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // Department filter
      if (selectedDepartment !== "All Departments") {
        if (job.department !== selectedDepartment) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, searchQuery, selectedDepartment]);

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Careers at AFJ Limited
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Join Birmingham's trusted transport provider. We're always looking for
              caring, dedicated individuals to join our growing team.
            </p>
            <p className="text-white/70">
              Whether you're an experienced driver, a skilled technician, or looking to start
              a rewarding new career, we have opportunities that could be perfect for you.
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
                placeholder="Search jobs by title or keyword..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    dept === selectedDepartment
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
                {filteredJobs.length} position{filteredJobs.length !== 1 ? "s" : ""} available
              </p>

              {filteredJobs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No jobs match your search criteria.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("");
                    setSelectedDepartment("All Departments");
                  }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <Link key={job._id} href={`/careers/${job.slug.current}`} className="group block">
                    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                          <h2 className="text-xl font-semibold text-navy group-hover:text-green transition-colors">
                            {job.title}
                          </h2>
                          <Badge variant="outline">{job.department}</Badge>
                        </div>

                        <p className="text-muted-foreground mb-4 line-clamp-2">
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
                ))
              )}
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

              {/* Download App Section */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-navy to-navy/90 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Smartphone className="h-8 w-8 text-green mr-3" />
                    <h3 className="text-lg font-semibold">
                      Download Our App
                    </h3>
                  </div>
                  <p className="text-white/80 text-sm mb-4">
                    Get the AFJ Limited app for easy access to job listings, application tracking,
                    and company updates. Available for iOS and Android devices.
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        {/* QR Code Placeholder - Replace with actual QR code image */}
                        <div className="text-center">
                          <Download className="h-8 w-8 mx-auto text-navy mb-2" />
                          <span className="text-xs text-gray-500">Scan QR Code</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-white/70 text-xs text-center">
                    Scan the QR code with your phone camera to download
                  </p>
                  <div className="flex gap-2 mt-4">
                    <a
                      href="#"
                      className="flex-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg py-2 px-3 text-center text-sm"
                    >
                      App Store
                    </a>
                    <a
                      href="#"
                      className="flex-1 bg-white/10 hover:bg-white/20 transition-colors rounded-lg py-2 px-3 text-center text-sm"
                    >
                      Google Play
                    </a>
                  </div>
                </CardContent>
              </Card>

              {/* Spontaneous Application */}
              <Card className="border-0 shadow-md bg-green/5">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-navy mb-2">
                    Don't See Your Perfect Role?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We're always interested in hearing from talented, passionate individuals.
                    Send us your CV and we'll keep you in mind for future opportunities.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <a href="mailto:careers@afjltd.co.uk">
                      Send Your CV
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    Recruitment Contact
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Have questions about careers at AFJ Limited? Our friendly recruitment team is here to help.
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      <a href="mailto:careers@afjltd.co.uk" className="text-green hover:underline">
                        careers@afjltd.co.uk
                      </a>
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      <a href="tel:+441216891000" className="text-green hover:underline">
                        0121 689 1000
                      </a>
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      Mon-Fri: 6am-7pm | Sat: 9am-1pm
                    </p>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </Container>
      </section>

      {/* Why Join AFJ Section */}
      <section className="py-16 bg-gray-50">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-navy mb-4">
              Why Choose a Career with AFJ Limited?
            </h2>
            <p className="text-muted-foreground">
              Since 2006, we've been providing essential transport services across Birmingham
              and the West Midlands. Our team is the heart of everything we do.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green">150+</span>
              </div>
              <h3 className="font-semibold text-navy mb-2">Team Members</h3>
              <p className="text-sm text-muted-foreground">
                Join our growing family of dedicated professionals committed to excellent service.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green">18+</span>
              </div>
              <h3 className="font-semibold text-navy mb-2">Years Experience</h3>
              <p className="text-sm text-muted-foreground">
                Benefit from our established reputation and proven track record in the industry.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green">100+</span>
              </div>
              <h3 className="font-semibold text-navy mb-2">Vehicles</h3>
              <p className="text-sm text-muted-foreground">
                Work with a modern, well-maintained fleet equipped with the latest safety features.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <CTASection
        title="Ready to Start Your Journey?"
        description="Join a team that makes a real difference every day. Whether you're transporting children to school or patients to appointments, your work matters."
        primaryCta={{ text: "View All Positions", href: "#" }}
        secondaryCta={{ text: "Contact Recruitment", href: "mailto:careers@afjltd.co.uk" }}
      />
    </>
  );
}
