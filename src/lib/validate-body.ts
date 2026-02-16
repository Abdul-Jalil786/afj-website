/**
 * Request body size validation middleware helper.
 *
 * Enforces maximum request body sizes to prevent abuse.
 * Default: 50KB. Allow up to 200KB for endpoints that handle large content.
 */

const DEFAULT_MAX_BYTES = 50 * 1024;        // 50 KB
const LARGE_MAX_BYTES = 200 * 1024;         // 200 KB

/**
 * Validate that a request body does not exceed the specified size limit.
 * Returns null if valid, or a 413 Response if exceeded.
 *
 * @param request - The incoming HTTP request
 * @param maxBytes - Maximum allowed body size in bytes (default 50KB)
 */
export async function validateBodySize(
  request: Request,
  maxBytes: number = DEFAULT_MAX_BYTES,
): Promise<Response | null> {
  // Check Content-Length header first (fast path)
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (!isNaN(length) && length > maxBytes) {
      return new Response(
        JSON.stringify({
          error: `Request body too large. Maximum size is ${Math.round(maxBytes / 1024)}KB.`,
        }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  return null;
}

export { DEFAULT_MAX_BYTES, LARGE_MAX_BYTES };
