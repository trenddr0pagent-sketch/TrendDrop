// Vercel Serverless — /api/shop-import
// Connects to Shopify API to import products + create checkout links
// Token read from Vercel env var SHOPIFY_TOKEN (set in dashboard)

const https = require('https');
const fs = require('fs');
const path = require('path');

const domain = process.env.SHOPIFY_STORE || 'mc6zk6-z1';
const auth = process.env.SHOPIFY_TOKEN;

function shop(method, url, body) {
  return new Promise((ok, no) => {
    const opts = {
      hostname: domain + '.myshopify.com',
      path: '/admin/api/2024-10/' + url,
      method: method || 'GET',
      headers: { 'X-Shopify-Access-Token': auth, 'Content-Type': 'application/json' }
    };
    const r = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { ok({ s: res.statusCode, b: JSON.parse(d) }); } catch { ok({ s: res.statusCode, b: d }); } });
    });
    r.on('error', no);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

const ITEMS = [
  ['Unbrush Detangling Hair Brush', 3.99, 'hair-brush-a', 'https://images.unsplash.com/photo-1616683699404-fb2e48cb4a28?w=600'],
  ['GuruNanda Cocomint Pulling Oil', 14.99, 'coconut-oil', 'https://images.unsplash.com/photo-1613336026275-b6d4735c5f5f?w=600'],
  ['TIRTIR Mask Fit Red Cushion', 27.99, 'cushion', 'https://images.unsplash.com/photo-1599733589046-10c7f0f8f7e0?w=600'],
  ['Owala FreeSip Water Bottle', 28.99, 'water-bottle', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'],
  ['Govee RGBIC LED Strip Lights', 12.99, 'led-strip', 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600'],
  ['Automatic Electric Jar Opener', 21.99, 'jar-opener', 'https://images.unsplash.com/photo-1594226801341-41427b4e5c1b?w=600'],
  ['Sunset Lamp Projector', 5.99, 'sunset-lamp', 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600'],
  ['Foldable Walking Pad', 397.99, 'walking-pad', 'https://images.unsplash.com/photo-1626447269094-f86522e36d31?w=600'],
  ['Portable Neck Fan', 12.99, 'neck-fan', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600'],
  ['Weighted Stuffed Animal', 32.99, 'plush', 'https://images.unsplash.com/photo-1559715541-5d5e35b5f52b?w=600'],
  ['Sleep Headphones Bluetooth Headband', 24.99, 'headband', 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600'],
  ['Electric Spin Scrubber', 57.99, 'scrubber', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
  ['Heatless Silk Hair Curler', 10.99, 'curler', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'],
  ['Multi-functional Vegetable Chopper', 31.99, 'chopper', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
  ['Slim Motion Sensor Trash Can', 57.99, 'trash-can', 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600'],
  ['Reusable Magnetic Water Balloons', 22.99, 'balloons', 'https://images.unsplash.com/photo-1556139943-4bdca53adc1e?w=600'],
  ['Cervical Neck Traction Pillow', 24.99, 'neck-pillow', 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600'],
  ['Automatic Touchless Soap Dispenser', 27.99, 'soap', 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600'],
  ['Neck Reading Light', 14.99, 'reading-light', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600'],
  ['Ultra-Slim Power Bank with Built-in Cables', 33.99, 'power-bank', 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600']
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!auth) return res.json({ error: 'SHOPIFY_TOKEN not set in Vercel env vars' });

  if (req.method === 'GET') {
    const r = await shop('GET', 'shop.json');
    if (r.s === 200) return res.json({ ok: true, store: r.b.shop.name });
    return res.json({ ok: false, error: r.b });
  }

  if (req.method === 'POST') {
    const out = { ok: [], fail: [] };
    for (const [title, price, h, img] of ITEMS) {
      const body = {
        product: {
          title, handle: h,
          body_html: `<p>TikTok trending. Ships within 10-20 days.</p>`,
          status: 'active',
          variants: [{ price, sku: 'TD_' + h.toUpperCase() }],
          images: [{ src: img }]
        }
      };
      const r = await shop('POST', 'products.json', body);
      (r.s === 201 ? out.ok : out.fail).push(title);
    }
    return res.json({ imported: out.ok.length, failed: out.fail, details: out });
  }

  return res.status(404).end();
};