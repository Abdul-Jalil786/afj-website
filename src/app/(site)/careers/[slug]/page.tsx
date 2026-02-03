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

// Fallback data for all jobs
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
    description: `Are you passionate about making a real difference in children's lives? AFJ Limited is seeking dedicated SEND Transport Drivers to join our award-winning Home-to-School transport team in Birmingham.

As a SEND Transport Driver, you'll play a vital role in ensuring children with special educational needs and disabilities travel safely and comfortably to and from school each day. This isn't just a driving job – it's an opportunity to become a trusted part of these children's daily routines and support their educational journey.

**What You'll Do:**
• Safely transport children with SEND to and from their schools across Birmingham
• Conduct thorough daily vehicle safety checks before each journey
• Work collaboratively with our trained Passenger Assistants to ensure every child's welfare
• Follow individual travel plans tailored to each child's specific needs
• Maintain accurate journey logs and incident reports
• Build positive relationships with parents, schools, and our operations team
• Uphold strict confidentiality and safeguarding standards at all times

**Why This Role Matters:**
For many SEND children, the journey to school can be challenging. Your calm, patient approach will help them start and end each school day positively. You'll witness their growth and become someone they trust and look forward to seeing.

**What Makes You Right for This Role:**
You're naturally patient and compassionate. You understand that every child is unique and may need different approaches. You stay calm under pressure and can adapt quickly to changing situations. Most importantly, you genuinely care about making a positive impact.`,
    requirements: [
      "Full UK driving licence held for at least 2 years with no more than 3 points",
      "Category D1 licence (or willingness to obtain – we'll support your training)",
      "Enhanced DBS check (we'll process this for successful candidates)",
      "Previous experience working with children or vulnerable individuals preferred",
      "Strong communication skills and a friendly, approachable manner",
      "Patient, compassionate personality with genuine care for others",
      "Excellent punctuality and reliability – children depend on you",
      "Right to work in the UK",
    ],
    benefits: [
      "Competitive salary of £25,000 - £28,000 depending on experience",
      "Company pension scheme with employer contributions",
      "28 days annual leave including bank holidays",
      "Comprehensive training provided: MiDAS, safeguarding, first aid, and disability awareness",
      "Term-time only working pattern available – great for work-life balance",
      "Full uniform provided",
      "Employee Assistance Programme for wellbeing support",
      "Clear career progression pathways within AFJ Limited",
      "Supportive team environment with regular check-ins",
      "Modern, well-maintained fleet of vehicles",
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
    description: `Join our dedicated Non-Emergency Patient Transport Service (NEPTS) team and help patients across the West Midlands access vital healthcare appointments.

At AFJ Limited, we understand that getting to hospital appointments can be stressful for patients, especially those with mobility challenges or health conditions. As a Patient Transport Driver, you'll provide much more than just a ride – you'll offer reassurance, dignity, and compassionate care during what can be anxious times.

**Your Role:**
• Safely transport patients to and from hospitals, clinics, and healthcare facilities
• Assist patients with boarding, disembarking, and mobility where needed
• Operate tail lifts and secure wheelchairs according to safety protocols
• Provide calm, reassuring support throughout each journey
• Maintain accurate patient records and journey documentation
• Follow strict infection control and hygiene procedures
• Communicate effectively with hospital staff and our control room
• Handle sensitive situations with empathy and professionalism

**The Impact You'll Make:**
Many of our patients are elderly, recovering from treatment, or managing long-term conditions. Your friendly conversation and genuine care can transform their day. You'll often hear patients say that our drivers are the best part of their hospital visits.

**Who We're Looking For:**
You're someone who naturally puts others at ease. You're physically fit and happy to assist with patient handling. You understand that a kind word and a patient approach can make all the difference to someone feeling vulnerable.`,
    requirements: [
      "Full UK driving licence with a clean driving record",
      "Enhanced DBS clearance (we'll arrange this for you)",
      "First aid qualification or willingness to complete training",
      "Previous experience in healthcare, care work, or customer service is desirable",
      "Good physical fitness for assisting patients safely",
      "Excellent interpersonal skills and a caring nature",
      "Patience, empathy, and the ability to remain calm under pressure",
      "Flexibility to work varied shift patterns as healthcare needs demand",
    ],
    benefits: [
      "Competitive salary of £24,000 - £27,000",
      "NHS pension scheme eligibility",
      "Comprehensive training including patient handling and first aid",
      "Regular overtime opportunities available",
      "Full uniform and PPE provided",
      "Career development and promotion opportunities",
      "Supportive, friendly team atmosphere",
      "The satisfaction of making a real difference to patients' lives every day",
      "Employee recognition programmes",
      "Free parking at our Birmingham depot",
    ],
    publishedAt: "2024-01-12",
    closingDate: "2024-02-12",
  },
  "vehicle-technician": {
    _id: "3",
    title: "Vehicle Technician",
    slug: { current: "vehicle-technician" },
    department: "Maintenance",
    location: "Birmingham",
    type: "Full-time",
    salary: "£30,000 - £35,000",
    shortDescription:
      "Experienced vehicle technician needed to maintain and repair our fleet of passenger transport vehicles.",
    description: `Are you a skilled Vehicle Technician looking for a role where your work truly matters? At AFJ Limited, our fleet of minibuses and accessible vehicles transport vulnerable children and patients every day. Your expertise will keep them safe on the road.

Based at our well-equipped workshop at the AFJ Business Centre in Birmingham, you'll be responsible for maintaining our diverse fleet to the highest standards. We take pride in our vehicles – and we need a technician who shares that commitment to excellence.

**What You'll Be Doing:**
• Carrying out scheduled servicing, MOT preparation, and preventative maintenance
• Diagnosing and repairing mechanical, electrical, and electronic faults
• Maintaining and servicing specialist equipment including tail lifts, wheelchair tracking systems, and CCTV
• Conducting thorough vehicle inspections and safety checks
• Maintaining detailed service records and documentation
• Responding to roadside breakdowns when required
• Advising on vehicle condition and recommending necessary repairs
• Ensuring compliance with DVSA and O-licence requirements

**Our Fleet:**
You'll work on a variety of vehicles including Ford Transit minibuses, Mercedes Sprinters, Peugeot Boxers, and specialist wheelchair accessible vehicles. No two days are the same.

**Why AFJ Limited?**
We invest in our workshop facilities and our people. You'll have access to modern diagnostic equipment, manufacturer training opportunities, and a supportive team environment. We believe in doing things properly – cutting corners isn't in our vocabulary.`,
    requirements: [
      "NVQ Level 3 in Vehicle Maintenance or equivalent qualification",
      "Minimum 3 years' experience as a vehicle technician",
      "Experience with LCV/minibus maintenance is highly desirable",
      "Full UK driving licence",
      "Strong diagnostic and fault-finding abilities",
      "Knowledge of tail lift systems and accessibility equipment is a plus",
      "Ability to work independently and as part of a team",
      "Good attention to detail and commitment to quality",
    ],
    benefits: [
      "Competitive salary of £30,000 - £35,000 based on experience",
      "Monday to Friday working hours – enjoy your weekends",
      "Company pension scheme",
      "28 days annual leave",
      "Manufacturer training and development opportunities",
      "Tool allowance",
      "Uniform and PPE provided",
      "Free on-site parking",
      "Overtime available at enhanced rates",
      "Supportive workshop team environment",
    ],
    publishedAt: "2024-01-10",
    closingDate: "2024-02-10",
  },
  "transport-coordinator": {
    _id: "4",
    title: "Transport Coordinator",
    slug: { current: "transport-coordinator" },
    department: "Operations",
    location: "Birmingham",
    type: "Full-time",
    salary: "£26,000 - £30,000",
    shortDescription:
      "Coordinate daily transport operations, manage driver schedules, and ensure excellent service delivery.",
    description: `Do you thrive in fast-paced environments where organisation and people skills are key? AFJ Limited is looking for a Transport Coordinator to join our busy operations team in Birmingham.

As Transport Coordinator, you'll be at the heart of our daily operations, ensuring our fleet of vehicles and team of drivers deliver safe, punctual, and high-quality transport services. You'll be the link between our drivers, clients, schools, and healthcare providers – making sure everything runs smoothly.

**Your Responsibilities:**
• Plan and coordinate daily driver schedules and vehicle allocations
• Monitor live operations and respond quickly to any issues or delays
• Communicate with drivers throughout the day via radio and phone
• Handle client enquiries and resolve service issues professionally
• Liaise with schools, NHS trusts, and local authorities
• Ensure compliance with contractual requirements and KPIs
• Maintain accurate records using our transport management systems
• Support driver welfare and escalate concerns appropriately
• Assist with route planning and optimisation
• Cover for colleagues and support the wider operations team as needed

**What Makes a Great Transport Coordinator:**
You're naturally organised and can juggle multiple priorities without getting flustered. You communicate clearly and build positive relationships with everyone you work with. You're solutions-focused – when problems arise, you find ways to fix them quickly while keeping everyone informed.

**The Environment:**
Our operations centre is busy but supportive. You'll work alongside experienced colleagues who'll help you learn the ropes. Every day brings different challenges, and you'll go home knowing you've made a real difference.`,
    requirements: [
      "Previous experience in transport coordination, logistics, or scheduling",
      "Strong organisational skills and attention to detail",
      "Excellent communication skills – both written and verbal",
      "Ability to remain calm and make decisions under pressure",
      "Good IT skills including Microsoft Office",
      "Experience with transport management systems is desirable",
      "Understanding of driver hours regulations and compliance is a plus",
      "Positive, can-do attitude and team player mentality",
    ],
    benefits: [
      "Salary of £26,000 - £30,000 depending on experience",
      "Company pension scheme",
      "28 days annual leave",
      "Career progression opportunities – many of our managers started as coordinators",
      "Full training on our systems and processes",
      "Supportive team environment",
      "Free parking at our Birmingham office",
      "Employee Assistance Programme",
      "Regular team events and recognition",
      "Modern, comfortable office facilities",
    ],
    publishedAt: "2024-01-08",
    closingDate: "2024-02-08",
  },
  "passenger-assistant": {
    _id: "5",
    title: "Passenger Assistant",
    slug: { current: "passenger-assistant" },
    department: "Operations",
    location: "Birmingham",
    type: "Part-time",
    salary: "£12.50/hour",
    shortDescription:
      "Support passengers during their journey, ensuring their comfort, safety, and wellbeing at all times.",
    description: `Looking for a rewarding part-time role that fits around your life? As a Passenger Assistant with AFJ Limited, you'll support vulnerable children and adults during their journeys, making a real difference to their daily lives.

Passenger Assistants are essential members of our team. Working alongside our drivers, you'll ensure that every passenger – whether a child with special educational needs travelling to school or a patient attending a hospital appointment – feels safe, comfortable, and cared for throughout their journey.

**What You'll Do:**
• Escort passengers safely to and from vehicles, including at their homes and destinations
• Assist passengers with boarding, securing seatbelts, and wheelchair restraints
• Provide reassurance and support, especially to anxious or distressed passengers
• Monitor passenger welfare throughout the journey
• Communicate effectively with drivers, parents, teachers, and carers
• Report any concerns about passenger wellbeing following safeguarding procedures
• Maintain accurate journey records and incident reports
• Follow individual care plans for passengers with specific needs

**Typical Working Patterns:**
Most Passenger Assistant roles involve split shifts during school runs (approximately 7am-9:30am and 2:30pm-5pm on school days). This makes the role ideal if you need flexibility around childcare, studies, or other commitments.

**Who Should Apply:**
This role is perfect for caring individuals who want meaningful work. You might be a parent with school-age children, someone returning to work, a student, or a retiree looking to stay active and give back. What matters most is your caring nature and commitment to passenger safety.`,
    requirements: [
      "Genuine care for vulnerable children and adults",
      "Enhanced DBS check (we'll process this for successful candidates)",
      "Good communication skills and a friendly, patient manner",
      "Ability to remain calm in challenging situations",
      "Physical fitness to assist passengers safely",
      "Reliability and punctuality – passengers depend on you",
      "Willingness to complete training in safeguarding, first aid, and manual handling",
      "Right to work in the UK",
    ],
    benefits: [
      "Competitive hourly rate of £12.50",
      "Part-time hours that fit around your commitments",
      "Term-time only contracts available",
      "Full training provided at no cost to you",
      "Uniform provided",
      "Opportunity to make a genuine difference",
      "Supportive team environment",
      "Regular working patterns",
      "Potential to increase hours over time",
      "Company pension scheme",
    ],
    publishedAt: "2024-01-05",
    closingDate: "2024-02-05",
  },
  "training-instructor": {
    _id: "6",
    title: "Training Instructor",
    slug: { current: "training-instructor" },
    department: "Training",
    location: "Birmingham",
    type: "Full-time",
    salary: "£32,000 - £38,000",
    shortDescription:
      "Deliver MiDAS, PATS, and driver training courses to new and existing staff members.",
    description: `Are you an experienced driver trainer looking to join a company that truly values professional development? AFJ Limited is expanding our in-house training academy, and we're seeking a skilled Training Instructor to join our team.

As a Training Instructor, you'll play a crucial role in developing our workforce – ensuring every driver and passenger assistant has the skills, knowledge, and confidence to deliver safe, high-quality transport services. You'll deliver a range of nationally recognised qualifications and bespoke training programmes.

**Your Training Responsibilities:**
• Deliver MiDAS (Minibus Driver Awareness Scheme) training and assessments
• Conduct PATS (Passenger Assistant Training Scheme) courses
• Provide Category D1 licence training and test preparation
• Run safeguarding and disability awareness workshops
• Deliver first aid training (FAW/EFAW qualifications)
• Conduct driver CPC periodic training modules
• Assess driver competency and provide constructive feedback
• Develop and update training materials and resources
• Maintain accurate training records and certification documentation
• Support new starters through induction programmes
• Stay current with industry regulations and best practices

**About Our Training Academy:**
Based at our purpose-built facility in Birmingham, you'll have access to modern training rooms, a dedicated manoeuvring area, and our fleet of training vehicles. We're committed to delivering training that genuinely prepares people for the realities of the job.

**What We're Looking For:**
You're passionate about developing others and have the patience to work with learners at all levels. You can explain complex topics simply and create engaging learning experiences. You understand that good training saves lives.`,
    requirements: [
      "MiDAS registered trainer status (or willingness to obtain)",
      "Full Category D1 (ideally D) driving licence with clean record",
      "Previous experience in driver training or instruction",
      "Excellent presentation and communication skills",
      "Patience and ability to adapt teaching style to different learners",
      "Good IT skills for training administration and record-keeping",
      "First aid training qualification (or willingness to obtain)",
      "Understanding of transport industry regulations and compliance",
      "Assessor qualifications (e.g., CAVA) desirable",
    ],
    benefits: [
      "Competitive salary of £32,000 - £38,000 based on qualifications and experience",
      "Support to gain additional training qualifications",
      "Company pension scheme",
      "28 days annual leave plus bank holidays",
      "Monday to Friday working hours (occasional weekend training by arrangement)",
      "Company vehicle for business use",
      "Professional development opportunities",
      "Modern training facilities",
      "Supportive management team",
      "Opportunity to shape our growing training academy",
    ],
    publishedAt: "2024-01-03",
    closingDate: "2024-02-03",
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
                      <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
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
