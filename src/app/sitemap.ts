import { MetadataRoute } from "next";
import { groq } from "next-sanity";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afjltd.co.uk";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/services/home-to-school`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services/nepts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services/private-hire`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services/fleet-maintenance`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services/vehicle-conversions`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/services/training`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vehicles-for-sale`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/careers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/book-now`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookie-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Fetch dynamic content from Sanity only if configured
  let blogPosts: Array<{ slug: string; publishedAt: string }> = [];
  let vehicles: Array<{ slug: string; _updatedAt: string }> = [];
  let jobPostings: Array<{ slug: string; publishedAt: string }> = [];

  const sanityProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

  if (sanityProjectId && sanityProjectId !== "your-project-id") {
    try {
      // Dynamically import client only when Sanity is configured
      const { client } = await import("@/lib/sanity/client");
      [blogPosts, vehicles, jobPostings] = await Promise.all([
        client.fetch(groq`*[_type == "blogPost"]{ "slug": slug.current, publishedAt }`),
        client.fetch(groq`*[_type == "vehicle" && status != "sold"]{ "slug": slug.current, _updatedAt }`),
        client.fetch(groq`*[_type == "jobPosting" && isActive == true]{ "slug": slug.current, publishedAt }`),
      ]);
    } catch (error) {
      console.error("Error fetching Sanity content for sitemap:", error);
    }
  }

  // Blog post pages
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/resources/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Vehicle pages
  const vehiclePages: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: `${baseUrl}/vehicles-for-sale/${vehicle.slug}`,
    lastModified: vehicle._updatedAt ? new Date(vehicle._updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Job posting pages
  const jobPages: MetadataRoute.Sitemap = jobPostings.map((job) => ({
    url: `${baseUrl}/careers/${job.slug}`,
    lastModified: job.publishedAt ? new Date(job.publishedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...vehiclePages, ...jobPages];
}
