"use client";

import { useState, useEffect } from "react";
import { Share2, Linkedin, Twitter, Facebook, Link, Check } from "lucide-react";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url,
        });
      } catch {
        // User cancelled or share failed silently
      }
    }
  }

  const buttonClass =
    "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-2";

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-semibold text-navy mb-4">
        Share this article
      </h3>
      <div className="flex space-x-4">
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="h-5 w-5" />
        </a>
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          aria-label="Share on Twitter"
        >
          <Twitter className="h-5 w-5" />
        </a>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass}
          aria-label="Share on Facebook"
        >
          <Facebook className="h-5 w-5" />
        </a>
        <button
          onClick={handleCopyLink}
          className={buttonClass}
          aria-label={copied ? "Link copied" : "Copy link"}
        >
          {copied ? (
            <Check className="h-5 w-5" />
          ) : (
            <Link className="h-5 w-5" />
          )}
        </button>
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className={buttonClass}
            aria-label="Share via device sharing"
          >
            <Share2 className="h-5 w-5" />
          </button>
        )}
      </div>
      {copied && (
        <p className="text-sm text-green mt-2" role="status" aria-live="polite">
          Link copied to clipboard!
        </p>
      )}
    </div>
  );
}
