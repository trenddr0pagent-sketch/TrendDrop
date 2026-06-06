// Vercel Serverless Function — /api/shop-import
// Imports all 20 TrendDrop products into Shopify

const Stripe = require('stripe');
const https = require('https');
const fs = require('fs');
const path = require('path');

const SHOPIFY_API_VERSION = '2024-01';

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
  const SHOPIFY_TOKEN = process.env.SHOPIFY_TOKEN;

  if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
    return res.status(500).json({ error: 'Shopify env vars not set' });
  }

  // GET: Test connection
  if (req.method === 'GET') {
    try {
      const data = await shopifyRequest(`/admin/api/${SHOPIFY_API_VERSION}/shop.json`, 'GET');
      return res.json({ ok: true, store: data.shop?.name || SHOPIFY_STORE });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: Import all products
  if (req.method === 'POST') {
    try {
      const productsPath = path.join(process.cwd(), 'data', 'products.json');
      if (!fs.existsSync(productsPath)) {
        return res.status(500).json({ error: 'products.json not found' });
      }
      const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

      const results = { created: [], errors: [] };

      for (const product of products) {
        try {
          const shopifyProduct = {
            product: {
              title: product.name,
              body_html: `<p>${product.description || ''}</p><p><strong>Supplied by:</strong> ${product.supplier || 'Verified Supplier'}</p><p><strong>Estimated delivery:</strong> ${product.delivery || '10-15 days'}</p>`,
              vendor: 'TrendDrop',
              product_type: 'Trending Product',
              status: 'active',
              variants: [{
                price: product.price,
                requires_shipping: true,
                inventory_management: 'shopify',
                inventory_quantity: 999,
              }],
              images: product.images?.length ? product.images.map(url => ({ src: url })) : [],
              metafields_global: [
                { key: 'aliexpress_url', value: product.aliexpress_url || '', type: 'single_line_text_field', namespace: 'global' },
                { key: 'tiktok_price', value: String(product.tiktok_price || ''), type: 'single_line_text_field', namespace: 'global' },
                { key: 'product_id', value: product.id, type: 'single_line_text_field', namespace: 'global' },
              ]
            }
          };

          const result = await shopifyRequest(
            `/admin/api/${SHOPIFY_API_VERSION}/products.json`,
            'POST',
            shopifyProduct
          );

          results.created.push({
            id: product.id,
            shopify_id: result.product?.id,
            title: product.name,
            price: product.price,
          });

          console.log(`✓ Created: ${product.name} (Shopify ID: ${result.product?.id})`);
        } catch (err) {
          results.errors.push({ id: product.id, name: product.name, error: err.message });
          console.error(`✗ Failed: ${product.name}: ${err.message}`);
        }
      }

      return res.json({
        ok: true,
        total: products.length,
        created: results.created.length,
        errors: results.errors.length,
        products: results.created,
        error_details: results.errors,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

// Shopify API helper
function shopifyRequest(endpoint, method, body = null) {
  return new Promise((resolve, reject) => {
    const store = process.env.SHOPIFY_STORE;
    const token = process.env.SHOPIFY_TOKEN;
    const data = body ? JSON.stringify(body) : null;

    const options = {
      hostname: store,
      path: endpoint,
      method,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Shopify ${res.statusCode}: ${JSON.stringify(parsed.errors || parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}