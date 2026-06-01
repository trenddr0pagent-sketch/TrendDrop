// === State ===
let products = [];
let cart = JSON.parse(localStorage.getItem('td_cart') || '[]');
let stripePublishableKey = '';
let stripe = null;

// === Product Images — relevant photos from Unsplash source API ===
// Each product gets a curated search term so images match what's being sold
const productImageQueries = {
  'td-001': 'hair-brush',          // Unbrush Detangling Hair Brush
  'td-002': 'coconut-oil',         // GuruNanda Cocomint Pulling Oil
  'td-003': 'makeup-cushion',      // TIRTIR Mask Fit Red Cushion
  'td-004': 'water-bottle',        // Owala FreeSip Water Bottle
  'td-005': 'led-lights',          // Govee RGBIC LED Strip Lights
  'td-006': 'jar-opener',          // Automatic Electric Jar Opener
  'td-007': 'sunset-lamp',         // Sunset Lamp Projector
  'td-008': 'walking-pad',         // Foldable Walking Pad
  'td-009': 'neck-fan',            // Portable Neck Fan
  'td-010': 'stuffed-animal',      // Weighted Stuffed Animal
  'td-011': 'headphones',          // Sleep Headphones Bluetooth Headband
  'td-012': 'cleaning-brush',      // Electric Spin Scrubber
  'td-013': 'hair-curler',         // Heatless Silk Hair Curler
  'td-014': 'vegetable-chopper',   // Multi-functional Vegetable Chopper
  'td-015': 'trash-can',           // Slim Motion Sensor Trash Can
  'td-016': 'water-balloons',      // Reusable Magnetic Water Balloons
  'td-017': 'neck-pillow',         // Cervical Neck Traction Pillow
  'td-018': 'soap-dispenser',      // Automatic Touchless Soap Dispenser
  'td-019': 'reading-light',       // Neck Reading Light
  'td-020': 'power-bank'           // Ultra-Slim Power Bank with Built-in Cables
};
function getProductImage(id) {
  const q = productImageQueries[id];
  if (q) return `https://source.unsplash.com/600x400/?${q}&sig=${id}`;
  return 'https://source.unsplash.com/600x400/?product&sig=default';
}

// === DOM Refs ===
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const productsGrid = $('#productsGrid');
const loadingText = $('#loadingText');
const cartDrawer = $('#cartDrawer');
const cartOverlay = $('#cartOverlay');
const cartItems = $('#cartItems');
const cartFooter = $('#cartFooter');
const cartTotal = $('#cartTotal');
const cartBadge = $('#cartBadge');
const cartIcon = $('#cartIcon');
const cartClose = $('#cartClose');
const modal = $('#productModal');
const modalBody = $('#modalBody');
const modalClose = $('#modalClose');
const menuToggle = $('#menuToggle');
const mobileMenu = $('#mobileMenu');
const trendingCarousel = $('#trendingCarousel');
const reviewsGrid = $('#reviewsGrid');
const newsletterForm = $('#newsletterForm');
const newsletterEmail = $('#newsletterEmail');
const newsletterSuccess = $('#newsletterSuccess');
const newsletterFormEl = document.getElementById('newsletterForm');

// === Review Data ===
const reviews = [
  { name: 'Sarah M.', product: 'Unbrush Detangling Hair Brush', text: 'This brush is LIFE-CHANGING. My daughter has thick curly hair and for the first time ever — no tears. Absolutely worth every penny!', stars: 5, avatar: 'SM' },
  { name: 'James K.', product: 'Govee RGBIC LED Strip Lights', text: 'Setup took 5 minutes. The app control is amazing — I can change colors from my couch. My gaming room looks like a pro streamer setup now.', stars: 5, avatar: 'JK' },
  { name: 'Mia T.', product: 'Portable Neck Fan', text: 'Bought this for a trip to Thailand and it was a lifesaver. Battery lasted all day. My friends all ordered one after seeing mine.', stars: 5, avatar: 'MT' },
  { name: 'Alex R.', product: 'Sunset Lamp Projector', text: 'The sunset vibes are unreal. My room looks like a beach sunset every evening. Best $6 I ever spent on decor.', stars: 4, avatar: 'AR' },
  { name: 'Priya D.', product: 'Weighted Stuffed Animal', text: 'Got this for my anxiety and honestly it helps so much. The weight is perfect — not too heavy, not too light. So cute too!', stars: 5, avatar: 'PD' },
  { name: 'Chris L.', product: 'Automatic Electric Jar Opener', text: 'My mom has arthritis and this has been a game-changer for her kitchen. She can open anything now. Great quality.', stars: 4, avatar: 'CL' }
];

