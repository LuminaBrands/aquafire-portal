/* ──────────────────────────────────────────────────────────────────────────
   api/_guard.js — shared request guard for the Ember serverless functions.

   Underscore-prefixed, so Vercel treats it as a library file, not a route.

   Two jobs:

   1. cors(req, res)  — sets the CORS headers AND enforces the origin. The old
      per-function code only *set* Access-Control-Allow-Origin when the origin
      matched, which stops other websites' browsers but not `curl` — so
      /api/chat was an open, cost-bearing proxy to the Claude API. Requests
      with a missing or non-allowlisted Origin now get 403. An Origin header is
      trivially spoofable, so treat this as a speed bump, not a boundary: the
      rate limits below are what actually bound abuse.

   2. limit(...)      — rate limiting that survives cold starts. The previous
      in-memory Map reset on every new lambda instance and never spanned the
      several instances Vercel runs concurrently, so the effective ceiling was
      "12/min × however many instances exist". When UPSTASH_REDIS_REST_URL and
      UPSTASH_REDIS_REST_TOKEN are set, counters live in Redis and are shared
      across instances; without them we fall back to the old per-instance Map
      so nothing breaks before the store is provisioned.

   Zero dependencies on purpose (repo convention: no package.json / no build):
   Upstash is spoken to over its REST API with global fetch.
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

/* Aquafire's own front ends: the portal (aquafire.app), the storefront
   (aquafire.com), Vercel previews for this team, and the store's myshopify.com
   domains — the widget ships on all of them. */
const ALLOWED_ORIGIN =
  /^https:\/\/((www\.)?aquafire\.(app|com)|[a-z0-9-]+-luminabrands-projects\.vercel\.app|[a-z0-9-]+\.myshopify\.com)$/;

// Local dev origins are only honoured when explicitly enabled in the project env.
const DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function originAllowed(origin) {
  if (ALLOWED_ORIGIN.test(origin)) return true;
  return process.env.ALLOW_DEV_ORIGINS === '1' && DEV_ORIGIN.test(origin);
}

/* ── CORS + origin enforcement ───────────────────────────────────────────────
   Returns true when the caller should continue, false when the response has
   already been ended (preflight, bad method, or a rejected origin). */
function cors(req, res, methods) {
  const origin = req.headers.origin || '';
  const ok = originAllowed(origin);

  if (ok) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', (methods || 'POST') + ', OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Answer preflights before the origin check so browsers get a clean CORS
  // failure (and the widget's local fallback) instead of an opaque 403 body.
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }

  if (!ok) { res.status(403).json({ error: 'forbidden' }); return false; }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return false;
  }
  return true;
}

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] || 'unknown';
}

/* ── Per-instance fallback counter (previous behaviour) ─────────────────── */
const hits = new Map();

function localLimited(key, max, windowSec) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowSec * 1000);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}

/* ── Shared counter in Upstash Redis ─────────────────────────────────────────
   `SET key 0 EX <window> NX` then `INCR` in one pipeline: the SET creates the
   counter with its TTL attached only when it doesn't already exist, so every
   key is guaranteed to expire and the window is fixed rather than sliding.
   (Doing this as INCR + EXPIRE instead would risk a counter with no TTL at all
   if the EXPIRE leg failed — i.e. a bucket that blocks its callers forever.) */
async function redisCount(key, windowSec) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const r = await fetch(url.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + token
    },
    body: JSON.stringify([
      ['SET', key, '0', 'EX', String(windowSec), 'NX'],
      ['INCR', key]
    ]),
    signal: AbortSignal.timeout(2000)
  });
  if (!r.ok) throw new Error('upstash ' + r.status);
  const out = await r.json();
  if (!Array.isArray(out) || out.length < 2) throw new Error('upstash shape');
  // Any error in the pipeline means the count can't be trusted — fail over to
  // the local counter rather than letting a half-applied pipeline decide.
  if (out.some((o) => o && o.error)) throw new Error('upstash pipeline error');
  const n = Number(out[1] && out[1].result);
  return Number.isFinite(n) ? n : null;
}

/* ── limited(bucket, id, max, windowSec) ─────────────────────────────────────
   True when this caller has exceeded `max` requests per `windowSec`.
   Redis-backed when configured; per-instance otherwise. Fails open on Redis
   errors (falling back to the local counter) — a rate limiter outage must
   never take the customer-facing chat down with it. */
async function limited(bucket, id, max, windowSec) {
  const key = 'rl:' + bucket + ':' + windowSec + ':' + id;
  try {
    const n = await redisCount(key, windowSec);
    if (n !== null) return n > max;
  } catch (e) {
    // fall through to the in-memory counter
  }
  return localLimited(key, max, windowSec);
}

/* Convenience: per-IP limit plus an endpoint-wide daily ceiling, so a spoofed
   Origin plus rotating IPs still can't run up an unbounded Claude API bill.
   The global cap only applies when Redis is configured (a per-instance global
   counter would be meaningless). Returns null when fine, or a reason string. */
async function throttle(req, bucket, perIpPerMin, dailyCap) {
  if (await limited(bucket, clientIp(req), perIpPerMin, 60)) return 'ip';
  if (dailyCap && process.env.UPSTASH_REDIS_REST_URL) {
    if (await limited(bucket, 'all', dailyCap, 24 * 60 * 60)) return 'global';
  }
  return null;
}

module.exports = { cors, clientIp, limited, throttle, originAllowed };
