/* ==================================================================
   1. CONFIG  —  EDIT THESE TWO LINES ONLY
   ================================================================== */

const CONFIG = {
  /* ⚠️ VERIFY YOUR NUMBER!
     Nigerian numbers are 11 digits (e.g. 0805 888 9911).
     The number you gave me (0805888991) is only 10 digits —
     please confirm the missing digit below.
     Format used here: drop the leading 0 and add 234  */
  whatsapp: "2348058588991",

  /* Paste your PUBLISHED Google Sheet CSV link here.
     Leave as "" to use the built-in demo products. */
  sheetCsvUrl: ""
};

/* ==================================================================
   2. DEMO PRODUCTS (used if Google Sheet is not connected)
   ================================================================== */

const DEMO_PRODUCTS = [
  { id:"1", name:"Classic Aviator Shades", price:8500, oldPrice:12000, category:"Eyeglasses",
    description:"UV400 protection, lightweight metal frame. Unisex — fits every face.",
    image:"https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=70", badge:"Best seller" },

  { id:"2", name:"Retro Round Frames", price:6500, oldPrice:0, category:"Eyeglasses",
    description:"Vintage round frames with clear lenses. Perfect for that soft-boy / soft-girl look.",
    image:"https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=70", badge:"" },

  { id:"3", name:"Blue-Light Blockers", price:7000, oldPrice:9500, category:"Eyeglasses",
    description:"Protects your eyes from screen glare. Great for students & 9-5 workers.",
    image:"https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=70", badge:"New" },

  { id:"4", name:"Stainless Cuban Chain", price:12000, oldPrice:0, category:"Jewellery",
    description:"18K gold plated, anti-tarnish, 20-inch chain. Won't fade, won't rust.",
    image:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=70", badge:"Hot" },

  { id:"5", name:"Iced Out Stud Earrings", price:5500, oldPrice:8000, category:"Jewellery",
    description:"Cubic zirconia studs. Hypoallergenic — safe for sensitive ears.",
    image:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=70", badge:"" },

  { id:"6", name:"Cuban Link Bracelet", price:9000, oldPrice:0, category:"Jewellery",
    description:"Minimal Cuban link bracelet with secure clasp. Everyday shine.",
    image:"https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=600&q=70", badge:"" },

  { id:"7", name:"Oversized Streetwear Tee", price:7500, oldPrice:10000, category:"Clothing",
    description:"Heavyweight cotton, drop-shoulder fit. Unisex — S to XXL available.",
    image:"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=70", badge:"Trending" },

  { id:"8", name:"Two-Piece Linen Set", price:18000, oldPrice:24000, category:"Clothing",
    description:"Breathable linen shirt + trouser set. Perfect for the heat.",
    image:"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=70", badge:"" },

  { id:"9", name:"Utility Cargo Pants", price:11000, oldPrice:0, category:"Clothing",
    description:"Six-pocket cargo with adjustable waist. Street-ready comfort.",
    image:"https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=70", badge:"New" }
];

/* ==================================================================
   3. STATE
   ================================================================== */

let PRODUCTS = [];
let activeCat = "All";
let query = "";
let CART = [];
try { CART = JSON.parse(localStorage.getItem("adp_cart") || "[]"); } catch(e){ CART = []; }

/* ==================================================================
   4. HELPERS
   ================================================================== */

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// THIS IS THE NAIRA FORMATTING FUNCTION
const money = n => "₦" + Number(n || 0).toLocaleString("en-NG");

const esc = s => String(s ?? "")
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;").replace(/'/g,"&#39;");

function imgFallback(img){
  img.style.display = "none";
  const host = img.closest(".card-media, .hv-card, .cart-thumb");
  if (host) host.classList.add("noimg");
}

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove("show"), 2400);
}

function saveCart(){
  try { localStorage.setItem("adp_cart", JSON.stringify(CART)); } catch(e){}
}

const waLink = msg => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;

function openWhatsApp(msg){
  window.open(waLink(msg), "_blank", "noopener");
}

/* ==================================================================
   5. GOOGLE SHEETS LOADER
   ================================================================== */

function parseCSV(text){
  const rows = [];
  let row = [], cur = "", inQ = false;

  for (let i = 0; i < text.length; i++){
    const c = text[i];
    if (inQ){
      if (c === '"'){
        if (text[i+1] === '"'){ cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n"){ row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r"){ /* skip */ }
      else cur += c;
    }
  }
  if (cur !== "" || row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ""));
}