// === Init ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const configRes = await fetch('/api/config');
    if (configRes.ok) {
      const config = await configRes.json();
      stripePublishableKey = config.stripePublishableKey;
      if (stripePublishableKey && stripePublishableKey.startsWith('pk_')) {
        stripe = Stripe(stripePublishableKey);
      }
    }
  } catch (e) { /* Stripe config not available, will use fallback */ }

  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error('Failed');
    products = await res.json();
    renderProducts(products);
    renderTrendingCarousel(products);
    renderReviews(reviews);
    loadingText.textContent = `🎯 ${products.length} trending products found`;
  } catch (err) {
    productsGrid.innerHTML = `<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.4)">
      <p style="font-size:2rem;margin-bottom:16px">😕</p>
      <p>Couldn't load products. Try refreshing.</p>
    </div>`;
    loadingText.textContent = 'Failed to load products';
  }
  updateCartUI();
  setupNewsletter();
});

// === Trending Carousel ===
function renderTrendingCarousel(prods) {
  trendingCarousel.innerHTML = prods.map((p, i) => `
    <button class="trending-chip" data-id="${p.id}" onclick="scrollToProducts(event)">
      <span class="trending-chip-rank">#${i + 1}</span>
      <span class="trending-chip-name">${esc(p.name)}</span>
      <span class="trending-chip-price">$${p.price.toFixed(2)}</span>
    </button>
  `).join('');
}
window.scrollToProducts = function(e) {
  const id = e.currentTarget.dataset.id;
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => openModal(id), 500);
};

// === Reviews ===
function renderReviews(reviews) {
  reviewsGrid.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
      <p class="review-text">"${esc(r.text)}"</p>
      <div class="review-author">
        <div class="review-avatar">${esc(r.avatar)}</div>
        <div>
          <div class="review-name">${esc(r.name)}</div>
          <div class="review-product">${esc(r.product)}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// === Newsletter ===
function setupNewsletter() {
  const subscribed = localStorage.getItem('td_newsletter');
  if (subscribed === 'true') {
    newsletterFormEl.style.display = 'none';
    newsletterSuccess.style.display = 'block';
    newsletterSuccess.querySelector('.newsletter-success-text').textContent = "You're already subscribed! 🎉";
    return;
  }
  newsletterFormEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();
    if (!email) return;
    localStorage.setItem('td_newsletter', 'true');
    localStorage.setItem('td_newsletter_email', email);
    newsletterFormEl.style.display = 'none';
    newsletterSuccess.style.display = 'block';
  });
}

