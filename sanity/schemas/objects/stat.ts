import { defineType, defineField } from "sanity";

export const stat = defineType({
  name: "stat",
  title: "Statistic",
  type: "object",
  fields: [
    defineField({
      name: "number",
      title: "Number",
      type: "number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "suffix",
      title: "Suffix",
      type: "string",
      description: "e.g., '+', '%', 'K'",
    }),
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      number: "number",
      suffix: "suffix",
      label: "label",
    },
    prepare({ number, suffix, label }) {
      return {
        title: `${number}${suffix || ""} - ${label}`,
      };
    },
  },
});
