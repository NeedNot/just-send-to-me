import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

/**
 * Anonymous uploader identity.
 *
 * People who upload to a folder don't have accounts. The first time a
 * browser uploads, the server issues a random 256-bit token in an httpOnly
 * cookie. Every file that browser uploads is tagged with SHA-256(token)
 * (`files.uploader_id`), and the folder page / download route use that to
 * show the uploader their own files and nothing else.
 *
 * Why a cookie and not an ID the page keeps in localStorage:
 * - httpOnly: page scripts (and any XSS) can't read or exfiltrate it.
 * - The browser attaches it to plain navigations, so a per-file download can
 *   be an ordinary <a href> to the authorizing worker route, with no
 *   bearer token in the URL (history, logs, Referer).
 * - SameSite=Strict: never sent on cross-site requests.
 * - On HTTPS it uses the `__Host-` prefix: Secure, Path=/, no Domain, so a
 *   subdomain can't set or overwrite it.
 *
 * Only the hash is stored in D1, so a database leak doesn't hand out tokens
 * that would let someone impersonate uploaders.
 */

const COOKIE_NAME = 'jstm_uploader';
// Longer than the longest folder lifetime (7 days); refreshed on every
// upload session, so it outlives any folder the browser uploaded to.
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
// 32 random bytes, base64url without padding
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

type AnyContext = Context<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function isSecureRequest(c: AnyContext) {
  return new URL(c.req.url).protocol === 'https:';
}

function base64url(bytes: Uint8Array) {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function generateUploaderToken() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function uploaderIdFromToken(token: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );
  return base64url(new Uint8Array(digest));
}

/** The raw cookie name for a request (`__Host-` prefixed on HTTPS). */
export function uploaderCookieName(secure: boolean) {
  return secure ? `__Host-${COOKIE_NAME}` : COOKIE_NAME;
}

function readUploaderToken(c: AnyContext) {
  // Plain http is only local dev (localhost / LAN IP via `vite --host`),
  // where browsers may refuse Secure / __Host- cookies.
  const token = isSecureRequest(c)
    ? getCookie(c, COOKIE_NAME, 'host')
    : getCookie(c, COOKIE_NAME);
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

/** The current browser's uploader id, or null if it never uploaded. */
export async function getUploaderId(c: AnyContext) {
  const token = readUploaderToken(c);
  return token ? uploaderIdFromToken(token) : null;
}

/**
 * Returns this browser's uploader id, issuing a token first if it has none.
 * Always re-sets the cookie so its lifetime is extended.
 */
export async function ensureUploaderId(c: AnyContext) {
  const token = readUploaderToken(c) ?? generateUploaderToken();
  const secure = isSecureRequest(c);
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
    ...(secure ? { secure: true, prefix: 'host' as const } : {}),
  });
  return uploaderIdFromToken(token);
}
