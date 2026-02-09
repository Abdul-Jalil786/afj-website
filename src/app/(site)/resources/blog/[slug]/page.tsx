import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { client, blogPostBySlugQuery, blogPostsQuery, urlFor } from "@/lib/sanity";
import { PortableTextRenderer } from "@/components/shared/PortableTextRenderer";
import { SocialShare } from "@/components/shared/SocialShare";
import type { PortableTextBlock } from "@portabletext/types";

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

interface Author {
  name: string;
  bio?: string;
  image?: SanityImage;
}

interface RelatedPost {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage?: SanityImage;
  publishedAt: string;
}

interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  content?: PortableTextBlock[];
  mainImage?: SanityImage;
  publishedAt: string;
  category?: Category;
  author?: Author;
  relatedPosts?: RelatedPost[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

// Fallback blog post for when Sanity isn't configured
const fallbackPost: BlogPost = {
  _id: "1",
  title: "The Importance of MiDAS Training for Minibus Drivers",
  slug: { current: "importance-of-midas-training" },
  excerpt:
    "Discover why MiDAS certification is essential for minibus drivers and how it ensures passenger safety across the UK.",
  publishedAt: "2024-01-15",
  category: { _id: "1", title: "Training", slug: { current: "training" } },
  author: {
    name: "John Smith",
    bio: "Training Manager at AFJ Limited with over 15 years of experience in driver training and assessment.",
  },
};

const fallbackRelatedPosts: RelatedPost[] = [
  {
    _id: "2",
    title: "New Wheelchair Accessible Vehicle Regulations 2024",
    slug: { current: "wheelchair-accessible-vehicle-regulations-2024" },
    publishedAt: "2024-01-10",
  },
  {
    _id: "3",
    title: "How We're Reducing Our Carbon Footprint",
    slug: { current: "reducing-carbon-footprint" },
    publishedAt: "2024-01-05",
  },
];

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const post = await client.fetch(blogPostBySlugQuery, { slug });
    return post || null;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    // Return fallback for known slugs
    if (slug === "importance-of-midas-training") {
      return { ...fallbackPost, relatedPosts: fallbackRelatedPosts };
    }
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const posts = await client.fetch(blogPostsQuery);
    return posts?.map((post: { slug: { current: string } }) => ({
      slug: post.slug.current,
    })) || [{ slug: "importance-of-midas-training" }];
  } catch {
    return [{ slug: "importance-of-midas-training" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.seo?.metaTitle || post.title,
    description: post.seo?.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      images: post.mainImage?.asset
        ? [urlFor(post.mainImage).width(1200).height(630).url()]
        : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const getImageUrl = (image?: SanityImage, width = 800, height = 600) => {
    if (!image?.asset) return "/images/blog/placeholder.jpg";
    return urlFor(image).width(width).height(height).auto("format").url();
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://afjltd.co.uk";
  const postUrl = `${baseUrl}/resources/blog/${post.slug.current}`;

  const relatedPosts = post.relatedPosts || fallbackRelatedPosts;

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-navy">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={getImageUrl(post.mainImage, 1920, 1080)}
            alt={post.mainImage?.alt || post.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/90 to-navy/70" />
        <Container className="relative z-10">
          <Link
            href="/resources/blog"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>

          {post.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category.title}
            </Badge>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-4xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-white/80">
            {post.author && (
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                <span>{post.author.name}</span>
              </div>
            )}
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
          </div>
        </Container>
      </section>

      {/* Content */}
      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {post.content ? (
                <PortableTextRenderer
                  value={post.content}
                  className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-green"
                />
              ) : (
                <div className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-green">
                  <p>{post.excerpt}</p>
                  <p className="text-muted-foreground italic">
                    Full article content coming soon. Check back later for the complete post.
                  </p>
                </div>
              )}

              {/* Share */}
              <SocialShare
                url={postUrl}
                title={post.title}
                description={post.excerpt}
              />
            </div>

            {/* Sidebar */}
            <aside>
              {/* Author */}
              {post.author && (
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    About the Author
                  </h3>
                  <div className="flex items-center mb-4">
                    {post.author.image?.asset ? (
                      <Image
                        src={urlFor(post.author.image).width(96).height(96).url()}
                        alt={`${post.author.name}, author`}
                        width={48}
                        height={48}
                        className="rounded-full mr-4"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-semibold mr-4">
                        {post.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-navy">{post.author.name}</div>
                      <div className="text-sm text-muted-foreground">Author</div>
                    </div>
                  </div>
                  {post.author.bio && (
                    <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                  )}
                </div>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-navy mb-4">
                    Related Articles
                  </h3>
                  <div className="space-y-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link
                        key={relatedPost._id}
                        href={`/resources/blog/${relatedPost.slug.current}`}
                        className="group block"
                      >
                        <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                          <div className="flex">
                            <div className="relative w-24 h-24 flex-shrink-0">
                              <Image
                                src={getImageUrl(relatedPost.mainImage, 200, 200)}
                                alt={relatedPost.mainImage?.alt || relatedPost.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <CardContent className="p-3">
                              <h4 className="text-sm font-medium text-navy group-hover:text-green transition-colors line-clamp-2">
                                {relatedPost.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(relatedPost.publishedAt)}
                              </p>
                            </CardContent>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
