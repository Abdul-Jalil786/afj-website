import type { PortableTextBlock } from "@portabletext/types";
import type { Image } from "sanity";

export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export interface Slug {
  _type: "slug";
  current: string;
}

export interface SEO {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: Image;
}

export interface ImageWithAlt {
  asset: Image;
  alt: string;
  caption?: string;
}

export interface HeroSlide {
  headline: string;
  subheadline?: string;
  image: Image;
  cta?: {
    text: string;
    href: string;
  };
  secondaryCta?: {
    text: string;
    href: string;
  };
}

export interface Stat {
  number: number;
  suffix?: string;
  label: string;
}

export interface Feature {
  title: string;
  description?: string;
  icon?: string;
}

export interface Service extends SanityDocument {
  title: string;
  slug: Slug;
  shortDescription: string;
  icon?: string;
  image?: Image;
  content?: PortableTextBlock[];
  features?: Feature[];
  gallery?: ImageWithAlt[];
  accreditations?: Partner[];
  order?: number;
  seo?: SEO;
}

export interface BlogPost extends SanityDocument {
  title: string;
  slug: Slug;
  excerpt: string;
  mainImage?: Image & { alt?: string };
  content?: PortableTextBlock[];
  author?: TeamMember;
  category?: Category;
  publishedAt: string;
  featured?: boolean;
  relatedPosts?: BlogPost[];
  seo?: SEO;
}

export interface Category extends SanityDocument {
  title: string;
  slug: Slug;
  description?: string;
}

export interface Vehicle extends SanityDocument {
  title: string;
  slug: Slug;
  price: number;
  year: number;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  seats?: number;
  color?: string;
  registration?: string;
  description?: PortableTextBlock[];
  features?: string[];
  mainImage?: Image & { alt?: string };
  gallery?: ImageWithAlt[];
  status?: "available" | "reserved" | "sold";
  featured?: boolean;
  seo?: SEO;
}

export interface JobPosting extends SanityDocument {
  title: string;
  slug: Slug;
  department?: string;
  location?: string;
  type?: string;
  salary?: string;
  shortDescription: string;
  description?: PortableTextBlock[];
  requirements?: string[];
  benefits?: string[];
  publishedAt: string;
  closingDate?: string;
  isActive?: boolean;
  seo?: SEO;
}

export interface Testimonial extends SanityDocument {
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating?: number;
  image?: Image;
  featured?: boolean;
}

export interface Partner extends SanityDocument {
  name: string;
  logo: Image;
  url?: string;
  description?: string;
  order?: number;
}

export interface TeamMember extends SanityDocument {
  name: string;
  role: string;
  bio?: string;
  image?: Image;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    email?: string;
  };
  order?: number;
}

export interface SiteSettings extends SanityDocument {
  siteName: string;
  logo?: Image;
  logoDark?: Image;
  phone?: string;
  email?: string;
  address?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  footerText?: string;
}

export interface Homepage extends SanityDocument {
  heroSlides?: HeroSlide[];
  aboutSection?: {
    title?: string;
    content?: PortableTextBlock[];
    image?: Image;
    cta?: {
      text: string;
      href: string;
    };
  };
  stats?: Stat[];
  featuredServices?: Service[];
  seo?: SEO;
}
