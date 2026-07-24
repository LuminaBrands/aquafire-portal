/* ──────────────────────────────────────────────────────────────────────────
   /api/order-status — Shopify order & tracking lookup for the Ember widget.

   The widget POSTs { order, email }; we look the order up with the Shopify
   Admin GraphQL API and return a minimal, customer-safe summary (status,
   items, tracking links). The customer must supply BOTH the order number and
   the email used at checkout — an order-number match alone returns nothing,
   so sequential order numbers can't be enumerated.

   Setup: create a Dev Dashboard app ("Ember AI Chat") with the read_orders
   scope (add read_all_orders for orders older than 60 days), release it and
   install it on the store, then copy the app's Client ID and Client secret
   (app → Settings) into the Vercel project's environment variables as
   SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET. Dev Dashboard apps don't
   expose a static admin token — this function exchanges the credentials for
   a short-lived access token itself (OAuth client-credentials grant, ~24 h)
   and renews it automatically. A legacy static token (from an old-style
   admin custom app) is also accepted as SHOPIFY_ORDERS_TOKEN. Until one of
   those is configured this returns 503 and the widget falls back to the
   email-the-orders-team answer.

   Zero dependencies on purpose (repo convention): global fetch only.
   ────────────────────────────────────────────────────────────────────────── */

'use strict';

const SHOP = 'tryaquafire.myshopify.com';
const API_VERSION = '2026-01';

/* ── Access token: static (legacy custom app) or client-credentials grant ── */
let tokenCache = { token: null, at: 0 };

async function getToken(force) {
  if (process.env.SHOPIFY_ORDERS_TOKEN) return process.env.SHOPIFY_ORDERS_TOKEN;
  const id = process.env.SHOPIFY_CLIENT_ID, secret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  // tokens last 24 h — reuse for 23, refresh early on a 401
  if (!force && tokenCache.token && Date.now() - tokenCache.at < 23 * 60 * 60 * 1000) {
    return tokenCache.token;
  }
  const r = await fetch('https://' + SHOP + '/admin/oauth/access_token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials&client_id=' + encodeURIComponent(id) +
      '&client_secret=' + encodeURIComponent(secret),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error('token ' + r.status);
  const d = await r.json();
  if (!d.access_token) throw new Error('no token in response');
  tokenCache = { token: d.access_token, at: Date.now() };
  return d.access_token;
}

const ALLOWED_ORIGIN =
  /^https:\/\/((www\.)?aquafire\.(app|com)|[a-z0-9-]+-luminabrands-projects\.vercel\.app)$/;

const QUERY = `query OrderLookup($q: String!) {
  orders(first: 5, query: $q) {
    nodes {
      name
      email
      createdAt
      cancelledAt
      displayFinancialStatus
      displayFulfillmentStatus
      lineItems(first: 10) { nodes { title quantity } }
      fulfillments(first: 10) {
        displayStatus
        deliveredAt
        estimatedDeliveryAt
        trackingInfo(first: 10) { company number url }
      }
      shippingAddress { city provinceCode }
    }
  }
}`;

/* ── Best-effort per-instance rate limit (stricter than /api/chat — these
      are account lookups, not chat) ─────────────────────────────────────── */
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > 6;
}

/* ── Handler ────────────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGIN.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  if (!process.env.SHOPIFY_ORDERS_TOKEN &&
      !(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET)) {
    return res.status(503).json({
      error: 'order lookup not configured — set SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (or a legacy SHOPIFY_ORDERS_TOKEN) in the Vercel project settings'
    });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'slow down' });

  const body = req.body || {};
  // Order number: digits with an optional letter prefix ("#1049", "AF1049").
  const rawOrder = typeof body.order === 'string' ? body.order.trim().replace(/^#/, '') : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!/^[a-zA-Z]{0,6}-?\d{1,10}$/.test(rawOrder) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'bad request' });
  }

  // Default Shopify order names carry a # prefix; keep any letter prefix as-is.
  const name = (/^\d/.test(rawOrder) ? '#' : '') + rawOrder;

  let token;
  try {
    token = await getToken(false);
  } catch (e) {
    // credential exchange failed (bad secret / app not installed on the store)
    return res.status(503).json({ error: 'order lookup auth unavailable' });
  }

  const callAdmin = (t) => fetch(
    'https://' + SHOP + '/admin/api/' + API_VERSION + '/graphql.json',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Shopify-Access-Token': t
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { q: 'name:"' + name + '" AND email:"' + email + '"' }
      }),
      signal: AbortSignal.timeout(10000)
    }
  );

  let upstream;
  try {
    upstream = await callAdmin(token);
    if (upstream.status === 401 && !process.env.SHOPIFY_ORDERS_TOKEN) {
      // cached client-credentials token expired early — refresh once
      try {
        token = await getToken(true);
      } catch (e) {
        return res.status(503).json({ error: 'order lookup auth unavailable' });
      }
      upstream = await callAdmin(token);
    }
  } catch (e) {
    return res.status(502).json({ error: 'upstream unreachable' });
  }
  if (!upstream.ok) return res.status(502).json({ error: 'upstream ' + upstream.status });

  const data = await upstream.json();
  if (data.errors) return res.status(502).json({ error: 'upstream error' });

  // Belt and braces: re-verify name AND email on the result — the search
  // filter alone is not the access check.
  const match = (((data.data || {}).orders || {}).nodes || []).find((o) =>
    o.name.replace(/^#/, '').toLowerCase() === rawOrder.toLowerCase() &&
    (o.email || '').toLowerCase() === email
  );
  if (!match) return res.status(404).json({ error: 'not_found' });

  const shipments = (match.fulfillments || []).map((f) => ({
    status: f.displayStatus || null,
    deliveredAt: f.deliveredAt || null,
    eta: f.estimatedDeliveryAt || null,
    tracking: (f.trackingInfo || [])
      .filter((t) => t.number || t.url)
      .map((t) => ({ company: t.company || null, number: t.number || null, url: t.url || null }))
  }));

  return res.status(200).json({
    order: {
      name: match.name,
      placedAt: match.createdAt,
      cancelled: !!match.cancelledAt,
      status: match.displayFulfillmentStatus,
      payment: match.displayFinancialStatus,
      items: ((match.lineItems || {}).nodes || []).map((li) => ({
        title: li.title,
        qty: li.quantity
      })),
      shipTo: match.shippingAddress
        ? [match.shippingAddress.city, match.shippingAddress.provinceCode].filter(Boolean).join(', ')
        : null,
      shipments
    }
  });
};
