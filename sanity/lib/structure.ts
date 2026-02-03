import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // Settings Group
      S.listItem()
        .title("Settings")
        .child(
          S.list()
            .title("Settings")
            .items([
              S.listItem()
                .title("Site Settings")
                .child(
                  S.document()
                    .schemaType("siteSettings")
                    .documentId("siteSettings")
                ),
              S.listItem()
                .title("Homepage")
                .child(
                  S.document().schemaType("homepage").documentId("homepage")
                ),
            ])
        ),
      S.divider(),

      // Content Types
      S.listItem()
        .title("Services")
        .schemaType("service")
        .child(S.documentTypeList("service").title("Services")),

      S.listItem()
        .title("Blog Posts")
        .schemaType("blogPost")
        .child(S.documentTypeList("blogPost").title("Blog Posts")),

      S.listItem()
        .title("Job Postings")
        .schemaType("jobPosting")
        .child(S.documentTypeList("jobPosting").title("Job Postings")),

      S.listItem()
        .title("Vehicles")
        .schemaType("vehicle")
        .child(S.documentTypeList("vehicle").title("Vehicles")),

      S.divider(),

      // Supporting Content
      S.listItem()
        .title("Testimonials")
        .schemaType("testimonial")
        .child(S.documentTypeList("testimonial").title("Testimonials")),

      S.listItem()
        .title("Partners")
        .schemaType("partner")
        .child(S.documentTypeList("partner").title("Partners")),

      S.listItem()
        .title("Team Members")
        .schemaType("teamMember")
        .child(S.documentTypeList("teamMember").title("Team Members")),

      S.listItem()
        .title("Categories")
        .schemaType("category")
        .child(S.documentTypeList("category").title("Categories")),
    ]);