function esc(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// === Render Products ===
function renderProducts(prods) {
  const shuffled = [...prods].sort(() => Math.random() - 0.5);
  productsGrid.innerHTML = shuffled.map((p, i) => {
    const actualImg = getProductImage(p.id);
    return `<div class="product-card" data-id="${p.id}">
      <div class="product-image-wrap">
        <img class="product-image" src="${actualImg}" alt="${esc(p.name)}" loading="lazy" />
        ${p.badge ? `<span class="product-badge">${esc(p.badge)}</span>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-title">${esc(p.name)}</h3>
        <div class="product-price-row">
          <span class="product-price">$${p.price.toFixed(2)}</span>
        </div>
        <p class="product-supplier">✈ Ships from ${esc(p.supplier)} • ${p.delivery}</p>
        <button class="product-buy-btn" data-id="${p.id}">Buy Now →</button>
      </div>
    </div>`;
  }).join('');

  productsGrid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.product-buy-btn')) return;
      openModal(card.dataset.id);
    });
  });
  productsGrid.querySelectorAll('.product-buy-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
    });
  });
}

// === Product Modal ===
function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const actualImg = getProductImage(p.id);
  const productReviews = reviews.filter(r => r.product.toLowerCase().includes(p.name.split(' ')[0].toLowerCase()));
  let reviewsHtml = '';
  if (productReviews.length > 0) {
    reviewsHtml = `<div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.06)">
      <p style="font-size:0.85rem;color:rgba(255,255,255,0.4);margin-bottom:12px">⭐ Customer Reviews</p>
      ${productReviews.slice(0, 2).map(r => `
        <div style="margin-bottom:12px">
          <div style="color:#ffd93d;font-size:0.85rem">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
          <p style="font-size:0.85rem;color:rgba(255,255,255,0.55);font-style:italic;margin:4px 0">"${esc(r.text)}"</p>
          <p style="font-size:0.75rem;color:rgba(255,255,255,0.3)">— ${esc(r.name)}</p>
        </div>
      `).join('')}
    </div>`;
  }
  modalBody.innerHTML = `
    <img class="modal-product-img" src="${actualImg}" alt="${esc(p.name)}" />
    <h2 class="modal-product-name">${esc(p.name)}</h2>
    <div class="modal-product-price">$${p.price.toFixed(2)}</div>
    <p class="modal-product-desc">${esc(p.description)}</p>
    <div class="modal-product-supplier">
      Ships from <span>${esc(p.supplier)}</span> • Estimated delivery: <span>${p.delivery}</span>
    </div>
    ${reviewsHtml}
    <button class="modal-buy-btn" data-id="${p.id}" style="margin-top:16px">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      Buy Now — $${p.price.toFixed(2)}
    </button>
  `;
  modalBody.querySelector('.modal-buy-btn').addEventListener('click', () => {
    addToCart(id);
    modal.classList.remove('active');
  });
  modal.classList.add('active');
}

modalClose.addEventListener('click', () => modal.classList.remove('active'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('active'); });

// === Cart ===
function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(item => item.id === id);
  if (existing) { existing.qty += 1; }
  else { cart.push({ id, qty: 1 }); }
  saveCart();
  updateCartUI();
  const btn = document.querySelector(`.product-buy-btn[data-id="${id}"]`);
  if (btn) {
    btn.textContent = '✓ Added!';
    btn.style.background = 'linear-gradient(135deg, #4ECDC4, #3dbdb5)';
    setTimeout(() => {
      btn.textContent = 'Buy Now →';
      btn.style.background = '';
    }, 1200);
  }
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() { localStorage.setItem('td_cart', JSON.stringify(cart)); }
function getCartTotal() { return cart.reduce((sum, item) => { const p = products.find(x => x.id === item.id); return sum + (p ? p.price * item.qty : 0); }, 0); }
function getCartCount() { return cart.reduce((sum, item) => sum + item.qty, 0); }

function updateCartUI() {
  const count = getCartCount();
  cartBadge.textContent = count;
  cartBadge.style.display = count > 0 ? 'flex' : 'none';
  const mobileCount = document.getElementById('mobileCartCount');
  if (mobileCount) mobileCount.textContent = count;
  renderCartItems();
}

function renderCartItems() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
    cartFooter.style.display = 'none';
    return;
  }
  cartFooter.style.display = 'block';
  const total = getCartTotal();
  cartItems.innerHTML = cart.map(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return '';
    return `<div class="cart-item">
      <img class="cart-item-img" src="${getProductImage(p.id)}" alt="${esc(p.name)}" />
      <div class="cart-item-info">
        <div class="cart-item-title">${esc(p.name)}</div>
        <div class="cart-item-price">$${(p.price * item.qty).toFixed(2)}</div>
        <button class="cart-item-remove" data-id="${p.id}">Remove</button>
      </div>
    </div>`;
  }).join('');
  cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
  });
  cartTotal.textContent = `$${total.toFixed(2)}`;
  document.querySelector('.cart-count') && (document.querySelector('.cart-count').textContent = `(${getCartCount()})`);
}

function openCart() {
  cartDrawer.classList.add('active');
  cartOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

cartClose.addEventListener('click', () => {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
});
cartOverlay.addEventListener('click', () => {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
});
cartIcon.addEventListener('click', openCart);
menuToggle.addEventListener('click', () => { mobileMenu.classList.toggle('active'); });

// === Stripe Checkout ===
async function checkout() {
  if (cart.length === 0) return;

  try {
    // Try Stripe checkout via Vercel API
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart.map(i => ({ id: i.id, qty: i.qty })) })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }
      if (data.sessionId && stripe) {
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) throw result.error;
        return;
      }
    }
  } catch (e) {
    console.warn('Stripe checkout failed:', e);
  }

  // Fallback: save order locally
  const orderRef = 'TD-' + Date.now().toString(36).toUpperCase();
  const order = {
    ref: orderRef,
    items: cart.map(item => {
      const p = products.find(x => x.id === item.id);
      return { id: item.id, name: p?.name, qty: item.qty, price: p?.price, aliexpress_url: p?.aliexpress_url };
    }),
    total: getCartTotal(),
    date: new Date().toISOString()
  };
  const orders = JSON.parse(localStorage.getItem('td_orders') || '[]');
  orders.push(order);
  localStorage.setItem('td_orders', JSON.stringify(orders));
  alert(`Order ${orderRef} saved! We'll process it shortly.`);
  cart = [];
  saveCart();
  updateCartUI();
  closeCart();
}

function closeCart() {
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
});
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);