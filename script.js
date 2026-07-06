// Cart + dynamic products
function getCart(){
    try{ return JSON.parse(localStorage.getItem('rohan_cart')) || []; }catch(e){ return []; }
}
function saveCart(cart){ localStorage.setItem('rohan_cart', JSON.stringify(cart)); updateCartCount(); }
function updateCartCount(){ const cart = getCart(); const el = document.getElementById('cart-count'); if(el) el.textContent = cart.reduce((s,i)=>s+i.qty,0); }

function renderProducts(products){
    const container = document.getElementById('product-list');
    if(!container) return;
    container.innerHTML = '';
    products.forEach(p=>{
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = p.id;
        card.innerHTML = `
            <div class="small_card">
                <i class="fa-solid fa-heart"></i>
                <i class="fa-solid fa-share"></i>
            </div>
            <div class="image"><img src="${p.img}" alt="${p.title}"></div>
            <div class="products_text">
                <h2>${p.title}</h2>
                <p>${p.description || ''}</p>
                <h3>$${p.price.toFixed(2)}</h3>
                <div class="products_star">${renderStars(p.rating)}</div>
                <a href="#" class="btn add-to-cart">Add To Cart</a>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderStars(r){
    const full = Math.floor(r||0);
    let out = '';
    for(let i=0;i<full;i++) out += '<i class="fa-solid fa-star"></i>';
    if((r - full) >= 0.5) out += '<i class="fa-solid fa-star-half-stroke"></i>';
    return out;
}

function extractProductFromCard(card){
    const id = card.dataset.id || '';
    const title = card.querySelector('h2')?.textContent?.trim() || 'Product';
    const price = parseFloat(card.querySelector('h3')?.textContent?.replace(/[^0-9\.]+/g,'') || '0') || 0;
    const img = card.querySelector('img')?.getAttribute('src') || '';
    return { id, title, price, img };
}

function addToCartFromElement(el){
    const card = el.closest('.card'); if(!card) return;
    const product = extractProductFromCard(card); if(!product) return;
    const cart = getCart(); const found = cart.find(i=>i.id===product.id);
    if(found) found.qty +=1; else cart.push({...product, qty:1});
    saveCart(cart);
    openCartDrawer();
}

// Cart drawer UI
function buildCartDrawer(){
    if(document.getElementById('cart-drawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.innerHTML = `
        <div class="drawer-overlay" id="drawer-overlay"></div>
        <aside class="drawer">
            <header>
                <h3>Your Cart</h3>
                <button id="drawer-close">Close</button>
            </header>
            <div id="drawer-items" class="drawer-items"></div>
            <div class="drawer-footer">
                <div class="drawer-total">Total: $<span id="drawer-total">0.00</span></div>
                <button id="checkout-btn" class="auth-btn">Checkout</button>
            </div>
        </aside>
    `;
    document.body.appendChild(drawer);
    document.getElementById('drawer-close').addEventListener('click', closeCartDrawer);
    document.getElementById('drawer-overlay').addEventListener('click', closeCartDrawer);
    document.getElementById('checkout-btn').addEventListener('click', openCheckoutModal);
    updateDrawer();
}

function updateDrawer(){
    const itemsEl = document.getElementById('drawer-items');
    const totalEl = document.getElementById('drawer-total');
    if(!itemsEl) return;
    const cart = getCart();
    itemsEl.innerHTML = '';
    let total = 0;
    cart.forEach(item=>{
        total += item.price * item.qty;
        const row = document.createElement('div');
        row.className = 'drawer-row';
        row.innerHTML = `
            <img src="${item.img}" alt="${item.title}">
            <div class="meta"><strong>${item.title}</strong><div>$${item.price.toFixed(2)} x ${item.qty}</div></div>
            <div class="actions">
                <button class="qty-minus">-</button>
                <button class="qty-plus">+</button>
                <button class="remove-item">Remove</button>
            </div>
        `;
        row.querySelector('.qty-minus').addEventListener('click', ()=>{ changeQty(item.id, -1); });
        row.querySelector('.qty-plus').addEventListener('click', ()=>{ changeQty(item.id, 1); });
        row.querySelector('.remove-item').addEventListener('click', ()=>{ removeItem(item.id); });
        itemsEl.appendChild(row);
    });
    totalEl.textContent = total.toFixed(2);
    updateCartCount();
}

function changeQty(id, delta){
    const cart = getCart(); const found = cart.find(i=>i.id===id); if(!found) return;
    found.qty += delta; if(found.qty < 1) found.qty = 1; saveCart(cart); updateDrawer();
}

function removeItem(id){
    let cart = getCart(); cart = cart.filter(i=>i.id!==id); saveCart(cart); updateDrawer();
}

function openCartDrawer(){ buildCartDrawer(); document.getElementById('cart-drawer').classList.add('open'); }
function closeCartDrawer(){ const el = document.getElementById('cart-drawer'); if(el) el.classList.remove('open'); }

// Checkout modal
function buildCheckoutModal(){ if(document.getElementById('checkout-modal')) return; const modal = document.createElement('div'); modal.id = 'checkout-modal'; modal.innerHTML = `
    <div class="modal-overlay" id="modal-overlay"></div>
    <div class="modal-card">
        <h3>Checkout</h3>
        <form id="checkout-form">
            <label>Full name<input name="name" class="auth-input" required></label>
            <label>Email<input name="email" type="email" class="auth-input" required></label>
            <label>Address<input name="address" class="auth-input" required></label>
            <div style="margin-top:12px;"><button type="submit" class="auth-btn">Place Order</button>
            <button type="button" id="cancel-checkout" style="margin-left:8px;">Cancel</button></div>
        </form>
    </div>
    `; document.body.appendChild(modal);
    document.getElementById('modal-overlay').addEventListener('click', closeCheckoutModal);
    document.getElementById('cancel-checkout').addEventListener('click', closeCheckoutModal);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
}

function openCheckoutModal(){ buildCheckoutModal(); document.getElementById('checkout-modal').classList.add('open'); }
function closeCheckoutModal(){ const m = document.getElementById('checkout-modal'); if(m) m.classList.remove('open'); }

function handleCheckout(ev){ ev.preventDefault(); const data = Object.fromEntries(new FormData(ev.target).entries()); const cart = getCart(); if(cart.length===0){ alert('Your cart is empty'); return; } const orders = JSON.parse(localStorage.getItem('rohan_orders')||'[]'); orders.push({id:Date.now(), cart, customer:data, total: cart.reduce((s,i)=>s+i.price*i.qty,0)}); localStorage.setItem('rohan_orders', JSON.stringify(orders)); localStorage.removeItem('rohan_cart'); updateDrawer(); updateCartCount(); closeCheckoutModal(); closeCartDrawer(); alert('Order placed — thank you!'); }

// Load products and attach handlers on DOM ready
document.addEventListener('DOMContentLoaded', function(){
    updateCartCount();
    fetch('products.json').then(r=>r.json()).then(data=>{ renderProducts(data);
        // attach add-to-cart listeners
        document.querySelectorAll('.add-to-cart').forEach(a=>{ a.addEventListener('click', function(ev){ ev.preventDefault(); addToCartFromElement(this); }); });
    }).catch(e=>console.error('products load failed',e));

    // cart icon opens drawer
    document.querySelectorAll('.cart-link').forEach(a=> a.addEventListener('click', function(ev){ ev.preventDefault(); openCartDrawer(); }));
});
