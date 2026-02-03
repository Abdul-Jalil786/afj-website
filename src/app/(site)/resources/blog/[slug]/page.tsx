import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft, Facebook, Twitter, Linkedin } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  publishedAt: string;
  category: string;
  author: {
    name: string;
    bio?: string;
    image?: string;
  };
}

const blogPosts: Record<string, BlogPost> = {
  "importance-of-midas-training": {
    id: "1",
    title: "The Importance of MiDAS Training for Minibus Drivers",
    slug: "importance-of-midas-training",
    excerpt:
      "Discover why MiDAS certification is essential for minibus drivers and how it ensures passenger safety across the UK.",
    content: `
      <p>MiDAS (Minibus Driver Awareness Scheme) is the nationally recognized standard for minibus driver assessment and training in the UK. At AFJ Limited, we believe that proper training is essential for ensuring the safety of all passengers.</p>

      <h2>What is MiDAS?</h2>
      <p>MiDAS is a scheme designed to enhance minibus driving standards and promote the safe operation of minibuses. It was developed by the Community Transport Association (CTA) and is widely recognized across the UK as the benchmark for minibus driver competence.</p>

      <h2>Why is MiDAS Training Important?</h2>
      <p>The training covers essential aspects of minibus driving, including:</p>
      <ul>
        <li>Vehicle safety checks and maintenance awareness</li>
        <li>Passenger assistance and care</li>
        <li>Emergency procedures</li>
        <li>Legal responsibilities</li>
        <li>Safe driving techniques specific to minibuses</li>
      </ul>

      <h2>Benefits for Organizations</h2>
      <p>Organizations that invest in MiDAS training for their drivers demonstrate a commitment to safety and professionalism. This can lead to:</p>
      <ul>
        <li>Reduced insurance premiums</li>
        <li>Enhanced reputation</li>
        <li>Compliance with regulations</li>
        <li>Improved passenger confidence</li>
      </ul>

      <h2>Our Training Services</h2>
      <p>AFJ Limited is an accredited MiDAS training center. We offer comprehensive courses for both new and experienced drivers, ensuring they have the knowledge and skills to operate minibuses safely.</p>

      <p>Contact us today to learn more about our MiDAS training programs and how we can help your organization meet its driver training needs.</p>
    `,
    image: "/images/blog/midas-training.jpg",
    publishedAt: "2024-01-15",
    category: "Training",
    author: {
      name: "John Smith",
      bio: "Training Manager at AFJ Limited with over 15 years of experience in driver training and assessment.",
    },
  },
};

const relatedPosts = [
  {
    id: "2",
    title: "New Wheelchair Accessible Vehicle Regulations 2024",
    slug: "wheelchair-accessible-vehicle-regulations-2024",
    image: "/images/blog/wav-regulations.jpg",
    publishedAt: "2024-01-10",
  },
  {
    id: "3",
    title: "How We're Reducing Our Carbon Footprint",
    slug: "reducing-carbon-footprint",
    image: "/images/blog/sustainability.jpg",
    publishedAt: "2024-01-05",
  },
];

export function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts[slug];

  if (!post) {
    notFound();
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 bg-navy">
        <div className="absolute inset-0 opacity-30">
          <Image
            src={post.image}
            alt={post.title}
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

          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 max-w-4xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-white/80">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              <span>{post.author.name}</span>
            </div>
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
              <article
                className="prose prose-lg max-w-none prose-headings:text-navy prose-a:text-green"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Share */}
              <div className="mt-12 pt-8 border-t">
                <h3 className="text-lg font-semibold text-navy mb-4">
                  Share this article
                </h3>
                <div className="flex space-x-4">
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green hover:text-white transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green hover:text-white transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green hover:text-white transition-colors"
                    aria-label="Share on LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              {/* Author */}
              <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-navy mb-4">
                  About the Author
                </h3>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center font-semibold mr-4">
                    {post.author.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="font-medium text-navy">{post.author.name}</div>
                    <div className="text-sm text-muted-foreground">Author</div>
                  </div>
                </div>
                {post.author.bio && (
                  <p className="text-sm text-muted-foreground">{post.author.bio}</p>
                )}
              </div>

              {/* Related Posts */}
              <div>
                <h3 className="text-lg font-semibold text-navy mb-4">
                  Related Articles
                </h3>
                <div className="space-y-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      href={`/resources/blog/${relatedPost.slug}`}
                      className="group block"
                    >
                      <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex">
                          <div className="relative w-24 h-24 flex-shrink-0">
                            <Image
                              src={relatedPost.image}
                              alt={relatedPost.title}
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
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
