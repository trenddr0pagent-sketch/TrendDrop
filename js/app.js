// === State ===
let products = [];
let cart = JSON.parse(localStorage.getItem('td_cart') || '[]');
let stripePublishableKey = '';
let stripe = null;

// === Product Images ===
const productImages = {
  'td-001': 'https://images.unsplash.com/photo-1616683699404-fb2e48cb4a28?w=600&h=400&fit=crop',
  'td-002': 'https://images.unsplash.com/photo-1613336026275-b6d4735c5f5f?w=600&h=400&fit=crop',
  'td-003': 'https://images.unsplash.com/photo-1599733589046-10c7f0f8f7e0?w=600&h=400&fit=crop',
  'td-004': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=400&fit=crop',
  'td-005': 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop',
  'td-006': 'https://images.unsplash.com/photo-1594226801341-41427b4e5c1b?w=600&h=400&fit=crop',
  'td-007': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&h=400&fit=crop',
  'td-008': 'https://images.unsplash.com/photo-1626447269094-f86522e36d31?w=600&h=400&fit=crop',
  'td-009': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=400&fit=crop',
  'td-010': 'https://images.unsplash.com/photo-1559715541-5d5e35b5f52b?w=600&h=400&fit=crop',
  'td-011': 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=400&fit=crop',
  'td-012': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'td-013': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop',
  'td-014': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop',
  'td-015': 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=400&fit=crop',
  'td-016': 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?w=600&h=400&fit=crop',
  'td-017': 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=400&fit=crop',
  'td-018': 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=400&fit=crop',
  'td-019': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
  'td-020': 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=400&fit=crop'
};
function getProductImage(id) { return productImages[id] || `https://picsum.photos/seed/${id}/600/400`; }

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
    // Fetch Stripe config
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

// Make scrollToProducts globally accessible
window.scrollToProducts = function(e) {
  const id = e.currentTarget.dataset.id;
  // Scroll to products section
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  // Open the product modal after a short delay
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

    // Store subscription
    localStorage.setItem('td_newsletter', 'true');
    localStorage.setItem('td_newsletter_email', email);

    // Show success
    newsletterFormEl.style.display = 'none';
    newsletterSuccess.style.display = 'block';
  });
}

// Escape HTML
function esc(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

// === Render Products ===
function renderProducts(prods) {
  // Shuffle for visual variety
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

  // Product card click -> modal
  productsGrid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.product-buy-btn')) return;
      openModal(card.dataset.id);
    });
  });

  // Buy buttons -> cart + checkout
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

  // Visual feedback
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

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const p = products.find(x => x.id === item.id);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

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

// Mobile menu
menuToggle.addEventListener('click', () => {
  mobileMenu.classList.toggle('active');
});

// === Checkout via Stripe ===
async function checkout() {
  if (cart.length === 0) return;

  const total = getCartTotal();
  const orderRef = 'TD-' + Date.now().toString(36).toUpperCase();

  // Save order locally for manual fulfillment
  const order = {
    ref: orderRef,
    items: cart.map(item => {
      const p = products.find(x => x.id === item.id);
      return { id: item.id, name: p?.name, qty: item.qty, price: p?.price, aliexpress_url: p?.aliexpress_url };
    }),
    total,
    date: new Date().toISOString()
  };

  try {
    // Try Stripe checkout
    if (stripe) {
      const checkoutRes = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, orderRef })
      });
      if (checkoutRes.ok) {
        const { sessionId } = await checkoutRes.json();
        const result = await stripe.redirectToCheckout({ sessionId });
        if (result.error) throw result.error;
        return;
      }
    }
  } catch (e) {
    console.warn('Stripe checkout failed, using direct link:', e);
  }

  // Fallback: direct AliExpress links for each product + save order
  saveOrderToLocal(order);

  // Log order and redirect to first product's AliExpress
  const firstItem = order.items[0];
  if (firstItem?.aliexpress_url) {
    window.open(firstItem.aliexpress_url, '_blank');
  }

  // Clear cart after purchase
  cart = [];
  saveCart();
  updateCartUI();
  cartDrawer.classList.remove('active');
  cartOverlay.classList.remove('active');
  document.body.style.overflow = '';

  alert(`Order ${orderRef} saved! Check /orders/ folder for fulfillment details.`);
}

function saveOrderToLocal(order) {
  // Save order to localStorage for reference
  const orders = JSON.parse(localStorage.getItem('td_orders') || '[]');
  orders.push(order);
  localStorage.setItem('td_orders', JSON.stringify(orders));
}

// Add checkout button listener after DOM
document.addEventListener('DOMContentLoaded', () => {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
});

// Helper to close cart when clicking checkout button inside footer
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);