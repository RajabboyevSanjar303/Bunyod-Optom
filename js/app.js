/* Bunyod Market - Simple SPA (Vanilla JS)
   Features: product dataset generation (100+), router, search, filters, sorting,
   cart/wishlist using localStorage, auth (localStorage), checkout, profile, orders,
   dark mode, loaders, reviews. Designed to be a compact but functional demo.
*/

// Utilities
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
const uid = (n=8) => Math.random().toString(36).slice(2,2+n);

// Local storage helpers
const storage = {
  get(k, d) { try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch(e){return d} },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
}

// App state
const App = {
  products: [],
  categories: ["Electronics","Smartphones","Computers","Fashion","Home Appliances","Sports","Books","Beauty","Toys","Automotive","Health","Outdoors"],
  cart: storage.get('bm_cart', []),
  wishlist: storage.get('bm_wish', []),
  users: storage.get('bm_users', []),
  currentUser: storage.get('bm_user', null),
  orders: storage.get('bm_orders', []),
  theme: storage.get('bm_theme','light')
}

// Create product dataset (120 items)
function createProducts(){
  if(window.__bm_generated) return; // only once
  const cats = App.categories;
  const adjectives = ['Pro','Max','Lite','Ultra','Plus','Mini','Prime','Neo','X','S'];
  const brands = ['Helix','Orion','Astra','Nexa','Volt','Lumo','Zen','Pulse','Kinetic','Aero'];
  let id = 1;
  for(let c of cats){
    for(let i=0;i<10;i++){
      const brand = brands[Math.floor(Math.random()*brands.length)];
      const adj = adjectives[Math.floor(Math.random()*adjectives.length)];
      const title = `${brand} ${c.split(' ')[0]} ${adj} ${i+1}`;
      const price = +(Math.random()*900+20).toFixed(2);
      const discount = Math.random() > 0.7 ? Math.floor(Math.random()*40)+5 : 0;
      const oldPrice = discount ? +(price*(1+discount/100)).toFixed(2) : null;
      const rating = +( (Math.random()*1.8+3.2).toFixed(1) );
      const reviews = Math.floor(Math.random()*1200);
      const popularity = Math.floor(Math.random()*10000);
      const images = [ `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`, `https://picsum.photos/seed/${encodeURIComponent(title+'-b')}/600/400` ];
      App.products.push({
        id: 'p'+(id++), title, category: c, price, oldPrice, rating, reviews, popularity, discount, images, description: `High-quality ${c.toLowerCase()} from ${brand}. ${adj} series with excellent performance and reliability.`, specs: {
          Brand: brand,
          Model: title.split(' ').slice(-2).join(' '),
          'Release Year': 2021 + Math.floor(Math.random()*5)
        }, productReviews: []
      });
    }
  }
  // shuffle
  App.products = App.products.sort(()=>Math.random()-0.5);
  window.__bm_generated = true;
}

