import { defineType, defineField } from "sanity";
import { Quote } from "lucide-react";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  icon: Quote,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Role/Title",
      type: "string",
    }),
    defineField({
      name: "company",
      title: "Company/Organization",
      type: "string",
    }),
    defineField({
      name: "content",
      title: "Testimonial Content",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      options: {
        list: [1, 2, 3, 4, 5],
      },
      initialValue: 5,
    }),
    defineField({
      name: "image",
      title: "Photo",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
      description: "Show on homepage",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "company",
      media: "image",
    },
  },
});
