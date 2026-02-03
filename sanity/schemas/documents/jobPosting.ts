import { defineType, defineField } from "sanity";
import { Briefcase } from "lucide-react";

export const jobPosting = defineType({
  name: "jobPosting",
  title: "Job Posting",
  type: "document",
  icon: Briefcase,
  fields: [
    defineField({
      name: "title",
      title: "Job Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "department",
      title: "Department",
      type: "string",
      options: {
        list: [
          { title: "Operations", value: "operations" },
          { title: "Driving", value: "driving" },
          { title: "Maintenance", value: "maintenance" },
          { title: "Administration", value: "administration" },
          { title: "Management", value: "management" },
          { title: "Training", value: "training" },
        ],
      },
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
    }),
    defineField({
      name: "type",
      title: "Employment Type",
      type: "string",
      options: {
        list: [
          { title: "Full-time", value: "full-time" },
          { title: "Part-time", value: "part-time" },
          { title: "Contract", value: "contract" },
          { title: "Temporary", value: "temporary" },
        ],
      },
    }),
    defineField({
      name: "salary",
      title: "Salary",
      type: "string",
      description: "e.g., '£25,000 - £30,000' or 'Competitive'",
    }),
    defineField({
      name: "shortDescription",
      title: "Short Description",
      type: "text",
      rows: 2,
      description: "Brief summary for job listings",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "description",
      title: "Full Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "requirements",
      title: "Requirements",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "benefits",
      title: "Benefits",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "closingDate",
      title: "Closing Date",
      type: "date",
    }),
    defineField({
      name: "isActive",
      title: "Is Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    {
      title: "Published Date, New",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      department: "department",
      type: "type",
      isActive: "isActive",
    },
    prepare({ title, department, type, isActive }) {
      return {
        title,
        subtitle: `${department || ""} • ${type || ""} ${isActive ? "" : "(Inactive)"}`,
      };
    },
  },
});
