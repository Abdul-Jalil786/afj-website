import Image from "next/image";
import { urlFor } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SanityImageSource = any;

interface SanityImageProps {
  image: SanityImageSource;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  quality?: number;
}

export function SanityImage({
  image,
  alt,
  width,
  height,
  fill,
  sizes,
  priority = false,
  className,
  quality = 80,
}: SanityImageProps) {
  if (!image) {
    return null;
  }

  const imageUrl = urlFor(image)
    .auto("format")
    .quality(quality)
    .url();

  if (fill) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width || 800}
      height={height || 600}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
