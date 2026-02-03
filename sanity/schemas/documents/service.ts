import { defineType, defineField } from "sanity";
import { Truck } from "lucide-react";

export const service = defineType({
  name: "service",
  title: "Service",
  type: "document",
  icon: Truck,
  fields: [
    defineField({
      name: "title",
      title: "Title",
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
      name: "shortDescription",
      title: "Short Description",
      type: "text",
      rows: 2,
      description: "Brief description for service cards",
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: "icon",
      title: "Icon Name",
      type: "string",
      description:
        "Lucide icon name (e.g., 'bus', 'car', 'wrench', 'graduation-cap')",
    }),
    defineField({
      name: "image",
      title: "Featured Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "content",
      title: "Full Content",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alt Text",
              type: "string",
            },
            {
              name: "caption",
              title: "Caption",
              type: "string",
            },
          ],
        },
      ],
    }),
    defineField({
      name: "features",
      title: "Key Features",
      type: "array",
      of: [{ type: "feature" }],
    }),
    defineField({
      name: "gallery",
      title: "Image Gallery",
      type: "array",
      of: [{ type: "imageWithAlt" }],
    }),
    defineField({
      name: "accreditations",
      title: "Relevant Accreditations",
      type: "array",
      of: [{ type: "reference", to: [{ type: "partner" }] }],
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "shortDescription",
      media: "image",
    },
  },
});
