#!/usr/bin/env python3
"""
Facebook Page Publisher for AFJ Limited

Reads a blog post markdown file, generates a Facebook-ready post
using the Anthropic API, and publishes it to the AFJ Facebook Page
via the Graph API.

Usage:
    python facebook-publish.py --post "path/to/post.md"
    python facebook-publish.py --post "path/to/post.md" --dry-run

Environment variables required:
    FACEBOOK_PAGE_ID        Facebook Page ID
    FACEBOOK_ACCESS_TOKEN   Page access token (with pages_manage_posts permission)
    LLM_API_KEY             Anthropic API key (for generating social copy)

Optional:
    LLM_MODEL               Model to use (default: claude-haiku-4-5-20251001)
    SITE_URL                Base URL (default: https://www.afjltd.co.uk)
"""

import argparse
import json
import logging
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib import request as urllib_request
from urllib.error import HTTPError, URLError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

SITE_URL = os.environ.get("SITE_URL", "https://www.afjltd.co.uk")


def read_blog_post(filepath: str) -> dict:
    """Parse a blog markdown file and extract frontmatter + body."""
    path = Path(filepath)
    if not path.exists():
        logger.error(f"File not found: {filepath}")
        sys.exit(1)

    content = path.read_text(encoding="utf-8")

    # Extract frontmatter
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if not fm_match:
        logger.error("Could not parse frontmatter from markdown file.")
        sys.exit(1)

    fm_text = fm_match.group(1)
    body = fm_match.group(2).strip()

    # Parse frontmatter fields
    title = _extract_fm(fm_text, "title") or path.stem
    description = _extract_fm(fm_text, "description") or ""
    slug = path.stem
    tags = _extract_fm_list(fm_text, "tags")

    return {
        "title": title,
        "description": description,
        "slug": slug,
        "tags": tags,
        "body": body[:2000],  # Truncate for LLM context
        "url": f"{SITE_URL}/blog/{slug}",
    }


def _extract_fm(text: str, key: str) -> str:
    """Extract a single frontmatter value."""
    match = re.search(rf'^{key}:\s*["\']?(.*?)["\']?\s*$', text, re.MULTILINE)
    return match.group(1) if match else ""


def _extract_fm_list(text: str, key: str) -> list:
    """Extract a frontmatter list value."""
    match = re.search(rf"^{key}:\s*\[(.*?)\]", text, re.MULTILINE)
    if match:
        items = match.group(1).replace('"', "").replace("'", "").split(",")
        return [i.strip() for i in items if i.strip()]
    return []


def generate_facebook_post(post_data: dict) -> str:
    """Use the Anthropic API to generate a Facebook post."""
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        logger.warning("LLM_API_KEY not set — using fallback template.")
        return _fallback_post(post_data)

    model = os.environ.get("LLM_MODEL", "claude-haiku-4-5-20251001")

    system_prompt = """You are a social media manager for AFJ Limited, a Birmingham-based transport company.
Write a Facebook post to promote a new blog article. Rules:
- Professional but approachable tone
- 2-3 short paragraphs maximum (total 150-250 words)
- Include 2-3 relevant emojis (transport, safety, community themed)
- End with a call to action to read the full article
- Do NOT include the URL — it will be added automatically
- Use British English spelling
- Mention "AFJ Limited" or "AFJ" at least once
- Include 3-5 relevant hashtags at the end (e.g. #SENDTransport #Birmingham)
- NEVER use: "In today's fast-paced world", "It goes without saying", "At the end of the day"
"""

    user_message = f"""Blog title: {post_data['title']}
Description: {post_data['description']}
Tags: {', '.join(post_data['tags'])}

First 500 words of the article:
{post_data['body'][:500]}

Generate a Facebook post to promote this article."""

    payload = json.dumps({
        "model": model,
        "max_tokens": 512,
        "system": system_prompt,
        "messages": [{"role": "user", "content": user_message}],
    }).encode("utf-8")

    req = urllib_request.Request(
        "https://api.anthropic.com/v1/messages",
        data=payload,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text_block = next(
                (b for b in data.get("content", []) if b.get("type") == "text"),
                None,
            )
            if text_block:
                logger.info("AI-generated Facebook post created successfully.")
                return text_block["text"]
    except (HTTPError, URLError) as e:
        logger.warning(f"Anthropic API error: {e}. Using fallback template.")

    return _fallback_post(post_data)


def _fallback_post(post_data: dict) -> str:
    """Simple template when AI is unavailable."""
    return (
        f"New on the AFJ blog: {post_data['title']}\n\n"
        f"{post_data['description']}\n\n"
        f"Read the full article on our website.\n\n"
        f"#AFJLimited #Birmingham #Transport"
    )


def publish_to_facebook(message: str, link: str, dry_run: bool = False) -> bool:
    """Publish a post to the Facebook Page via Graph API."""
    page_id = os.environ.get("FACEBOOK_PAGE_ID")
    access_token = os.environ.get("FACEBOOK_ACCESS_TOKEN")

    if not page_id or not access_token:
        logger.error(
            "FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN must be set."
        )
        return False

    full_message = f"{message}\n\nRead more: {link}"

    if dry_run:
        logger.info("=== DRY RUN — Would publish: ===")
        logger.info(full_message)
        logger.info(f"Link: {link}")
        return True

    payload = json.dumps({
        "message": full_message,
        "link": link,
        "access_token": access_token,
    }).encode("utf-8")

    url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
    req = urllib_request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib_request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            post_id = result.get("id", "unknown")
            logger.info(f"Published to Facebook. Post ID: {post_id}")
            return True
    except HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else str(e)
        logger.error(f"Facebook API error ({e.code}): {error_body}")
        return False
    except URLError as e:
        logger.error(f"Network error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Publish a blog post to the AFJ Facebook Page."
    )
    parser.add_argument(
        "--post",
        required=True,
        help="Path to the blog post markdown file",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview the post without publishing",
    )
    args = parser.parse_args()

    logger.info(f"Reading blog post: {args.post}")
    post_data = read_blog_post(args.post)

    logger.info(f"Title: {post_data['title']}")
    logger.info(f"URL: {post_data['url']}")

    logger.info("Generating Facebook post...")
    fb_post = generate_facebook_post(post_data)

    logger.info("Publishing to Facebook...")
    success = publish_to_facebook(fb_post, post_data["url"], dry_run=args.dry_run)

    if success:
        logger.info("Done.")
    else:
        logger.error("Failed to publish. Check credentials and try again.")
        sys.exit(1)


if __name__ == "__main__":
    main()
