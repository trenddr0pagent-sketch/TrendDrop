// Vercel Serverless Function — /api/create-checkout
// Creates a Stripe Checkout Session for cart checkout

const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read Stripe config
    const configPath = path.join(process.cwd(), 'stripe_config.json');
    if (!fs.existsSync(configPath)) {
      return res.status(500).json({ error: 'Stripe config not found' });
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    const stripe = new Stripe(config.secretKey);
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Read products for mapping
    const productsPath = path.join(process.cwd(), 'data', 'products.json');
    let products = [];
    if (fs.existsSync(productsPath)) {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    }

    // Build Stripe line items
    const lineItems = items.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return null;

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: (product.description || '').substring(0, 100),
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.qty || 1,
      };
    }).filter(Boolean);

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No valid products' });
    }

    // Generate order reference
    const orderRef = 'TD-' + Date.now().toString(36).toUpperCase() + '-' + 
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // Calculate total
    const total = lineItems.reduce((sum, li) => sum + (li.price_data.unit_amount * li.quantity), 0);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5173'}/order-success?session_id={CHECKOUT_SESSION_ID}&ref=${orderRef}`,
      cancel_url: `${req.headers.origin || 'http://localhost:5173'}/?canceled=1`,
      metadata: {
        order_ref: orderRef,
      },
    });

    // Save order to tracked orders
    const ordersDir = path.join(process.cwd(), '.orders');
    if (!fs.existsSync(ordersDir)) fs.mkdirSync(ordersDir, { recursive: true });
    
    fs.writeFileSync(
      path.join(ordersDir, `${orderRef}.json`),
      JSON.stringify({
        order_ref: orderRef,
        session_id: session.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        items: items.map(item => {
          const p = products.find(x => x.id === item.id);
          return {
            product_id: item.id,
            name: p?.name || 'Unknown',
            price: p?.price || 0,
            qty: item.qty || 1,
            total: (p?.price || 0) * (item.qty || 1),
            aliexpress_url: p?.aliexpress_url || '',
            supplier: p?.supplier || ''
          };
        }),
        total: total / 100,
      }, null, 2)
    );

    return res.json({
      sessionId: session.id,
      url: session.url,
      orderRef,
    });

  } catch (err) {
    console.error('Create checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
};