/*!
 * TAVISH & CO. — public site shell
 * Header, drawer, mega menu, search overlay, badges, product cards,
 * toasts, reveals, newsletter, WhatsApp float, shared helpers.
 * Requires: data/*.js then assets/js/storage.js
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var H = store.helpers;
  var FALLBACK_IMG = 'assets/images/hero/hero-fallback.jpg';

  /* ------------------------------------------------------------- helpers */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return H.escapeHtml(s); }
  function money(n) { return H.formatPrice(n); }

  function params() {
    var out = {};
    var search = window.location.search.replace(/^\?/, '');
    if (!search) return out;
    search.split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('=');
      var k = i < 0 ? pair : pair.slice(0, i);
      var v = i < 0 ? '' : pair.slice(i + 1);
      try { out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); }
      catch (e) { out[k] = v; }
    });
    return out;
  }

  function productUrl(p) {
    return 'product.html?slug=' + encodeURIComponent(p.slug || p.id);
  }
  function categoryUrl(slug) {
    return 'shop.html?category=' + encodeURIComponent(slug);
  }
  function searchUrl(q) {
    return 'search.html?q=' + encodeURIComponent(q || '');
  }

  function icon(name, cls, size) {
    var dim = size ? ' width="' + size + '" height="' + size + '"' : ' width="1em" height="1em"';
    return '<svg class="' + (cls || '') + '"' + dim + ' aria-hidden="true" focusable="false"><use href="#icon-' + name + '"></use></svg>';
  }

  /* --------------------------------------------------------------- toast */
  function toast(message, type) {
    var wrap = qs('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    var el = document.createElement('div');
    el.className = 'toast' + (type === 'error' ? ' toast--error' : type === 'success' ? ' toast--success' : '');
    el.setAttribute('role', 'status');
    el.textContent = message;
    wrap.appendChild(el);
    window.setTimeout(function () {
      el.classList.add('is-leaving');
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, type === 'error' ? 4600 : 3200);
  }

  /* ------------------------------------------------------------- sprites */
  var SPRITE = [
    '<symbol id="icon-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 10.5L12 3.8l8.5 6.7"/><path d="M5.5 9.5v10h13v-10M9.5 19.5v-6h5v6"/></symbol>',
    '<symbol id="icon-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3.8" y="3.8" width="6.4" height="6.4" rx=".6"/><rect x="13.8" y="3.8" width="6.4" height="6.4" rx=".6"/><rect x="3.8" y="13.8" width="6.4" height="6.4" rx=".6"/><rect x="13.8" y="13.8" width="6.4" height="6.4" rx=".6"/></symbol>',
    '<symbol id="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.7 4.7"/></symbol>',
    '<symbol id="icon-heart" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 20.3S4.5 15.4 4.5 10.2A4.1 4.1 0 0 1 12 7.7a4.1 4.1 0 0 1 7.5 2.5c0 5.2-7.5 10.1-7.5 10.1z"/></symbol>',
    '<symbol id="icon-bag" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M5.5 8h13l-1 12.5h-11z"/><path d="M9 8V6.2a3 3 0 0 1 6 0V8"/></symbol>',
    '<symbol id="icon-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.5l6 6 6-6"/></symbol>',
    '<symbol id="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></symbol>',
    '<symbol id="icon-whatsapp" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.6a8.4 8.4 0 0 0-7.2 12.7l-1.2 4.1 4.2-1.1A8.4 8.4 0 1 0 12 3.6z"/><path d="M8.9 9.1c.3 2.5 3.5 5.7 6 6l1.2-1.6-2-1.2-1 .8a6.6 6.6 0 0 1-2.2-2.2l.8-1-1.2-2z"/></symbol>',
    '<symbol id="icon-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.6 7.2l8.4 5.9 8.4-5.9"/></symbol>',
    '<symbol id="icon-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M7 3.5h2.8l1.4 3.8-2 1.5a12.4 12.4 0 0 0 6 6l1.5-2 3.8 1.4V17a2.5 2.5 0 0 1-2.7 2.5A16.8 16.8 0 0 1 4.5 6.2 2.5 2.5 0 0 1 7 3.5z"/></symbol>',
    '<symbol id="icon-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 21.2s7-5.7 7-11.2a7 7 0 1 0-14 0c0 5.5 7 11.2 7 11.2z"/><circle cx="12" cy="9.8" r="2.5"/></symbol>',
    '<symbol id="icon-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.4 2"/></symbol>',
    '<symbol id="icon-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3 7h11v9H3z"/><path d="M14 10h3.6l3.4 3.4V16H14z"/><circle cx="7" cy="18" r="2"/><circle cx="17.4" cy="18" r="2"/></symbol>',
    '<symbol id="icon-refresh" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><path d="M20.5 4.2v4.4h-4.4"/></symbol>',
    '<symbol id="icon-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.9-3.4 7.9-8 9-4.6-1.1-8-4.1-8-9V6z"/><path d="M8.6 12.2l2.5 2.4 4.4-4.6"/></symbol>',
    '<symbol id="icon-rupee" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.6"/><text x="12" y="16" text-anchor="middle" font-size="11" font-family="Jost, Arial, sans-serif" fill="currentColor" stroke="none">&#8377;</text></symbol>',
    '<symbol id="icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10.5-11"/></symbol>',
    '<symbol id="icon-user" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><circle cx="12" cy="8.3" r="3.8"/><path d="M4.5 20.5c1.4-3.7 4.3-5.6 7.5-5.6s6.1 1.9 7.5 5.6"/></symbol>',
    '<symbol id="icon-arrow-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 5.5l6.5 6.5L13 18.5M19.5 12H4.5"/></symbol>',
    '<symbol id="icon-arrow-left" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5.5L4.5 12 11 18.5M4.5 12h15"/></symbol>',
    '<symbol id="icon-dashboard" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="3.5" width="7" height="7.5"/><rect x="13.5" y="3.5" width="7" height="4.5"/><rect x="13.5" y="10.5" width="7" height="10"/><rect x="3.5" y="13.5" width="7" height="7"/></symbol>',
    '<symbol id="icon-box" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.2l8.5 4.6v8.4L12 20.8 3.5 16.2V7.8z"/><path d="M3.5 7.8L12 12.4l8.5-4.6M12 12.4v8.4"/></symbol>',
    '<symbol id="icon-layers" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.5l8.5 4.7L12 12.9 3.5 8.2z"/><path d="M3.5 13.2l8.5 4.7 8.5-4.7"/></symbol>',
    '<symbol id="icon-image" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="1.6"/><circle cx="9" cy="10" r="1.8"/><path d="M3.5 16.5l4.7-3.8 3.6 2.8 4-3.4 4.7 4.2"/></symbol>',
    '<symbol id="icon-receipt" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M6 3.5h12v17l-3-1.8-3 1.8-3-1.8-3 1.8z"/><path d="M9 8.5h6M9 12.5h6"/></symbol>',
    '<symbol id="icon-sliders" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7.5h16M4 16.5h16"/><circle cx="9.5" cy="7.5" r="2.3"/><circle cx="15" cy="16.5" r="2.3"/></symbol>',
    '<symbol id="icon-database" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="6.2" rx="7.5" ry="3.1"/><path d="M4.5 6.2v11.6c0 1.7 3.4 3.1 7.5 3.1s7.5-1.4 7.5-3.1V6.2"/><path d="M4.5 12c0 1.7 3.4 3.1 7.5 3.1s7.5-1.4 7.5-3.1"/></symbol>',
    '<symbol id="icon-list" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20M4.2 6.5h.01M4.2 12h.01M4.2 17.5h.01"/></symbol>',
    '<symbol id="icon-menu" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></symbol>',
    '<symbol id="icon-logout" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 4.5H5.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h4"/><path d="M15.5 8.5l4 3.5-4 3.5M19.5 12H9.5"/></symbol>',
    '<symbol id="icon-edit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M4 20h4.3L19 9.3 14.7 5 4 15.7z"/><path d="M13.4 6.3l4.3 4.3"/></symbol>',
    '<symbol id="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></symbol>',
    '<symbol id="icon-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/></symbol>',
    '<symbol id="icon-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></symbol>',
    '<symbol id="icon-download" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/></symbol>',
    '<symbol id="icon-upload" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5V4.5M7.5 9L12 4.5 16.5 9M5 19.5h14"/></symbol>',
    '<symbol id="icon-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M8 5.5l11 6.5L8 18.5z"/></symbol>'
  ];

  function injectSprite() {
    if (document.getElementById('tavish-sprite')) return;
    var box = document.createElement('div');
    box.id = 'tavish-sprite';
    box.setAttribute('aria-hidden', 'true');
    box.style.display = 'none';
    box.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + SPRITE.join('') + '</svg>';
    document.body.insertBefore(box, document.body.firstChild);
  }

  /* ------------------------------------------------------- product cards */
  function flagsFor(p) {
    var html = '';
    if (p.salePrice && p.salePrice < p.price) html += '<span class="pcard__flag pcard__flag--sale">Sale</span>';
    if (p.newArrival) html += '<span class="pcard__flag pcard__flag--new">New</span>';
    if (p.availability === 'OUT_OF_STOCK' || p.status === 'OUT_OF_STOCK') html += '<span class="pcard__flag pcard__flag--out">Sold out</span>';
    return html;
  }

  function priceHtml(p) {
    if (p.salePrice && p.salePrice < p.price) {
      return '<span class="price price--sale">' + money(p.salePrice) + '</span>' +
        '<s class="price price--old">' + money(p.price) + '</s>';
    }
    return '<span class="price">' + money(p.price) + '</span>';
  }

  function productCard(p) {
    var img = p.primaryImage || (p.images && p.images[0]) || FALLBACK_IMG;
    var out = p.availability === 'OUT_OF_STOCK' || p.status === 'OUT_OF_STOCK';
    var wished = store.wishlist.has(p.id);
    var href = productUrl(p);
    var flags = flagsFor(p);
    var alt = p.name + ' — ' + p.category + ' | TAVISH & CO.';

    return '<article class="pcard" data-product-id="' + p.id + '">' +
      '<a class="pcard__media" href="' + href + '" aria-label="' + esc(p.name) + '">' +
      (flags ? '<span class="pcard__flags">' + flags + '</span>' : '') +
      '<img src="' + esc(img) + '" alt="' + esc(alt) + '" width="800" height="1000" loading="lazy" decoding="async">' +
      '</a>' +
      '<button type="button" class="pcard__wish' + (wished ? ' is-active' : '') + '" data-wish="' + p.id + '" ' +
      'aria-pressed="' + (wished ? 'true' : 'false') + '" aria-label="' + (wished ? 'Remove from' : 'Add to') + ' wishlist: ' + esc(p.name) + '">' +
      icon('heart') + '</button>' +
      '<button type="button" class="pcard__quick" data-quick-add="' + p.id + '"' + (out ? ' aria-disabled="true"' : '') + '>' +
      (out ? 'Out of stock' : 'Add to cart') + '</button>' +
      '<div class="pcard__body">' +
      '<p class="pcard__cat">' + esc(p.category) + (p.subcategory ? ' &middot; ' + esc(p.subcategory) : '') + '</p>' +
      '<h3 class="pcard__name"><a href="' + href + '">' + esc(p.name) + '</a></h3>' +
      '<div class="pcard__price">' + priceHtml(p) + '</div>' +
      '<span class="pcard__stock' + (out ? ' is-out' : '') + '">' + (out ? 'Out of stock' : 'In stock') + '</span>' +
      '</div>' +
      '</article>';
  }

  function skeletonCard() {
    return '<div class="skeleton" aria-hidden="true"><div class="skeleton__media"></div>' +
      '<div class="skeleton__line"></div><div class="skeleton__line skeleton__line--short"></div></div>';
  }

  function emptyState(title, text, cta) {
    return '<div class="empty-state"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' +
      (cta ? '<p class="mt-4"><a class="btn btn--outline" href="' + esc(cta.href) + '">' + esc(cta.label) + '</a></p>' : '') +
      '</div>';
  }

  function selectProducts(spec) {
    spec = String(spec || 'all').trim();
    if (spec === 'featured') return store.products.filtered({ flag: 'featured', sort: 'featured' });
    if (spec === 'best') return store.products.filtered({ flag: 'bestSeller', sort: 'sort' });
    if (spec === 'new') return store.products.filtered({ flag: 'newArrival', sort: 'new' });
    if (spec === 'all') return store.products.filtered({ sort: 'featured' });
    if (spec.indexOf('category:') === 0) return store.products.filtered({ category: spec.slice(9), sort: 'featured' });
    if (spec.indexOf('sub:') === 0) return store.products.filtered({ subcategory: spec.slice(4), sort: 'featured' });
    if (spec.indexOf('q:') === 0) return store.products.filtered({ q: spec.slice(2), sort: 'featured' });
    if (spec.indexOf('sort:') === 0) return store.products.filtered({ sort: spec.slice(5) });
    return store.products.filtered({ sort: 'featured' });
  }

  function renderProducts(root, list) {
    if (!root) return;
    if (!list || !list.length) {
      root.innerHTML = emptyState('Nothing here yet', 'Pieces matching this edit will appear here shortly.', { href: 'shop.html', label: 'Browse the collection' });
      return;
    }
    root.innerHTML = list.map(productCard).join('');
    hydrateImages(root);
    observeReveals(root);
  }

  function processProductContainers(root) {
    qsa('[data-products]', root).forEach(function (el) {
      if (el.dataset.rendered === '1') return;
      el.dataset.rendered = '1';
      var limit = parseInt(el.getAttribute('data-limit'), 10) || 0;
      var list = selectProducts(el.getAttribute('data-products'));
      if (limit > 0) list = list.slice(0, limit);
      var skelCount = limit > 0 ? Math.min(limit, 6) : 4;
      var skels = '';
      for (var i = 0; i < skelCount; i++) skels += skeletonCard();
      el.innerHTML = skels;
      window.setTimeout(function () { renderProducts(el, list); }, 90);
    });
  }

  function processDrawerCats(root) {
    qsa('[data-drawer-cats]', root).forEach(function (el) {
      if (el.dataset.rendered === '1') return;
      el.dataset.rendered = '1';
      var cats = store.categories.list().filter(function (c) { return c.visible !== false; });
      el.innerHTML = cats.map(function (c) {
        var subs = (c.subcategories || []).filter(function (s) { return s.visible !== false; });
        return '<div class="drawer-group">' +
          '<button class="drawer-group__btn" type="button">' + esc(c.name) + icon('chevron', 'chev') + '</button>' +
          '<div class="drawer-group__panel">' +
          '<a href="' + categoryUrl(c.slug) + '">View all ' + esc(c.name) + '</a>' +
          subs.map(function (s) {
            return '<a href="shop.html?category=' + encodeURIComponent(c.slug) + '&sub=' + encodeURIComponent(s.slug) + '">' + esc(s.name) + '</a>';
          }).join('') +
          '</div></div>';
      }).join('');
    });
  }

  function processCategoryTiles(root) {    qsa('[data-category-tiles]', root).forEach(function (el) {
      if (el.dataset.rendered === '1') return;
      el.dataset.rendered = '1';
      var cats = store.categories.list().filter(function (c) { return c.visible !== false; });
      el.innerHTML = cats.map(function (c) {
        return '<a class="tile" href="' + categoryUrl(c.slug) + '">' +
          '<img src="' + esc(c.image || FALLBACK_IMG) + '" alt="' + esc(c.name + ' at TAVISH & CO.') + '" loading="lazy" decoding="async">' +
          '<span class="tile__label"><strong>' + esc(c.name) + '</strong><span>Explore the edit</span></span>' +
          '</a>';
      }).join('');
      hydrateImages(el);
    });
  }

  /* ---------------------------------------------------------- images */
  function hydrateImages(root) {
    qsa('img', root).forEach(function (img) {
      if (img.dataset.bound === '1') return;
      img.dataset.bound = '1';
      if (img.complete) { img.classList.remove('is-loading'); return; }
      img.classList.add('is-loading');
      img.addEventListener('load', function () { img.classList.remove('is-loading'); });
      img.addEventListener('error', function () {
        img.classList.remove('is-loading');
        if (img.dataset.fb === '1') return;
        img.dataset.fb = '1';
        img.src = FALLBACK_IMG;
      });
    });
  }

  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.dataset.fb !== '1') {
      t.dataset.fb = '1';
      t.classList.remove('is-loading');
      t.src = FALLBACK_IMG;
    }
  }, true);

  /* --------------------------------------------------------- reveals */
  var revealObserver = null;
  if ('IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  }

  function observeReveals(root) {
    qsa('[data-reveal]', root || document).forEach(function (el) {
      if (el.dataset.revealBound === '1') return;
      el.dataset.revealBound = '1';
      if (revealObserver) revealObserver.observe(el);
      else el.classList.add('is-visible');
    });
  }

  /* ----------------------------------------------------------- badges */
  function refreshBadges() {
    var cartCount = store.cart.count();
    var wishCount = store.wishlist.count();
    qsa('[data-cart-count]').forEach(function (el) {
      el.textContent = cartCount > 99 ? '99+' : String(cartCount);
      el.hidden = cartCount === 0;
    });
    qsa('[data-wish-count]').forEach(function (el) {
      el.textContent = wishCount > 99 ? '99+' : String(wishCount);
      el.hidden = wishCount === 0;
    });
    qsa('[data-mobile-cart-count]').forEach(function (el) {
      el.textContent = cartCount > 99 ? '99+' : String(cartCount);
      el.hidden = cartCount === 0;
    });
    qsa('[data-mobile-wish-count]').forEach(function (el) {
      el.textContent = wishCount > 99 ? '99+' : String(wishCount);
      el.hidden = wishCount === 0;
    });
  }

  /* --------------------------------------------------------- nav / links */
  function markActiveNav() {
    var file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (file === '') file = 'index.html';
    qsa('.header-nav a, .drawer a, .footer-col a, .admin-nav a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0].split('#')[0].toLowerCase();
      if (!href || href === '#') return;
      var base = href.split('/').pop();
      if (base === file && file !== 'product.html') a.setAttribute('aria-current', 'page');
    });
  }

  /* --------------------------------------------------- announcement bar */
  function fillAnnounce() {
    var track = qs('[data-announce]');
    if (!track) return;
    var c = store.settings.get().commerce || {};
    var items = [];
    if (c.freeShippingAbove) items.push('Free shipping above ' + money(c.freeShippingAbove));
    if (c.cashOnDelivery) items.push('Cash on delivery across India');
    if (c.returnsWindowDays) items.push(c.returnsWindowDays + '-day easy returns');
    if (!items.length) items.push('TAVISH & CO. — Indian jewellery for now');
    track.innerHTML = items.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
  }

  /* ------------------------------------------------------- dynamic bits */
  function fillDynamic() {
    var s = store.settings.get();
    qsa('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
    qsa('[data-email-text]').forEach(function (el) { el.textContent = s.contact.email; });
    qsa('[data-email-link]').forEach(function (el) {
      el.textContent = s.contact.email;
      el.href = 'mailto:' + s.contact.email;
    });
    qsa('[data-whatsapp-text]').forEach(function (el) { el.textContent = s.contact.whatsappDisplay; });
    qsa('[data-location-text]').forEach(function (el) { el.textContent = s.contact.location; });
    qsa('[data-wa]').forEach(function (a) {
      var msg = a.getAttribute('data-wa');
      if (msg === 'product' && a.href && a.href.indexOf('wa.me/') > -1) return;
      var finalMsg = msg === 'product' || !msg ? H.genericMessage : msg;
      a.href = H.whatsappLink(finalMsg);
      if (!a.getAttribute('target')) { a.target = '_blank'; a.rel = 'noopener'; }
    });
    qsa('[data-logo]').forEach(function (img) {
      img.src = s.brand.logo;
      img.alt = s.brand.logoAlt;
    });
  }


  /* ------------------------------------------------ mobile tabbar */
  function initMobileTabbar() {
    var path = (window.location.pathname || '/').split('/').pop() || 'index.html';
    var tab = '';
    if (path === 'index.html') tab = 'home';
    if (path === 'shop.html' || path === 'search.html' || path === 'product.html') tab = 'shop';
    else if (path === 'wishlist.html') tab = 'wishlist';
    else if (path === 'cart.html') tab = 'cart';
    qsa('[data-mobile-tabbar] [data-tab]').forEach(function (a) {
      if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    function syncCounts() {
      var cart = qs('[data-cart-count]');
      var wish = qs('[data-wish-count]');
      var cartTab = qs('[data-mobile-cart-count]');
      var wishTab = qs('[data-mobile-wish-count]');
      if (cart && cartTab) { cartTab.textContent = cart.textContent; cartTab.hidden = cart.hidden || !parseInt(cart.textContent || '0', 10); }
      if (wish && wishTab) { wishTab.textContent = wish.textContent; wishTab.hidden = wish.hidden || !parseInt(wish.textContent || '0', 10); }
    }
    syncCounts();
    window.addEventListener('storage', syncCounts);
    window.setTimeout(syncCounts, 120);
    window.setTimeout(syncCounts, 500);
  }

  /* --------------------------------------------------------- drawer */
  var lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    document.body.classList.add('drawer-open');
    var burger = qs('.burger');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    var close = qs('[data-close-drawer]');
    if (close) close.focus();
  }

  function closeDrawer() {
    if (!document.body.classList.contains('drawer-open')) return;
    document.body.classList.remove('drawer-open');
    var burger = qs('.burger');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initDrawer() {
    var burger = qs('.burger');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.addEventListener('click', function () {
        document.body.classList.contains('drawer-open') ? closeDrawer() : openDrawer();
      });
    }
    qsa('[data-close-drawer]').forEach(function (el) { el.addEventListener('click', closeDrawer); });
    var scrim = qs('.drawer-scrim');
    if (scrim) scrim.addEventListener('click', closeDrawer);

    qsa('.drawer-group__btn').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var group = btn.closest('.drawer-group');
        var open = group.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* -------------------------------------------------------- mega menu */
  function initMegaMenu() {
    var toggles = qsa('.nav-item.has-mega > .nav-link');
    toggles.forEach(function (link) {
      link.setAttribute('aria-expanded', 'false');
      link.addEventListener('click', function (e) {
        if (window.matchMedia('(hover: none)').matches) {
          e.preventDefault();
          var item = link.closest('.nav-item');
          var open = item.classList.toggle('is-open');
          link.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-item.has-mega')) {
        qsa('.nav-item.is-open').forEach(function (item) {
          item.classList.remove('is-open');
          var link = qs('.nav-link', item);
          if (link) link.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  /* ---------------------------------------------------- search overlay */
  function renderSearchResults(q, box) {
    if (!box) return;
    q = String(q || '').trim();
    if (!q) { box.innerHTML = ''; return; }
    var results = store.products.search(q).slice(0, 6);
    if (!results.length) {
      box.innerHTML = emptyState('No matches', 'Try a different word — pearl, korean, kada, polki…', null);
      return;
    }
    box.innerHTML = results.map(function (p) {
      var img = p.primaryImage || (p.images && p.images[0]) || FALLBACK_IMG;
      return '<a class="search-result" href="' + productUrl(p) + '">' +
        '<img src="' + esc(img) + '" alt="" width="64" height="80" loading="lazy">' +
        '<span><span class="search-result__name">' + esc(p.name) + '</span>' +
        '<span class="search-result__meta">' + esc(p.category) + ' &middot; ' + esc(p.sku) + '</span></span>' +
        '<span class="price">' + money(H.priceOf(p)) + '</span></a>';
    }).join('');
    hydrateImages(box);
  }

  function openSearch() {
    var overlay = qs('.search-overlay');
    if (!overlay) return;
    lastFocus = document.activeElement;
    overlay.classList.add('is-open');
    var input = qs('.search-field input', overlay);
    window.setTimeout(function () { if (input) input.focus(); }, 60);
  }

  function closeSearch() {
    var overlay = qs('.search-overlay');
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function initSearch() {
    qsa('[data-open-search]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
    });
    qsa('[data-close-search]').forEach(function (el) { el.addEventListener('click', closeSearch); });

    var overlay = qs('.search-overlay');
    if (!overlay) return;
    var input = qs('.search-field input', overlay);
    var box = qs('[data-search-results]', overlay);
    var timer = null;

    if (input) {
      input.addEventListener('input', function () {
        window.clearTimeout(timer);
        timer = window.setTimeout(function () { renderSearchResults(input.value, box); }, 160);
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var q = input.value.trim();
          if (q) window.location.href = searchUrl(q);
        }
      });
    }

    var form = qs('.search-field', overlay);
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var q = (input ? input.value : '').trim();
        if (q) window.location.href = searchUrl(q);
      });
    }

    qsa('[data-search-suggest] button', overlay).forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (!input) return;
        input.value = btn.textContent.trim();
        input.focus();
        renderSearchResults(input.value, box);
      });
    });
  }

  /* ---------------------------------------------------------- actions */
  function addToCart(id, qty) {
    var res = store.cart.add(id, qty);
    if (res.error) { toast(res.error, 'error'); return res; }
    var p = store.products.get(id);
    toast((p ? p.name : 'Item') + ' added to your bag', 'success');
    return res;
  }

  function toggleWish(id, btn) {
    var p = store.products.get(id);
    var res = store.wishlist.add(id);
    if (res.error) { toast(res.error, 'error'); return; }
    var added = store.wishlist.has(id);
    if (btn) {
      btn.classList.toggle('is-active', added);
      btn.setAttribute('aria-pressed', added ? 'true' : 'false');
      btn.setAttribute('aria-label', (added ? 'Remove from' : 'Add to') + ' wishlist: ' + (p ? p.name : ''));
    }
    qsa('[data-wish="' + id + '"]').forEach(function (other) {
      other.classList.toggle('is-active', added);
      other.setAttribute('aria-pressed', added ? 'true' : 'false');
    });
    toast(added ? (p ? p.name : 'Item') + ' saved to wishlist' : 'Removed from wishlist', added ? 'success' : null);
  }

  function initActions() {
    document.addEventListener('click', function (e) {
      var quick = e.target.closest('[data-quick-add]');
      if (quick) {
        e.preventDefault();
        if (quick.getAttribute('aria-disabled') === 'true') { toast('This piece is currently out of stock.', 'error'); return; }
        addToCart(quick.getAttribute('data-quick-add'), 1);
        return;
      }
      var wish = e.target.closest('[data-wish]');
      if (wish) {
        e.preventDefault();
        toggleWish(wish.getAttribute('data-wish'), wish);
        return;
      }
      var addBtn = e.target.closest('[data-add-to-cart]');
      if (addBtn) {
        e.preventDefault();
        var id = addBtn.getAttribute('data-add-to-cart');
        var qtyInput = qs('[data-qty-input]');
        var qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;
        addToCart(id, qty);
      }
    });

    qsa('[data-move-to-cart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-move-to-cart');
        var res = store.wishlist.moveToCart(id);
        if (res.error) { toast(res.error, 'error'); return; }
        toast('Moved to your bag', 'success');
        window.dispatchEvent(new CustomEvent('tavish:wishlist-view-refresh'));
      });
    });
  }

  /* ------------------------------------------------------ qty steppers */
  function initQty() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-qty-btn]');
      if (!btn) return;
      var wrap = btn.closest('.qty');
      if (!wrap) return;
      var input = qs('input', wrap);
      if (!input) return;
      var min = parseInt(input.min, 10) || 1;
      var max = parseInt(input.max, 10) || 10;
      var step = btn.getAttribute('data-qty-btn') === 'plus' ? 1 : -1;
      var value = Math.max(min, Math.min(max, (parseInt(input.value, 10) || 1) + step));
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      wrap.dispatchEvent(new CustomEvent('tavish:qty', { detail: { value: value }, bubbles: true }));
    });
    qsa('.qty input').forEach(function (input) {
      input.addEventListener('change', function () {
        var min = parseInt(input.min, 10) || 1;
        var max = parseInt(input.max, 10) || 10;
        var v = Math.max(min, Math.min(max, parseInt(input.value, 10) || 1));
        input.value = v;
      });
    });
  }

  /* -------------------------------------------------------- accordion */
  function initAccordions() {
    qsa('.accordion__btn, [data-accordion-btn]').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var item = btn.closest('.accordion__item') || btn.parentElement;
        var open = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* -------------------------------------------------------- newsletter */
  function initNewsletter() {
    qsa('[data-newsletter]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = qs('input[type="email"]', form);
        if (!input) return;
        var email = input.value.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast('Please enter a valid email address.', 'error');
          input.focus();
          return;
        }
        var res = store.newsletter.subscribe(email);
        if (res.ok) {
          toast(res.duplicate ? 'You are already on the list.' : 'Thank you — you are on the list.', 'success');
          input.value = '';
          var note = qs('[data-newsletter-note]', form.parentElement || form);
          if (note) note.textContent = 'Saved in this browser only — this static site has no mailing server.';
        }
      });
    });
  }

  /* ------------------------------------------------- header / sticky UI */
  function initScrollUI() {
    var header = qs('.site-header');
    var sticky = qs('.sticky-cta');
    if (sticky) document.body.classList.add('has-sticky-cta');

    var ticking = false;
    function update() {
      ticking = false;
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (header) header.classList.toggle('is-stuck', y > 120);
      if (sticky) sticky.classList.toggle('is-visible', y > 420);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------------------------- video */
  function initHeroVideo() {
    var video = qs('.hero__media');
    if (!video) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mobile = window.matchMedia('(max-width: 767px)');
    var fallback = qs('.hero__fallback');
    var activeSource = '';
    var inView = true;

    function pauseVideo() { try { video.pause(); } catch (e) {} }
    function applyPlayback() {
      if (reduced.matches || document.hidden || !inView) { pauseVideo(); return; }
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }
    function updateResponsiveMedia() {
      var isMobile = mobile.matches;
      var source = video.getAttribute(isMobile ? 'data-mobile-src' : 'data-desktop-src');
      var poster = video.getAttribute(isMobile ? 'data-mobile-poster' : 'data-desktop-poster');
      var fallbackSource = fallback && fallback.getAttribute(isMobile ? 'data-mobile-src' : 'data-desktop-src');

      if (poster && video.getAttribute('poster') !== poster) video.setAttribute('poster', poster);
      if (fallback && fallbackSource && fallback.getAttribute('src') !== fallbackSource) {
        fallback.setAttribute('src', fallbackSource);
      }
      if (!source || source === activeSource) { applyPlayback(); return; }
      pauseVideo();
      activeSource = source;
      video.src = source;
      video.load();
      applyPlayback();
    }

    updateResponsiveMedia();
    if (mobile.addEventListener) mobile.addEventListener('change', updateResponsiveMedia);
    else if (mobile.addListener) mobile.addListener(updateResponsiveMedia);
    if (reduced.addEventListener) reduced.addEventListener('change', applyPlayback);
    else if (reduced.addListener) reduced.addListener(applyPlayback);
    document.addEventListener('visibilitychange', applyPlayback);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inView = entry.isIntersecting;
          applyPlayback();
        });
      }, { threshold: 0.15 }).observe(video);
    }
  }

  /* ------------------------------------------------------ storage notice */
  function storageNotice() {
    if (store.ready) return;
    var seen = false;
    try { seen = window.sessionStorage.getItem('tavish_storage_notice') === '1'; } catch (e) {}
    if (seen) return;
    toast('Browser storage is unavailable — cart and orders will not be saved in this session.', 'error');
    try { window.sessionStorage.setItem('tavish_storage_notice', '1'); } catch (e) {}
  }

  /* --------------------------------------------------------------- init */
  function init() {
    initMobileTabbar();
    document.documentElement.classList.remove('no-js');
    injectSprite();
    fillDynamic();
    fillAnnounce();
    refreshBadges();
    processDrawerCats(document);
    initDrawer();
    initMegaMenu();
    initSearch();
    initActions();
    initQty();
    initAccordions();
    initNewsletter();
    initScrollUI();
    initHeroVideo();
    markActiveNav();
    processCategoryTiles(document);
    processProductContainers(document);
    hydrateImages(document);
    observeReveals(document);
    storageNotice();

    window.addEventListener('tavish:cart', refreshBadges);
    window.addEventListener('tavish:wishlist', refreshBadges);

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' && e.key !== 'Esc') return;
      var overlay = qs('.search-overlay.is-open');
      if (overlay) { closeSearch(); return; }
      if (document.body.classList.contains('drawer-open')) { closeDrawer(); return; }
      qsa('.nav-item.is-open').forEach(function (item) { item.classList.remove('is-open'); });
    });
  }

  /* -------------------------------------------------------- public API */
  window.Tavish = {
    store: store,
    qs: qs,
    qsa: qsa,
    esc: esc,
    money: money,
    icon: icon,
    params: params,
    productUrl: productUrl,
    categoryUrl: categoryUrl,
    searchUrl: searchUrl,
    toast: toast,
    productCard: productCard,
    priceHtml: priceHtml,
    skeletonCard: skeletonCard,
    emptyState: emptyState,
    renderProducts: renderProducts,
    selectProducts: selectProducts,
    processProductContainers: processProductContainers,
    processCategoryTiles: processCategoryTiles,
    processDrawerCats: processDrawerCats,
    hydrateImages: hydrateImages,
    observeReveals: observeReveals,
    refreshBadges: refreshBadges,
    addToCart: addToCart,
    toggleWish: toggleWish,
    renderSearchResults: renderSearchResults,
    openSearch: openSearch,
    closeSearch: closeSearch,
    closeDrawer: closeDrawer,
    FALLBACK_IMG: FALLBACK_IMG
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window, document);
