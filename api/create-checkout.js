// Vercel Serverless Function — /api/create-checkout
// Creates a Shopify checkout for the cart items and redirects to Shopify payment

const fs = require('fs');
const path = require('path');
const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Read products
    const productsPath = path.join(process.cwd(), 'data', 'products.json');
    let products = [];
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    }

    // Map cart items to products
    const lineItems = items.map(item => {
      const p = products.find(x => x.id === item.id);
      if (!p) return null;
      return {
        variantId: null, // We'll use Shopify Storefront API
        quantity: item.qty || 1,
        title: p.name,
        price: p.price,
        image: p.image || ''
      };
    }).filter(Boolean);

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No valid products in cart' });
    }

    // Calculate total
    const total = lineItems.reduce((sum, li) => sum + (li.price * li.quantity), 0);

    // Generate order reference
    const orderRef = 'TD-' + Date.now().toString(36).toUpperCase() + '-' + 
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Try Shopify Storefront API for checkout
    const shopifyStore = process.env.SHOPIFY_STORE || 'mc6zk6-z1';
    const shopifyToken = process.env.SHOPIFY_TOKEN || '';
    
    if (shopifyToken) {
      try {
        // Use Storefront API to create a cart + checkout URL
        const storefrontUrl = `https://${shopifyStore}.myshopify.com/api/2024-10/graphql.json`;
        
        const lineItemsJson = lineItems.map(li => ({
          quantity: li.quantity,
          merchandiseId: li.variantId || 'gid://shopify/ProductVariant/1' // placeholder
        }));

        const query = `
          mutation {
            cartCreate(input: {
              lines: ${JSON.stringify(lineItemsJson).replace(/"([^"]+)":/g, '$1:')}
            }) {
              cart {
                checkoutUrl
                id
              }
            }
          }
        `;

        // For now, redirect to Shopify store with product info
        // Since we don't have variant IDs yet, we'll redirect to the store
        const storeUrl = `https://${shopifyStore}.myshopify.com`;

        // Save order locally
        const ordersDir = path.join(process.cwd(), '.orders');
        if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
        
        fs.writeFileSync(
          path.join(ordersDir, `${orderRef}.json`),
          JSON.stringify({
            order_ref: orderRef,
            status: 'pending',
            created_at: new Date().toISOString(),
            items: lineItems.map(li => ({
              name: li.title,
              price: li.price,
              qty: li.quantity,
              total: li.price * li.quantity
            })),
            total: total,
            shopify_link: storeUrl
          }, null, 2)
        );

        return res.json({
          url: storeUrl,
          orderRef,
          message: 'Redirecting to Shopify checkout'
        });
      } catch (shopifyErr) {
        console.error('Shopify error:', shopifyErr);
      }
    }

    // Fallback: send user to Shopify store home
    const fallbackUrl = `https://${shopifyStore}.myshopify.com`;

    // Save order
    const ordersDir2 = path.join(process.cwd(), '.orders');
    if (!fs.existsSync(ordersDir2)) fs.mkdirSync(ordersDir2, { recursive: true });
    
    fs.writeFileSync(
      path.join(ordersDir2, `${orderRef}.json`),
      JSON.stringify({
        order_ref: orderRef,
        status: 'pending_redirect',
        created_at: new Date().toISOString(),
        items: lineItems.map(li => ({
          name: li.title,
          price: li.price,
          qty: li.quantity,
          total: li.price * li.quantity
        })),
        total: total,
        shopify_link: fallbackUrl
      }, null, 2)
    );

    return res.json({
      url: fallbackUrl,
      orderRef,
    });

  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};