function sheetRowsToProducts(rows){
  if (!rows.length) return [];
  const headers = rows[0].map(h => String(h).trim().toLowerCase().replace(/[\s_\-]+/g, ""));

  const pick = (obj, keys) => {
    for (const k of keys){
      const v = obj[k];
      if (v !== undefined && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  return rows.slice(1).map((r, i) => {
    const o = {};
    headers.forEach((h, idx) => { o[h] = r[idx]; });

    const name = pick(o, ["name","productname","title","item"]);
    if (!name) return null;

    const num = v => Number(String(v).replace(/[^\d.]/g, "")) || 0;

    return {
      id:        pick(o, ["id","sku"]) || String(i + 1),
      name,
      price:     num(pick(o, ["price","amount","cost"])),
      oldPrice:  num(pick(o, ["oldprice","was","old","compareprice"])),
      category:  pick(o, ["category","type","cat"]) || "Other",
      description: pick(o, ["description","desc","details","info"]),
      image:     pick(o, ["image","imageurl","photo","img","picture"]),
      badge:     pick(o, ["badge","tag","label"])
    };
  }).filter(Boolean);
}

async function loadProducts(){
  renderSkeleton();

  if (CONFIG.sheetCsvUrl && CONFIG.sheetCsvUrl.trim()){
    try {
      const res = await fetch(CONFIG.sheetCsvUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const csv = await res.text();
      const items = sheetRowsToProducts(parseCSV(csv));
      if (items.length){
        PRODUCTS = items;
        buildChips();
        renderGrid();
        return;
      }
      throw new Error("Sheet returned no products");
    } catch (err){
      console.warn("⚠️ Google Sheet failed, using demo products:", err);
      toast("Showing demo products — check your Sheet link");
    }
  }

  PRODUCTS = DEMO_PRODUCTS.slice();
  buildChips();
  renderGrid();
}

/* ==================================================================
   6. RENDER: SKELETON / CHIPS / GRID
   ================================================================== */

function renderSkeleton(){
  $("#grid").innerHTML = Array.from({length: 8}).map(() => `
    <div class="skel">
      <div class="sk-img"></div>
      <div class="sk-line"></div>
      <div class="sk-line s"></div>
      <div class="sk-line s"></div>
    </div>`).join("");
}

function buildChips(){
  const cats = ["All", ...Array.from(new Set(PRODUCTS.map(p => p.category).filter(Boolean)))];
  $("#chips").innerHTML = cats.map(c =>
    `<button class="chip ${c === activeCat ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`
  ).join("");
}

function getVisible(){
  const q = query.trim().toLowerCase();
  return PRODUCTS.filter(p => {
    const catOk = activeCat === "All" || p.category === activeCat;
    const qOk = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q);
    return catOk && qOk;
  });
}

function renderGrid(){
  const list = getVisible();
  const grid = $("#grid");

  if (!list.length){
    grid.innerHTML = `<div class="empty">
      <b>Nothing found 😕</b>
      Try another search or category — or just message us on WhatsApp and we'll source it for you.
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p => {
    const hasOld = p.oldPrice && p.oldPrice > p.price;
    return `
    <article class="card">
      <div class="card-media">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="imgFallback(this)">
        ${p.badge ? `<span class="badge${/new|restock/i.test(p.badge) ? " alt" : ""}">${esc(p.badge)}</span>` : ""}
        <button class="quick-add" data-add="${esc(p.id)}" aria-label="Add ${esc(p.name)} to cart">+</button>
      </div>
      <div class="card-body">
        <span class="cat-tag">${esc(p.category)}</span>
        <h3 class="card-title">${esc(p.name)}</h3>
        <p class="card-desc">${esc(p.description)}</p>
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          ${hasOld ? `<span class="old-price">${money(p.oldPrice)}</span>` : ""}
        </div>
        <button class="inquire" data-inquire="${esc(p.id)}">
          💬 Get Inquiry
        </button>
      </div>
    </article>`;
  }).join("");
}

/* ==================================================================
   7. WHATSAPP MESSAGES
   ================================================================== */

function productMessage(p){
  return `Hello Aba Direct Plug 👋

I'm interested in this product from your website:

*${p.name}*
💰 Price: ${money(p.price)}
📂 Category: ${p.category}
${p.description ? `📝 ${p.description}\n` : ""}
Is it available? And how much is delivery to my state?`;
}

function cartMessage(){
  const items = CART.map(c => ({ ...c, p: PRODUCTS.find(x => String(x.id) === String(c.id)) })).filter(x => x.p);
  if (!items.length) return "Hello Aba Direct Plug 👋 I'd like to make an order.";

  let total = 0;
  const lines = items.map((it, i) => {
    const sub = it.p.price * it.qty;
    total += sub;
    return `${i + 1}. ${it.p.name} × ${it.qty} — ${money(sub)}`;
  });

  return `Hello Aba Direct Plug 👋

I'd like to order the following:

${lines.join("\n")}

*Total: ${money(total)}*

Please confirm availability and delivery cost to my location. Thank you!`;
}

/* ==================================================================
   8. CART
   ================================================================== */

function addToCart(id){
  const p = PRODUCTS.find(x => String(x.id) === String(id));
  if (!p) return;
  const found = CART.find(c => String(c.id) === String(id));
  if (found) found.qty += 1;
  else CART.push({ id: String(id), qty: 1 });
  saveCart(); renderCart(); updateCount();
  toast(`✅ ${p.name} added to cart`);
}

function changeQty(id, delta){
  const item = CART.find(c => String(c.id) === String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) CART = CART.filter(c => String(c.id) !== String(id));
  saveCart(); renderCart(); updateCount();
}

function removeItem(id){
  CART = CART.filter(c => String(c.id) !== String(id));
  saveCart(); renderCart(); updateCount();
}

function updateCount(){
  const total = CART.reduce((s, c) => s + c.qty, 0);
  const el = $("#cartCount");
  el.textContent = total;
  el.classList.toggle("show", total > 0);
}

function renderCart(){
  const body = $("#cartBody");
  const items = CART.map(c => ({ ...c, p: PRODUCTS.find(x => String(x.id) === String(c.id)) })).filter(x => x.p);

  if (!items.length){
    body.innerHTML = `<div class="cart-empty">
      <span class="em">🛒</span>
      Your cart is empty.<br>Add something nice.
    </div>`;
    $("#cartTotal").textContent = money(0);
    return;
  }

  let total = 0;
  body.innerHTML = items.map(it => {
    const sub = it.p.price * it.qty;
    total += sub;
    return `
    <div class="cart-item">
      <div class="cart-thumb">
        <img src="${esc(it.p.image)}" alt="${esc(it.p.name)}" onerror="imgFallback(this)">
      </div>
      <div class="cart-info">
        <h5>${esc(it.p.name)}</h5>
        <div class="cp">${money(sub)}</div>
        <div class="qty">
          <button data-qty="-1" data-id="${esc(it.p.id)}">−</button>
          <span>${it.qty}</span>
          <button data-qty="1" data-id="${esc(it.p.id)}">+</button>
          <button class="rm" data-rm="${esc(it.p.id)}">Remove</button>
        </div>
      </div>
    </div>`;
  }).join("");

  $("#cartTotal").textContent = money(total);
}

function openCart(){ $("#drawer").classList.add("open"); $("#overlay").classList.add("show"); document.body.style.overflow = "hidden"; }
function closeCart(){ $("#drawer").classList.remove("open"); $("#overlay").classList.remove("show"); document.body.style.overflow = ""; }

/* ==================================================================
   9. EVENTS
   ================================================================== */

document.addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (chip){ activeCat = chip.dataset.cat; buildChips(); renderGrid(); return; }

  const inq = e.target.closest("[data-inquire]");
  if (inq){
    const p = PRODUCTS.find(x => String(x.id) === String(inq.dataset.inquire));
    if (p) openWhatsApp(productMessage(p));
    return;
  }

  const add = e.target.closest("[data-add]");
  if (add){ addToCart(add.dataset.add); return; }

  const q = e.target.closest("[data-qty]");
  if (q){ changeQty(q.dataset.id, Number(q.dataset.qty)); return; }

  const rm = e.target.closest("[data-rm]");
  if (rm){ removeItem(rm.dataset.rm); return; }

  const jump = e.target.closest("[data-jump]");
  if (jump){
    activeCat = jump.dataset.jump;
    buildChips(); renderGrid();
    return;
  }
});

$("#searchInput").addEventListener("input", e => {
  query = e.target.value;
  renderGrid();
});

$("#cartBtn").addEventListener("click", openCart);
$("#closeCart").addEventListener("click", closeCart);
$("#overlay").addEventListener("click", closeCart);

$("#checkoutBtn").addEventListener("click", () => {
  if (!CART.length){ toast("Your cart is empty 🛒"); return; }
  openWhatsApp(cartMessage());
});

document.addEventListener("keydown", e => { if (e.key === "Escape") closeCart(); });

/* WhatsApp links */
const generalMsg = `Hello Aba Direct Plug 👋
I found you on your website and I'd like to make an inquiry.`;

["#heroWa", "#bandWa", "#footWa", "#footWa2", "#fabWa"].forEach(sel => {
  const el = $(sel);
  if (el) el.addEventListener("click", e => { e.preventDefault(); openWhatsApp(generalMsg); });
});

$("#year").textContent = new Date().getFullYear();

/* ==================================================================
   10. BOOT
   ================================================================== */

loadProducts();
updateCount();
renderCart();