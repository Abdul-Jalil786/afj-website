"use client";

import { useState, useEffect, useMemo } from "react";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { client, blogPostsQuery, categoriesQuery, urlFor } from "@/lib/sanity";

interface SanityImage {
  asset: {
    _ref: string;
  };
  alt?: string;
}

interface Category {
  _id: string;
  title: string;
  slug: { current: string };
}

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  mainImage?: SanityImage;
  publishedAt: string;
  category?: Category;
  author?: {
    name: string;
    image?: SanityImage;
  };
}

// Fallback data when Sanity is not configured
const fallbackPosts: BlogPost[] = [
  {
    _id: "1",
    title: "The Importance of MiDAS Training for Minibus Drivers",
    slug: { current: "importance-of-midas-training" },
    excerpt:
      "Discover why MiDAS certification is essential for minibus drivers and how it ensures passenger safety across the UK.",
    publishedAt: "2024-01-15",
    category: { _id: "1", title: "Training", slug: { current: "training" } },
    author: { name: "John Smith" },
  },
  {
    _id: "2",
    title: "New Wheelchair Accessible Vehicle Regulations 2024",
    slug: { current: "wheelchair-accessible-vehicle-regulations-2024" },
    excerpt:
      "An overview of the latest regulations affecting wheelchair accessible vehicles and what operators need to know.",
    publishedAt: "2024-01-10",
    category: { _id: "2", title: "Industry News", slug: { current: "industry-news" } },
    author: { name: "Sarah Johnson" },
  },
  {
    _id: "3",
    title: "How We're Reducing Our Carbon Footprint",
    slug: { current: "reducing-carbon-footprint" },
    excerpt:
      "Learn about AFJ Limited's commitment to sustainability and our initiatives to reduce environmental impact.",
    publishedAt: "2024-01-05",
    category: { _id: "3", title: "Company News", slug: { current: "company-news" } },
    author: { name: "Michael Roberts" },
  },
  {
    _id: "4",
    title: "Tips for Parents: Preparing Your Child for School Transport",
    slug: { current: "preparing-child-school-transport" },
    excerpt:
      "Helpful advice for parents on how to prepare children with special needs for their first school transport journey.",
    publishedAt: "2023-12-20",
    category: { _id: "4", title: "Guides", slug: { current: "guides" } },
    author: { name: "Emma Williams" },
  },
  {
    _id: "5",
    title: "Fleet Maintenance Best Practices for Winter",
    slug: { current: "fleet-maintenance-winter" },
    excerpt:
      "Essential maintenance tips to keep your fleet running smoothly during the cold winter months.",
    publishedAt: "2023-12-15",
    category: { _id: "5", title: "Maintenance", slug: { current: "maintenance" } },
    author: { name: "David Thompson" },
  },
  {
    _id: "6",
    title: "Understanding Non-Emergency Patient Transport Eligibility",
    slug: { current: "nepts-eligibility-guide" },
    excerpt:
      "A comprehensive guide to understanding who qualifies for NHS non-emergency patient transport services.",
    publishedAt: "2023-12-10",
    category: { _id: "4", title: "Guides", slug: { current: "guides" } },
    author: { name: "Sarah Johnson" },
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(fallbackPosts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [fetchedPosts, fetchedCategories] = await Promise.all([
          client.fetch(blogPostsQuery),
          client.fetch(categoriesQuery),
        ]);

        if (fetchedPosts && fetchedPosts.length > 0) {
          setPosts(fetchedPosts);
        }
        if (fetchedCategories && fetchedCategories.length > 0) {
          setCategories(fetchedCategories);
        }
      } catch (error) {
        console.error("Error fetching blog data:", error);
        // Keep fallback data
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get unique category names for filter
  const categoryNames = useMemo(() => {
    const names = new Set<string>();
    posts.forEach((post) => {
      if (post.category?.title) {
        names.add(post.category.title);
      }
    });
    return ["All", ...Array.from(names)];
  }, [posts]);

  // Filter posts by category
  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") return posts;
    return posts.filter((post) => post.category?.title === selectedCategory);
  }, [posts, selectedCategory]);

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  const getImageUrl = (image?: SanityImage) => {
    if (!image?.asset) return "/images/blog/placeholder.jpg";
    return urlFor(image).width(800).height(600).auto("format").url();
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-20 bg-navy">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Blog & Resources
            </h1>
            <p className="text-xl text-white/80">
              Stay informed with the latest news, insights, and updates from the
              transportation industry.
            </p>
          </div>
        </Container>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b">
        <Container>
          <div className="flex flex-wrap gap-2">
            {categoryNames.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === selectedCategory
                    ? "bg-green text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12">
          <Container>
            <Link href={`/resources/blog/${featuredPost.slug.current}`} className="group">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="relative h-[300px] lg:h-[400px] rounded-2xl overflow-hidden">
                  <Image
                    src={getImageUrl(featuredPost.mainImage)}
                    alt={featuredPost.mainImage?.alt || featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Badge className="absolute top-4 left-4">Featured</Badge>
                </div>
                <div>
                  {featuredPost.category && (
                    <Badge variant="outline" className="mb-4">
                      {featuredPost.category.title}
                    </Badge>
                  )}
                  <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4 group-hover:text-green transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center text-sm text-muted-foreground">
                    {featuredPost.author && (
                      <>
                        <User className="h-4 w-4 mr-2" />
                        <span>{featuredPost.author.name}</span>
                        <span className="mx-3">•</span>
                      </>
                    )}
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(featuredPost.publishedAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          </Container>
        </section>
      )}

      {/* Blog Grid */}
      <section className="py-12 bg-gray-50">
        <Container>
          <h2 className="text-2xl font-bold text-navy mb-8">
            {selectedCategory === "All" ? "Latest Articles" : `${selectedCategory} Articles`}
          </h2>

          {otherPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No articles found in this category.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/resources/blog/${post.slug.current}`}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-48">
                      <Image
                        src={getImageUrl(post.mainImage)}
                        alt={post.mainImage?.alt || post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <CardContent className="p-6">
                      {post.category && (
                        <Badge variant="outline" className="mb-3">
                          {post.category.title}
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold text-navy mb-2 group-hover:text-green transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
