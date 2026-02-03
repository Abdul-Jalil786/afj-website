import { defineType, defineField } from "sanity";

export const ctaBlock = defineType({
  name: "ctaBlock",
  title: "Call to Action Block",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "buttonText",
      title: "Button Text",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "buttonLink",
      title: "Button Link",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "style",
      title: "Style",
      type: "string",
      options: {
        list: [
          { title: "Primary (Green)", value: "primary" },
          { title: "Secondary (Navy)", value: "secondary" },
          { title: "Outline", value: "outline" },
        ],
      },
      initialValue: "primary",
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "buttonText",
    },
  },
});
