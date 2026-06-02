// Vercel Serverless Function — /api/shopify-import.js
// Imports all 20 TrendDrop products into Shopify
// Runs on Vercel's infrastructure which CAN reach Shopify

const https = require('https');

const STORE = process.env.SHOPIFY_STORE || 'mc6zk6-z1';
const TOKEN = process.env.SHOPIFY_TOKEN;

function shopifyFetch(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: `${STORE}.myshopify.com`,
      path: `/admin/api/2024-10/${path}`,
      method,
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const PRODUCTS = [
  { handle: 'unbrush-detangling-hair-brush', title: 'Unbrush Detangling Hair Brush', price: 3.99, desc: 'The viral detangling brush that works on all hair types without pulling.', image: 'https://images.unsplash.com/photo-1616683699404-fb2e48cb4a28?w=600' },
  { handle: 'gurunanda-cocomint-pulling-oil', title: 'GuruNanda Cocomint Pulling Oil', price: 14.99, desc: 'Natural teeth whitening and oral care solution. Made with coconut oil and peppermint.', image: 'https://images.unsplash.com/photo-1613336026275-b6d4735c5f5f?w=600' },
  { handle: 'tirtir-mask-fit-red-cushion', title: 'TIRTIR Mask Fit Red Cushion', price: 27.99, desc: 'High-coverage cushion foundation that went viral for its shade range.', image: 'https://images.unsplash.com/photo-1599733589046-10c7f0f8f7e0?w=600' },
  { handle: 'owala-freesip-water-bottle', title: 'Owala FreeSip Water Bottle', price: 28.99, desc: 'The trendy water bottle with a patented 2-in-1 straw and spout design.', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600' },
  { handle: 'govee-rgbic-led-strip-lights', title: 'Govee RGBIC LED Strip Lights', price: 12.99, desc: 'Smart LED lights with segmented color control. App-controlled with music sync.', image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600' },
  { handle: 'automatic-electric-jar-opener', title: 'Automatic Electric Jar Opener', price: 21.99, desc: 'Hands-free jar opener that opens any sized jar with the push of a button.', image: 'https://images.unsplash.com/photo-1594226801341-41427b4e5c1b?w=600' },
  { handle: 'sunset-lamp-projector', title: 'Sunset Lamp Projector', price: 5.99, desc: 'Atmospheric lighting to create a stunning sunset vibe in any room.', image: 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600' },
  { handle: 'foldable-walking-pad', title: 'Foldable Walking Pad', price: 397.99, desc: 'Under-desk treadmill for staying active while working. Ultra-slim design.', image: 'https://images.unsplash.com/photo-1626447269094-f86522e36d31?w=600' },
  { handle: 'portable-neck-fan', title: 'Portable Neck Fan', price: 12.99, desc: 'Bladeless neck fan for personal cooling on the go. Hands-free design.', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600' },
  { handle: 'weighted-stuffed-animal', title: 'Weighted Stuffed Animal', price: 32.99, desc: 'Anxiety-relieving weighted plush toy with deep pressure stimulation.', image: 'https://images.unsplash.com/photo-1559715541-5d5e35b5f52b?w=600' },
  { handle: 'sleep-headphones-bluetooth-headband', title: 'Sleep Headphones Bluetooth Headband', price: 24.99, desc: 'Ultra-thin speakers in a comfortable headband for sleeping and exercise.', image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600' },
  { handle: 'electric-spin-scrubber', title: 'Electric Spin Scrubber', price: 57.99, desc: 'Cordless cleaning brush with multiple heads for deep cleaning.', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600' },
  { handle: 'heatless-silk-hair-curler', title: 'Heatless Silk Hair Curler', price: 10.99, desc: 'The viral satin headband for getting perfect curls overnight without heat.', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
  { handle: 'multi-functional-vegetable-chopper', title: 'Multi-functional Vegetable Chopper', price: 31.99, desc: 'All-in-one kitchen gadget for dicing, slicing, and chopping instantly.', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600' },
  { handle: 'slim-motion-sensor-trash-can', title: 'Slim Motion Sensor Trash Can', price: 57.99, desc: 'Space-saving touchless trash can perfect for small bathrooms and kitchens.', image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600' },
  { handle: 'reusable-magnetic-water-balloons', title: 'Reusable Magnetic Water Balloons', price: 22.99, desc: 'Self-sealing water balloons for mess-free summer fun.', image: 'https://images.unsplash.com/photo-1556139943-4bdca53adc1e?w=600' },
  { handle: 'cervical-neck-traction-pillow', title: 'Cervical Neck Traction Pillow', price: 24.99, desc: 'Orthopedic pillow designed to relieve neck pain and improve posture.', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600' },
  { handle: 'automatic-touchless-soap-dispenser', title: 'Automatic Touchless Soap Dispenser', price: 27.99, desc: 'Stylish and hygienic soap dispenser with infrared motion sensor.', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600' },
  { handle: 'neck-reading-light', title: 'Neck Reading Light', price: 14.99, desc: 'Hands-free rechargeable book light for reading in bed.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600' },
  { handle: 'ultra-slim-power-bank-cables', title: 'Ultra-Slim Power Bank with Built-in Cables', price: 33.99, desc: 'Portable charger with integrated Lightning and USB-C cables.', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600' }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - check connection
  if (req.method === 'GET') {
    const result = await shopifyFetch('shop.json');
    if (result.status === 200) {
      return res.json({ status: 'connected', shop: result.body.shop.name, products: PRODUCTS.length });
    }
    return res.json({ status: 'error', detail: result.body });
  }

  // POST - run the import
  if (req.method === 'POST') {
    const results = { imported: [], errors: [] };

    for (const p of PRODUCTS) {
      try {
        // Create product
        const prodBody = {
          product: {
            title: p.title,
            handle: p.handle,
            body_html: `<p>${p.desc}</p><p><strong>🔥 TikTok Viral</strong></p><p>✈ Ships within 10-20 days</p>`,
            vendor: 'TrendDrop',
            product_type: 'Trending',
            status: 'active',
            variants: [{ price: p.price, sku: p.handle.toUpperCase().replace(/-/g, '_'), inventory_management: null }],
            images: [{ src: p.image }]
          }
        };

        const result = await shopifyFetch('products.json', 'POST', prodBody);
        if (result.status === 201) {
          results.imported.push(p.title);
        } else {
          results.errors.push(`${p.title}: ${result.status}`);
        }
      } catch (e) {
        results.errors.push(`${p.title}: ${e.message}`);
      }
    }

    return res.json({ imported: results.imported.length, errors: results.errors, results });
  }

  return res.status(404).json({ error: 'Use GET to check connection or POST to import' });
};