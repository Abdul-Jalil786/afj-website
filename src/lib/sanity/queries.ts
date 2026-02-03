import { groq } from "next-sanity";

// Site Settings
export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    siteName,
    logo,
    logoDark,
    phone,
    email,
    address,
    socialLinks,
    footerText
  }
`;

// Homepage
export const homepageQuery = groq`
  *[_type == "homepage"][0] {
    heroSlides[] {
      headline,
      subheadline,
      image,
      cta {
        text,
        href
      },
      secondaryCta {
        text,
        href
      }
    },
    aboutSection {
      title,
      content,
      image,
      cta {
        text,
        href
      }
    },
    stats[] {
      number,
      label,
      suffix
    },
    "featuredServices": featuredServices[]-> {
      _id,
      title,
      slug,
      shortDescription,
      icon
    },
    seo
  }
`;

// Services
export const servicesQuery = groq`
  *[_type == "service"] | order(order asc) {
    _id,
    title,
    slug,
    shortDescription,
    icon,
    image
  }
`;

export const serviceBySlugQuery = groq`
  *[_type == "service" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    shortDescription,
    content,
    features[] {
      title,
      description,
      icon
    },
    image,
    gallery[] {
      asset,
      alt,
      caption
    },
    accreditations[]-> {
      _id,
      name,
      logo
    },
    seo
  }
`;

// Blog
export const blogPostsQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage,
    publishedAt,
    "category": category-> {
      _id,
      title,
      slug
    },
    "author": author-> {
      name,
      image
    }
  }
`;

export const blogPostBySlugQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    content,
    mainImage,
    publishedAt,
    "category": category-> {
      _id,
      title,
      slug
    },
    "author": author-> {
      name,
      image,
      bio
    },
    "relatedPosts": *[_type == "blogPost" && slug.current != $slug && category._ref == ^.category._ref][0...3] {
      _id,
      title,
      slug,
      mainImage,
      publishedAt
    },
    seo
  }
`;

export const categoriesQuery = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description
  }
`;

// Careers
export const jobPostingsQuery = groq`
  *[_type == "jobPosting" && isActive == true] | order(publishedAt desc) {
    _id,
    title,
    slug,
    department,
    location,
    type,
    salary,
    shortDescription,
    publishedAt
  }
`;

export const jobPostingBySlugQuery = groq`
  *[_type == "jobPosting" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    department,
    location,
    type,
    salary,
    shortDescription,
    description,
    requirements,
    benefits,
    publishedAt,
    closingDate,
    seo
  }
`;

// Vehicles
export const vehiclesQuery = groq`
  *[_type == "vehicle" && status != "sold"] | order(_createdAt desc) {
    _id,
    title,
    slug,
    price,
    year,
    mileage,
    fuelType,
    transmission,
    seats,
    mainImage,
    status,
    featured
  }
`;

export const vehicleBySlugQuery = groq`
  *[_type == "vehicle" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    price,
    year,
    mileage,
    fuelType,
    transmission,
    seats,
    color,
    registration,
    description,
    features,
    mainImage,
    gallery[] {
      asset,
      alt
    },
    status,
    seo
  }
`;

// Testimonials
export const testimonialsQuery = groq`
  *[_type == "testimonial" && featured == true] | order(_createdAt desc) {
    _id,
    name,
    role,
    company,
    content,
    rating,
    image
  }
`;

// Partners
export const partnersQuery = groq`
  *[_type == "partner"] | order(order asc) {
    _id,
    name,
    logo,
    url
  }
`;

// Team Members
export const teamMembersQuery = groq`
  *[_type == "teamMember"] | order(order asc) {
    _id,
    name,
    role,
    bio,
    image,
    socialLinks
  }
`;
