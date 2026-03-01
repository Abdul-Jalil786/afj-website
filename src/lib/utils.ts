/**
 * Shared utility functions used across the application.
 */

/**
 * Escape HTML special characters to prevent XSS in email templates and HTML output.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strip characters that could be used for email header injection.
 * Use on any user-supplied value placed into email subjects or headers.
 */
export function sanitiseForEmailHeader(str: string): string {
  return str.replace(/[\r\n]/g, ' ').trim();
}

/**
 * Basic email format validation.
 * Checks for user@domain.tld pattern — rejects obvious junk without being overly strict.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
}
