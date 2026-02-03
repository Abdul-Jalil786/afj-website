import { defineType, defineField } from "sanity";
import { Home } from "lucide-react";

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  icon: Home,
  fields: [
    defineField({
      name: "heroSlides",
      title: "Hero Carousel Slides",
      type: "array",
      of: [{ type: "heroSlide" }],
      validation: (Rule) => Rule.min(1).max(5),
    }),
    defineField({
      name: "aboutSection",
      title: "About Section",
      type: "object",
      fields: [
        defineField({
          name: "title",
          title: "Title",
          type: "string",
        }),
        defineField({
          name: "content",
          title: "Content",
          type: "array",
          of: [{ type: "block" }],
        }),
        defineField({
          name: "image",
          title: "Image",
          type: "image",
          options: {
            hotspot: true,
          },
        }),
        defineField({
          name: "cta",
          title: "Call to Action",
          type: "object",
          fields: [
            defineField({
              name: "text",
              title: "Button Text",
              type: "string",
            }),
            defineField({
              name: "href",
              title: "Link URL",
              type: "string",
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: "stats",
      title: "Statistics",
      type: "array",
      of: [{ type: "stat" }],
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: "featuredServices",
      title: "Featured Services",
      type: "array",
      of: [{ type: "reference", to: [{ type: "service" }] }],
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Homepage",
      };
    },
  },
});
