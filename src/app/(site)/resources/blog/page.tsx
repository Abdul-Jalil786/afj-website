import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Stay up to date with the latest news, insights, and updates from AFJ Limited. Read our articles on transportation, safety, and industry trends.",
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  publishedAt: string;
  category: string;
  author: {
    name: string;
    image?: string;
  };
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Importance of MiDAS Training for Minibus Drivers",
    slug: "importance-of-midas-training",
    excerpt:
      "Discover why MiDAS certification is essential for minibus drivers and how it ensures passenger safety across the UK.",
    image: "/images/blog/midas-training.jpg",
    publishedAt: "2024-01-15",
    category: "Training",
    author: { name: "John Smith" },
  },
  {
    id: "2",
    title: "New Wheelchair Accessible Vehicle Regulations 2024",
    slug: "wheelchair-accessible-vehicle-regulations-2024",
    excerpt:
      "An overview of the latest regulations affecting wheelchair accessible vehicles and what operators need to know.",
    image: "/images/blog/wav-regulations.jpg",
    publishedAt: "2024-01-10",
    category: "Industry News",
    author: { name: "Sarah Johnson" },
  },
  {
    id: "3",
    title: "How We're Reducing Our Carbon Footprint",
    slug: "reducing-carbon-footprint",
    excerpt:
      "Learn about AFJ Limited's commitment to sustainability and our initiatives to reduce environmental impact.",
    image: "/images/blog/sustainability.jpg",
    publishedAt: "2024-01-05",
    category: "Company News",
    author: { name: "Michael Roberts" },
  },
  {
    id: "4",
    title: "Tips for Parents: Preparing Your Child for School Transport",
    slug: "preparing-child-school-transport",
    excerpt:
      "Helpful advice for parents on how to prepare children with special needs for their first school transport journey.",
    image: "/images/blog/school-transport.jpg",
    publishedAt: "2023-12-20",
    category: "Guides",
    author: { name: "Emma Williams" },
  },
  {
    id: "5",
    title: "Fleet Maintenance Best Practices for Winter",
    slug: "fleet-maintenance-winter",
    excerpt:
      "Essential maintenance tips to keep your fleet running smoothly during the cold winter months.",
    image: "/images/blog/winter-maintenance.jpg",
    publishedAt: "2023-12-15",
    category: "Maintenance",
    author: { name: "David Thompson" },
  },
  {
    id: "6",
    title: "Understanding Non-Emergency Patient Transport Eligibility",
    slug: "nepts-eligibility-guide",
    excerpt:
      "A comprehensive guide to understanding who qualifies for NHS non-emergency patient transport services.",
    image: "/images/blog/nepts-guide.jpg",
    publishedAt: "2023-12-10",
    category: "Guides",
    author: { name: "Sarah Johnson" },
  },
];

const categories = [
  "All",
  "Company News",
  "Industry News",
  "Guides",
  "Training",
  "Maintenance",
];

export default function BlogPage() {
  const featuredPost = blogPosts[0];
  const otherPosts = blogPosts.slice(1);

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
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === "All"
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
      <section className="py-12">
        <Container>
          <Link href={`/resources/blog/${featuredPost.slug}`} className="group">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative h-[300px] lg:h-[400px] rounded-2xl overflow-hidden">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute top-4 left-4">Featured</Badge>
              </div>
              <div>
                <Badge variant="outline" className="mb-4">
                  {featuredPost.category}
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4 group-hover:text-green transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2" />
                  <span>{featuredPost.author.name}</span>
                  <span className="mx-3">•</span>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(featuredPost.publishedAt)}</span>
                </div>
              </div>
            </div>
          </Link>
        </Container>
      </section>

      {/* Blog Grid */}
      <section className="py-12 bg-gray-50">
        <Container>
          <h2 className="text-2xl font-bold text-navy mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <Link
                key={post.id}
                href={`/resources/blog/${post.slug}`}
                className="group"
              >
                <Card className="h-full border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3">
                      {post.category}
                    </Badge>
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

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="inline-flex items-center text-green font-medium hover:underline">
              Load More Articles
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </Container>
      </section>
    </>
  );
}
