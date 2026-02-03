import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2024-01-01";

// Check if Sanity is properly configured
export const isSanityConfigured = Boolean(
  projectId && projectId !== "your-project-id"
);

// Create client only if configured, otherwise create a dummy that will fail gracefully
export const client = createClient({
  projectId: projectId || "not-configured",
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});

export const previewClient = createClient({
  projectId: projectId || "not-configured",
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export function getClient(preview = false) {
  return preview ? previewClient : client;
}
