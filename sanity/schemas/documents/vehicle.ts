import { defineType, defineField } from "sanity";
import { Car } from "lucide-react";

export const vehicle = defineType({
  name: "vehicle",
  title: "Vehicle",
  type: "document",
  icon: Car,
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g., '2022 Ford Transit Custom'",
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
      name: "price",
      title: "Price",
      type: "number",
      description: "Price in GBP",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      validation: (Rule) => Rule.required().min(1990).max(2030),
    }),
    defineField({
      name: "mileage",
      title: "Mileage",
      type: "number",
      description: "Mileage in miles",
    }),
    defineField({
      name: "fuelType",
      title: "Fuel Type",
      type: "string",
      options: {
        list: [
          { title: "Diesel", value: "diesel" },
          { title: "Petrol", value: "petrol" },
          { title: "Electric", value: "electric" },
          { title: "Hybrid", value: "hybrid" },
        ],
      },
    }),
    defineField({
      name: "transmission",
      title: "Transmission",
      type: "string",
      options: {
        list: [
          { title: "Manual", value: "manual" },
          { title: "Automatic", value: "automatic" },
        ],
      },
    }),
    defineField({
      name: "seats",
      title: "Number of Seats",
      type: "number",
    }),
    defineField({
      name: "color",
      title: "Color",
      type: "string",
    }),
    defineField({
      name: "registration",
      title: "Registration",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "features",
      title: "Features",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "mainImage",
      title: "Main Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: "alt",
          title: "Alt Text",
          type: "string",
        },
      ],
    }),
    defineField({
      name: "gallery",
      title: "Gallery",
      type: "array",
      of: [{ type: "imageWithAlt" }],
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Available", value: "available" },
          { title: "Reserved", value: "reserved" },
          { title: "Sold", value: "sold" },
        ],
      },
      initialValue: "available",
    }),
    defineField({
      name: "featured",
      title: "Featured Vehicle",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  orderings: [
    {
      title: "Price, Low to High",
      name: "priceAsc",
      by: [{ field: "price", direction: "asc" }],
    },
    {
      title: "Price, High to Low",
      name: "priceDesc",
      by: [{ field: "price", direction: "desc" }],
    },
    {
      title: "Year, Newest",
      name: "yearDesc",
      by: [{ field: "year", direction: "desc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      price: "price",
      status: "status",
      media: "mainImage",
    },
    prepare({ title, price, status, media }) {
      return {
        title,
        subtitle: `£${price?.toLocaleString()} • ${status || "available"}`,
        media,
      };
    },
  },
});