// Routing
const routes = {};
function route(path, fn){ routes[path] = fn }
function navigate(hash){ location.hash = hash }
function getHashPath(){ return location.hash.replace(/^#/, '') || '/' }

// Render helpers
function currency(n){ return '$' + Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

function updateCounts(){
  qs('#cartCount').textContent = App.cart.reduce((s,i)=>s+i.qty,0) || 0;
  qs('#wishCount').textContent = App.wishlist.length || 0;
}

function saveState(){
  storage.set('bm_cart', App.cart);
  storage.set('bm_wish', App.wishlist);
  storage.set('bm_users', App.users);
  storage.set('bm_user', App.currentUser);
  storage.set('bm_orders', App.orders);
  storage.set('bm_theme', App.theme);
}

// UI renderers
function renderProductCard(p){
  const el = document.createElement('div'); el.className='product';
  el.innerHTML = `
    <div class="media"><img src="${p.images[0]}" alt="${p.title}"></div>
    <div class="card-body">
      <h4 title="${p.title}">${p.title}</h4>
      <div class="muted">${p.category} • <span>${p.rating} ★</span> • <small>${p.reviews} reviews</small></div>
      <div style="margin-top:8px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="price">${currency(p.price)}</div>
          ${p.oldPrice?`<div class="muted"><s>${currency(p.oldPrice)}</s> <small class="muted">-${p.discount}%</small></div>`:''}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn" data-add="${p.id}"><i class="fa-solid fa-cart-plus"></i></button>
          <button class="btn secondary" data-wish="${p.id}"><i class="fa-regular fa-heart"></i></button>
        </div>
      </div>
    </div>
  `;
  return el;
}

// Pages
function pageHome(){
  const app = qs('#app'); app.innerHTML='';
  const hero = document.createElement('section'); hero.className='hero';
  hero.innerHTML = `
    <div class="hero-card">
      <h1 style="font-size:28px">Discover top deals on premium products</h1>
      <p class="muted">Curated picks across ${App.categories.length} categories — fast delivery, secure checkout.</p>
      <div style="margin-top:14px"><button class="btn" onclick="navigate('#/categories')">Shop Categories</button></div>
    </div>
    <div class="filters">
      <h3>Special Offers</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <div class="product skeleton" style="height:140px"></div>
        <div class="product skeleton" style="height:140px"></div>
      </div>
    </div>
  `;
  app.appendChild(hero);

  // Featured products
  const feat = document.createElement('section');
  feat.innerHTML = `<h3 style="margin:18px 0">Featured Products</h3>`;
  const grid = document.createElement('div'); grid.className='grid cols-4';
  App.products.slice(0,12).forEach(p=> grid.appendChild(renderProductCard(p)));
  feat.appendChild(grid);
  app.appendChild(feat);
}

function pageCategories(){
  const app = qs('#app'); app.innerHTML='';
  const el = document.createElement('div');
  el.innerHTML = `<h2>Categories</h2><div class="grid cols-4" id="catsGrid"></div>`;
  app.appendChild(el);
  const grid = qs('#catsGrid');
  App.categories.forEach(c=>{
    const card = document.createElement('div'); card.className='product';
    card.innerHTML = `<div class="card-body"><h4>${c}</h4><div class="muted">Explore ${c}</div><div style="margin-top:12px"><button class="btn" data-cat="${c}">View</button></div></div>`
    grid.appendChild(card);
  })
}

function pageListing(query){
  // query: {category, q, sort, minPrice, maxPrice, rating}
  const app = qs('#app'); app.innerHTML='';
  const top = document.createElement('div'); top.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center"><h2>Products</h2>
    <div style="display:flex;gap:8px;align-items:center">
      <select id="sortSelect"><option value="relevance">Relevance</option><option value="lowest">Lowest Price</option><option value="highest">Highest Price</option><option value="newest">Newest</option><option value="popular">Best Selling</option></select>
    </div></div>
  `;
  app.appendChild(top);

  const grid = document.createElement('div'); grid.className='grid cols-4'; grid.id='listingGrid';
  app.appendChild(grid);

  renderListing(query);
}

function renderListing(query){
  const grid = qs('#listingGrid'); grid.innerHTML='';
  let list = App.products.slice();
  if(query){
    if(query.category) list = list.filter(p=>p.category===query.category);
    if(query.q) list = list.filter(p=>p.title.toLowerCase().includes(query.q.toLowerCase()));
    if(query.rating) list = list.filter(p=>Math.floor(p.rating) >= query.rating);
    if(query.minPrice) list = list.filter(p=>p.price>=query.minPrice);
    if(query.maxPrice) list = list.filter(p=>p.price<=query.maxPrice);
    if(query.sort){
      if(query.sort==='lowest') list.sort((a,b)=>a.price-b.price);
      if(query.sort==='highest') list.sort((a,b)=>b.price-a.price);
      if(query.sort==='popular') list.sort((a,b)=>b.popularity-a.popularity);
      if(query.sort==='newest') list.sort(()=>Math.random()-0.5);
    }
  }
  list.forEach(p=> grid.appendChild(renderProductCard(p)));
}

function pageProduct(id){
  const p = App.products.find(x=>x.id===id);
  if(!p) return renderNotFound();
  const app = qs('#app'); app.innerHTML='';
  const wrap = document.createElement('div'); wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 380px;gap:18px">
      <div class="product"><div class="media"><img src="${p.images[0]}" alt="${p.title}"></div><div class="card-body"><h3>${p.title}</h3><p class="muted">${p.description}</p></div></div>
      <div class="product card-body">
        <div class="muted">Category: ${p.category}</div>
        <h2 style="margin-top:8px">${currency(p.price)}</h2>
        ${p.oldPrice?`<div class="muted"><s>${currency(p.oldPrice)}</s> <small class="muted">-${p.discount}%</small></div>`:''}
        <div style="margin-top:12px;display:flex;gap:8px"><button class="btn" data-add="${p.id}">Add to cart</button><button class="btn secondary" data-wish="${p.id}">Wishlist</button></div>
        <hr style="margin:12px 0">
        <h4>Specifications</h4>
        <ul class="muted">${Object.entries(p.specs).map(([k,v])=>`<li><strong>${k}:</strong> ${v}</li>`).join('')}</ul>
      </div>
    </div>
    <section style="margin-top:18px">
      <h3>Reviews</h3>
      <div id="reviewsList">${p.productReviews.length? p.productReviews.map(r=>`<div class="product" style="padding:10px;margin-bottom:8px"><div class="card-body"><strong>${r.user}</strong> • <span class="muted">${r.rating}★</span><p class="muted">${r.text}</p></div></div>`).join('') : '<div class="muted">No reviews yet</div>'}</div>
      <div style="margin-top:10px">
        <h4>Write a review</h4>
        <textarea id="revText" placeholder="Share your experience" style="width:100%;padding:10px;border-radius:8px"></textarea>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center"><input id="revRating" type="number" min="1" max="5" value="5" style="width:72px;padding:8px;border-radius:8px"><button class="btn" id="postReview">Post Review</button></div>
      </div>
    </section>
  `;
  app.appendChild(wrap);

  // review handler
  qs('#postReview').addEventListener('click', ()=>{
    const text = qs('#revText').value.trim(); const rating = Number(qs('#revRating').value)||5;
    if(!App.currentUser){ alert('Please login to post reviews'); return }
    if(!text) return; p.productReviews.unshift({user:App.currentUser.name||App.currentUser.email, rating, text, id:uid(6)});
    saveState(); pageProduct(id);
  });
}

function pageCart(){
  const app = qs('#app'); app.innerHTML='';
  const el = document.createElement('div'); el.innerHTML = `<h2>Shopping Cart</h2>`;
  const wrap = document.createElement('div'); wrap.className='grid cols-3';
  if(!App.cart.length){ wrap.innerHTML = '<div class="muted">Your cart is empty.</div>' }
  else{
    App.cart.forEach(item=>{
      const p = App.products.find(x=>x.id===item.id);
      const card = document.createElement('div'); card.className='product';
      card.innerHTML = `<div style="display:flex;gap:12px"><div style="width:120px"><img src="${p.images[0]}" style="width:100%;height:80px;object-fit:cover"></div><div class="card-body"><h4>${p.title}</h4><div class="muted">${currency(p.price)} x ${item.qty}</div><div style="margin-top:8px"><button class="btn" data-dec="${p.id}">-</button><button class="btn" data-inc="${p.id}">+</button><button class="btn secondary" data-rem="${p.id}">Remove</button></div></div></div>`
      wrap.appendChild(card);
    })
  }
  const summary = document.createElement('aside'); summary.style.minWidth='260px'; summary.className='product card-body';
  const total = App.cart.reduce((s,i)=>s + ( (App.products.find(p=>p.id===i.id)?.price||0) * i.qty), 0);
  summary.innerHTML = `<h3>Order Summary</h3><div class="muted">Items: ${App.cart.reduce((s,i)=>s+i.qty,0)}</div><div style="margin-top:8px" class="price">Total: ${currency(total)}</div><div style="margin-top:12px"><button class="btn" id="checkoutBtn">Checkout</button></div>`
  app.appendChild(el); app.appendChild(wrap); app.appendChild(summary);

  // handlers
  wrap.addEventListener('click', (e)=>{
    const inc = e.target.closest('[data-inc]'); const dec = e.target.closest('[data-dec]'); const rem = e.target.closest('[data-rem]');
    if(inc){ const id=inc.getAttribute('data-inc'); updateCart(id,1); renderCartRefresh(); }
    if(dec){ const id=dec.getAttribute('data-dec'); updateCart(id,-1); renderCartRefresh(); }
    if(rem){ const id=rem.getAttribute('data-rem'); removeFromCart(id); renderCartRefresh(); }
  })
  qs('#checkoutBtn')?.addEventListener('click', ()=>navigate('#/checkout'))
}

function renderCartRefresh(){ saveState(); updateCounts(); pageCart(); }

function pageWishlist(){ const app=qs('#app'); app.innerHTML='<h2>Your Wishlist</h2>'; const grid=document.createElement('div'); grid.className='grid cols-4'; if(!App.wishlist.length) grid.innerHTML='<div class="muted">Your wishlist is empty.</div>'; else App.wishlist.forEach(id=>{ const p=App.products.find(x=>x.id===id); grid.appendChild(renderProductCard(p)) }); app.appendChild(grid) }

function pageLogin(){ const app=qs('#app'); app.innerHTML=`<h2>Login</h2><div style="max-width:420px"><input id="liEmail" placeholder="Email" style="width:100%;padding:10px;margin:6px 0"><input id="liPass" type="password" placeholder="Password" style="width:100%;padding:10px;margin:6px 0"><button class="btn" id="doLogin">Login</button></div>`; qs('#doLogin').addEventListener('click', ()=>{ const email=qs('#liEmail').value.trim(); const pass=qs('#liPass').value; const user = App.users.find(u=>u.email===email && u.pass===pass); if(!user){ alert('Invalid'); return } App.currentUser = {id:user.id,email:user.email,name:user.name}; saveState(); updateProfileUI(); navigate('#/profile') }) }

function pageRegister(){ const app=qs('#app'); app.innerHTML=`<h2>Register</h2><div style="max-width:520px"><input id="reName" placeholder="Full name" style="width:100%;padding:10px;margin:6px 0"><input id="reEmail" placeholder="Email" style="width:100%;padding:10px;margin:6px 0"><input id="rePass" type="password" placeholder="Password" style="width:100%;padding:10px;margin:6px 0"><button class="btn" id="doReg">Create account</button></div>`; qs('#doReg').addEventListener('click', ()=>{ const name=qs('#reName').value.trim(); const email=qs('#reEmail').value.trim(); const pass=qs('#rePass').value; if(!email||!pass) return alert('Fill fields'); if(App.users.find(u=>u.email===email)) return alert('User exists'); const newU = {id:uid(6),name,email,pass}; App.users.push(newU); App.currentUser={id:newU.id,email:newU.email,name:newU.name}; saveState(); updateProfileUI(); navigate('#/profile') }) }

function pageProfile(){ const app=qs('#app'); if(!App.currentUser){ navigate('#/login'); return } app.innerHTML=`<h2>Profile</h2><div class="product card-body"><h3>${App.currentUser.name||App.currentUser.email}</h3><div class="muted">${App.currentUser.email}</div><div style="margin-top:12px"><button class="btn" id="logoutBtn">Logout</button></div></div><section style="margin-top:18px"><h3>Order History</h3><div id="ordersList" class="grid cols-3"></div></section>`; qs('#logoutBtn').addEventListener('click', ()=>{ App.currentUser=null; saveState(); updateProfileUI(); navigate('#/') }); renderOrders(); }

function renderOrders(){ const el=qs('#ordersList'); const list = App.orders.filter(o=> o.userId === (App.currentUser?.id)); if(!list.length) el.innerHTML='<div class="muted">No orders yet</div>'; else list.forEach(o=>{ const card=document.createElement('div'); card.className='product'; card.innerHTML=`<div class="card-body"><strong>Order ${o.id}</strong><div class="muted">${o.date}</div><div class="muted">Items: ${o.items.length}</div><div style="margin-top:8px">Total: ${currency(o.total)}</div></div>`; el.appendChild(card) }) }

function pageOrders(){ navigate('#/profile') }
function pageCheckout(){ const app=qs('#app'); if(!App.cart.length) return navigate('#/cart'); app.innerHTML=`<h2>Checkout</h2><div style="display:grid;grid-template-columns:1fr 320px;gap:18px"><div><h3>Shipping</h3><input id="shipName" placeholder="Full name" style="width:100%;padding:10px;margin:8px 0"><input id="shipAddr" placeholder="Address" style="width:100%;padding:10px;margin:8px 0"><input id="shipCity" placeholder="City" style="width:100%;padding:10px;margin:8px 0"><button class="btn" id="placeOrder">Place Order</button></div><aside class="product card-body"><h3>Summary</h3><div id="coSummary"></div></aside></div>`; qs('#coSummary').innerHTML=`Items: ${App.cart.reduce((s,i)=>s+i.qty,0)}<div class="price">Total: ${currency(App.cart.reduce((s,i)=>s + (App.products.find(p=>p.id===i.id).price * i.qty),0))}</div>`; qs('#placeOrder').addEventListener('click', ()=>{ const name=qs('#shipName').value.trim(); const addr=qs('#shipAddr').value.trim(); if(!name||!addr) return alert('Fill address'); const total = App.cart.reduce((s,i)=>s + (App.products.find(p=>p.id===i.id).price * i.qty),0); const order = {id:'o'+uid(6), userId: App.currentUser?.id || null, items: App.cart, total, date: new Date().toLocaleString()}; App.orders.push(order); App.cart=[]; saveState(); updateCounts(); navigate('#/orders'); alert('Order placed — thank you!') }) }

function pageAbout(){ qs('#app').innerHTML = '<h2>About</h2><p class="muted">Enterprise-grade marketplace demo created with HTML, CSS and Vanilla JS.</p>' }
function pageContact(){ qs('#app').innerHTML = '<h2>Contact</h2><p class="muted">Email: hello@bunyod.market</p>' }
function renderNotFound(){ qs('#app').innerHTML = '<h2>Not found</h2>' }

// Cart & wishlist
function addToCart(id, qty=1){ const it = App.cart.find(i=>i.id===id); if(it) it.qty += qty; else App.cart.push({id,qty}); saveState(); updateCounts(); }
function updateCart(id, delta){ const it = App.cart.find(i=>i.id===id); if(!it) return; it.qty += delta; if(it.qty<=0) App.cart = App.cart.filter(i=>i.id!==id); saveState(); updateCounts(); }
function removeFromCart(id){ App.cart = App.cart.filter(i=>i.id!==id); saveState(); updateCounts(); }
function toggleWish(id){ if(App.wishlist.includes(id)) App.wishlist = App.wishlist.filter(x=>x!==id); else App.wishlist.push(id); saveState(); updateCounts(); }

// Search & suggestions
function suggest(q){ const s = App.products.filter(p=>p.title.toLowerCase().includes(q.toLowerCase())).slice(0,6); const box = qs('#searchSuggestions'); if(!s.length){ box.classList.add('hidden'); return } box.classList.remove('hidden'); box.innerHTML = s.map(p=>`<a class="suggest" href="#/product/${p.id}">${p.title} <span class="muted">${currency(p.price)}</span></a>`).join(''); }

// Theme
function applyTheme(){ document.documentElement.setAttribute('data-theme', App.theme==='dark'?'dark':'light'); saveState(); }

// Update header categories & footer
function populateCategories(){ const ul = qs('#categoriesList'); ul.innerHTML=''; App.categories.forEach(c=>{ const li=document.createElement('li'); li.textContent=c; li.addEventListener('click', ()=>navigate('#/listing?cat='+encodeURIComponent(c))); ul.appendChild(li) }); const fc = qs('#footerCats'); fc.innerHTML = App.categories.map(c=>`<li><a href="#/listing?cat=${encodeURIComponent(c)}">${c}</a></li>`).join(''); }

// Event delegation
function globalClicks(e){ const add = e.target.closest('[data-add]'); const wish = e.target.closest('[data-wish]'); const go = e.target.closest('[data-route]'); if(add){ addToCart(add.getAttribute('data-add'),1); updateCounts(); showToast('Added to cart'); } if(wish){ toggleWish(wish.getAttribute('data-wish')); showToast('Wishlist updated'); } if(go){ navigate(go.getAttribute('data-route')) } }

function showToast(msg){ console.log('toast',msg); }

// Quick router parser for query params
function parseQuery(qsstr){ if(!qsstr) return {}; const obj={}; qsstr.replace(/^\?/,'').split('&').forEach(part=>{ const [k,v]=part.split('='); obj[decodeURIComponent(k)]=decodeURIComponent(v||'') }); return obj }

// Router setup
function handleRoute(){ const path = getHashPath(); const [base, rest] = path.split('?'); const params = parseQuery(path.includes('?')?path.split('?')[1]: ''); // simple
  // mapping
  if(base === '/' || base==='') return pageHome();
  if(base.startsWith('/product/')) return pageProduct(base.split('/product/')[1]);
  if(base.startsWith('/listing')) return pageListing(params.cat?{category: params.cat, q: params.q, sort: params.sort, rating: params.rating, minPrice: params.minPrice, maxPrice: params.maxPrice} : params.q?{q:params.q}:params);
  if(base === '/categories') return pageCategories();
  if(base === '/cart') return pageCart();
  if(base === '/wishlist') return pageWishlist();
  if(base === '/checkout') return pageCheckout();
  if(base === '/login') return pageLogin();
  if(base === '/register') return pageRegister();
  if(base === '/profile') return pageProfile();
  if(base === '/orders') return pageOrders();
  if(base === '/about') return pageAbout();
  if(base === '/contact') return pageContact();
  return renderNotFound();
}

// Quick init
function init(){
  createProducts();
  applyTheme();
  populateCategories();
  updateCounts();
  qs('#year').textContent = new Date().getFullYear();

  // events
  document.addEventListener('click', globalClicks);
  qs('#searchInput').addEventListener('input', (e)=>{ const v=e.target.value.trim(); if(!v){ qs('#searchSuggestions').classList.add('hidden'); return } suggest(v) });
  qs('#searchBtn').addEventListener('click', ()=>{ const v=qs('#searchInput').value.trim(); if(!v) return navigate('#/listing?q='+encodeURIComponent(v)); navigate('#/listing?q='+encodeURIComponent(qs('#searchInput').value.trim())) });
  qs('#themeToggle').addEventListener('click', ()=>{ App.theme = App.theme==='dark'?'light':'dark'; applyTheme(); });
  qs('#profileBtn').addEventListener('click', ()=>{ if(App.currentUser) navigate('#/profile'); else navigate('#/login') });

  // global hash router
  window.addEventListener('hashchange', handleRoute);
  // initial
  if(!location.hash) location.hash='#/';
  handleRoute();
}

// attach some globals for buttons inside HTML
window.navigate = navigate; window.App = App; window.addToCart = addToCart; window.toggleWish = toggleWish;

// DOM ready
window.addEventListener('DOMContentLoaded', ()=>{
  // minimal loader simulation
  setTimeout(()=>{ init(); }, 250);
});
