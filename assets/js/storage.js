/*!
 * TAVISH & CO. — central localStorage layer
 * Every read/write to browser storage on this static site goes through this file.
 * Keys: tavish_products, tavish_orders, tavish_cart, tavish_wishlist,
 *       tavish_settings, tavish_categories, tavish_audit_logs, tavish_admin_session
 */
(function (window, document) {
  'use strict';

  var KEYS = {
    products: 'tavish_products',
    orders: 'tavish_orders',
    cart: 'tavish_cart',
    wishlist: 'tavish_wishlist',
    settings: 'tavish_settings',
    categories: 'tavish_categories',
    audit: 'tavish_audit_logs',
    session: 'tavish_admin_session',
    newsletter: 'tavish_newsletter',
    seedVersion: 'tavish_seed_version',
    storageNotice: 'tavish_storage_notice'
  };

  var SEED_VERSION = 5;
  var PUB_STATUS = 'ACTIVE';

  var storageOK = (function () {
    try {
      var k = '__tavish_probe__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })();

  function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }

  function read(key, fallback) {
    if (!storageOK) return fallback;
    var raw = null;
    try { raw = window.localStorage.getItem(key); } catch (e) { return fallback; }
    if (raw === null) return fallback;
    return safeParse(raw, fallback);
  }

  function write(key, value) {
    if (!storageOK) return false;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) { return false; }
  }

  function emit(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent('tavish:' + name, { detail: detail || {} }));
    } catch (e) { /* older browsers */ }
  }

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function num(n, fallback) {
    var v = typeof n === 'string' ? parseFloat(n) : n;
    return typeof v === 'number' && !isNaN(v) ? v : (fallback || 0);
  }

  /* ------------------------------------------------------------------ seed */
  // Initial catalogue/configuration is bundled so the static site has content on first load.
  // Customer/admin state is NEVER repopulated with fake orders or fake activity.
  function seed(force) {
    var version = read(KEYS.seedVersion, 0);
    var hasProducts = Array.isArray(read(KEYS.products, null));
    var hasCategories = Array.isArray(read(KEYS.categories, null));
    var hasSettings = !!read(KEYS.settings, null);

    if (!hasProducts) write(KEYS.products, window.TAVISH_SEED_PRODUCTS || []);
    if (!hasCategories) write(KEYS.categories, window.TAVISH_SEED_CATEGORIES || []);
    if (!hasSettings) write(KEYS.settings, window.TAVISH_SEED_SETTINGS || {});
    if (!Array.isArray(read(KEYS.orders, null))) write(KEYS.orders, []);
    if (!Array.isArray(read(KEYS.newsletter, null))) write(KEYS.newsletter, []);
    if (!Array.isArray(read(KEYS.audit, null))) write(KEYS.audit, []);
    if (!Array.isArray(read(KEYS.cart, null))) write(KEYS.cart, []);
    if (!Array.isArray(read(KEYS.wishlist, null))) write(KEYS.wishlist, []);

    // One-time cleanup for the previous seeded order set. Do not touch genuine orders.
    if (version < 4) {
      var existingOrders = read(KEYS.orders, []) || [];
      var seededIds = {
        'TAV-100241':1,'TAV-100242':1,'TAV-100243':1,'TAV-100244':1,
        'TAV-100245':1,'TAV-100246':1,'TAV-100247':1,'TAV-100248':1
      };
      if (existingOrders.length && existingOrders.every(function (o) { return seededIds[o && o.id]; })) {
        write(KEYS.orders, []);
      }
      var migratedSettings = read(KEYS.settings, null);
      var mergedSettings = mergeDeep(window.TAVISH_SEED_SETTINGS || {}, migratedSettings || {});
      mergedSettings.contact = mergedSettings.contact || {};
      mergedSettings.contact.email = 'tanvianikhindi281@gmail.com';
      mergedSettings.contact.whatsappNumber = '919137961623';
      mergedSettings.contact.whatsappDisplay = '+91 91379 61623';
      mergedSettings.contact.location = 'New Kalyani Nagar, Pune, Maharashtra - 411014';
      mergedSettings.contact.locationNote = 'New Kalyani Nagar, Pune, Maharashtra - 411014.';
      mergedSettings.social = mergedSettings.social || {};
      mergedSettings.social.instagram = 'https://www.instagram.com/tavishandco_/?vrfl=MXJ6anJ6cTBjcXpjOQ%3D%3D&utm_source=qr';
      delete mergedSettings.social.facebook;
      delete mergedSettings.social.pinterest;
      delete mergedSettings.social.youtube;
      write(KEYS.settings, mergedSettings);
      var seededProducts = window.TAVISH_SEED_PRODUCTS || [];
      var existingProducts = read(KEYS.products, []) || [];
      existingProducts = existingProducts.map(function (p) {
        if (!Array.isArray(p.styleImages) || !p.styleImages.length) {
          var seedMatch = seededProducts.filter(function (sp) { return sp.id === p.id || sp.sku === p.sku; })[0];
          if (seedMatch && Array.isArray(seedMatch.styleImages)) p.styleImages = seedMatch.styleImages.slice();
        }
        return p;
      });
      write(KEYS.products, existingProducts);
      write(KEYS.seedVersion, SEED_VERSION);
    } else if (version < 5) {
      // One-time contact migration: replace stale phone/address/social details on existing browsers.
      var currentSettings = read(KEYS.settings, {}) || {};
      currentSettings.contact = currentSettings.contact || {};
      currentSettings.contact.email = 'tanvianikhindi281@gmail.com';
      currentSettings.contact.whatsappNumber = '919137961623';
      currentSettings.contact.whatsappDisplay = '+91 91379 61623';
      currentSettings.contact.location = 'New Kalyani Nagar, Pune, Maharashtra - 411014';
      currentSettings.contact.locationNote = 'New Kalyani Nagar, Pune, Maharashtra - 411014.';
      currentSettings.social = currentSettings.social || {};
      currentSettings.social.instagram = 'https://www.instagram.com/tavishandco_/?vrfl=MXJ6anJ6cTBjcXpjOQ%3D%3D&utm_source=qr';
      delete currentSettings.social.facebook;
      delete currentSettings.social.pinterest;
      delete currentSettings.social.youtube;
      write(KEYS.settings, mergeDeep(window.TAVISH_SEED_SETTINGS || {}, currentSettings));
      write(KEYS.seedVersion, SEED_VERSION);
    } else if (version !== SEED_VERSION) {
      write(KEYS.seedVersion, SEED_VERSION);
    }
    return true;
  }

  function mergeDeep(base, over) {
    var out = clone(base || {});
    Object.keys(over || {}).forEach(function (k) {
      var b = out[k], o = over[k];
      if (b && o && typeof b === 'object' && typeof o === 'object' && !Array.isArray(b) && !Array.isArray(o)) {
        out[k] = mergeDeep(b, o);
      } else { out[k] = o; }
    });
    return out;
  }

  /* -------------------------------------------------------------- settings */
  var settings = {
    get: function () {
      var stored = read(KEYS.settings, null);
      var base = window.TAVISH_SEED_SETTINGS || {};
      return stored ? mergeDeep(base, stored) : base;
    },
    save: function (patch) {
      var current = settings.get();
      var next = patch && typeof patch === 'object' ? mergeDeep(current, patch) : current;
      write(KEYS.settings, next);
      audit.log('Settings changed', 'Site settings updated');
      emit('settings', {});
      return next;
    }
  };

  /* ------------------------------------------------------------- categories */
  var categories = {
    list: function () { var stored = read(KEYS.categories, null); return Array.isArray(stored) ? stored : (window.TAVISH_SEED_CATEGORIES || []); },
    save: function (list) {
      write(KEYS.categories, list);
      audit.log('Categories changed', 'Category structure saved');
      emit('categories', {});
      return list;
    },
    find: function (slug) {
      return categories.list().filter(function (c) { return c.slug === slug || c.id === slug; })[0] || null;
    }
  };

  /* ---------------------------------------------------------------- products */
  function normalise(p) {
    var now = new Date().toISOString();
    return {
      id: num(p.id, 0),
      sku: p.sku || '',
      name: p.name || 'Untitled product',
      slug: p.slug || slugify(p.name || 'product'),
      category: p.category || 'Earrings',
      categorySlug: p.categorySlug || slugify(p.category || 'earrings'),
      subcategory: p.subcategory || '',
      subcategorySlug: p.subcategorySlug || slugify(p.subcategory || ''),
      description: p.description || '',
      price: num(p.price, 0),
      salePrice: p.salePrice ? num(p.salePrice, 0) : null,
      currency: p.currency || 'INR',
      images: Array.isArray(p.images) && p.images.length ? p.images : [],
      styleImages: Array.isArray(p.styleImages) ? p.styleImages : [],
      primaryImage: p.primaryImage || (p.images && p.images[0]) || '',
      material: p.material || '',
      finish: p.finish || '',
      dimensions: p.dimensions || '',
      weight: p.weight || '',
      availability: p.availability || 'IN_STOCK',
      featured: !!p.featured,
      newArrival: !!p.newArrival,
      bestSeller: !!p.bestSeller,
      tags: Array.isArray(p.tags) ? p.tags : [],
      sortOrder: num(p.sortOrder, 99),
      status: p.status || 'ACTIVE',
      createdAt: p.createdAt || now,
      updatedAt: p.updatedAt || now
    };
  }

  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  var products = {
    all: function () {
      var stored = read(KEYS.products, null);
      return Array.isArray(stored) ? stored : (window.TAVISH_SEED_PRODUCTS || []);
    },
    write: function (list) {
      // Return failure explicitly; never let the Admin report success when
      // localStorage is disabled or its quota has been exceeded.
      if (!write(KEYS.products, list)) return false;
      var persisted = read(KEYS.products, null);
      if (!Array.isArray(persisted) || persisted.length !== list.length) return false;
      emit('products', {});
      return list;
    },
    count: function () { return products.all().length; },
    get: function (id) {
      var needle = typeof id === 'number' ? id : parseInt(id, 10);
      var list = products.all();
      if (!isNaN(needle)) {
        var byId = list.filter(function (p) { return p.id === needle; })[0];
        if (byId) return byId;
      }
      return list.filter(function (p) { return p.slug === id || p.sku === id; })[0] || null;
    },
    bySlug: function (slug) {
      return products.all().filter(function (p) { return p.slug === slug; })[0] || null;
    },
    publicList: function () {
      return products.all().filter(function (p) {
        return p.status === PUB_STATUS || p.status === 'OUT_OF_STOCK';
      });
    },
    search: function (q) {
      q = String(q || '').toLowerCase().trim();
      if (!q) return [];
      return products.publicList().filter(function (p) {
        return [p.name, p.sku, p.category, p.subcategory, p.description, (p.tags || []).join(' ')]
          .join(' ').toLowerCase().indexOf(q) > -1;
      });
    },
    filtered: function (opts) {
      opts = opts || {};
      var list = opts.scope === 'all' ? products.all() : products.publicList();
      if (opts.category) list = list.filter(function (p) { return p.categorySlug === opts.category; });
      if (opts.subcategory) list = list.filter(function (p) { return p.subcategorySlug === opts.subcategory; });
      if (opts.availability) list = list.filter(function (p) { return p.availability === opts.availability; });
      if (opts.q) {
        var q = opts.q.toLowerCase();
        list = list.filter(function (p) {
          return (p.name + ' ' + p.sku + ' ' + p.category + ' ' + p.subcategory + ' ' + p.description)
            .toLowerCase().indexOf(q) > -1;
        });
      }
      if (opts.flag) list = list.filter(function (p) { return !!p[opts.flag]; });
      return products.sort(list, opts.sort || 'featured');
    },
    sort: function (list, sort) {
      var l = list.slice(0);
      var priceOf = function (p) { return p.salePrice ? p.salePrice : p.price; };
      switch (sort) {
        case 'price-asc': l.sort(function (a, b) { return priceOf(a) - priceOf(b); }); break;
        case 'price-desc': l.sort(function (a, b) { return priceOf(b) - priceOf(a); }); break;
        case 'new': l.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }); break;
        case 'name-asc': l.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
        case 'sort': l.sort(function (a, b) { return a.sortOrder - b.sortOrder; }); break;
        default: l.sort(function (a, b) {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return a.sortOrder - b.sortOrder;
        });
      }
      return l;
    },
    nextId: function () {
      return products.all().reduce(function (m, p) { return Math.max(m, num(p.id, 0)); }, 0) + 1;
    },
    create: function (data) {
      var list = products.all();
      var p = normalise(data);
      p.id = p.id || products.nextId();
      p.createdAt = new Date().toISOString();
      p.updatedAt = p.createdAt;
      list.push(p);
      if (!products.write(list)) return null;
      audit.log('Product created', p.name + ' (' + p.sku + ')');
      return p;
    },
    update: function (id, patch, logAction) {
      var list = products.all();
      var idx = -1;
      list.forEach(function (p, i) { if (p.id === num(id, -1) || p.slug === id) idx = i; });
      if (idx < 0) return null;
      var merged = normalise(Object.assign({}, list[idx], patch, { id: list[idx].id, createdAt: list[idx].createdAt }));
      merged.updatedAt = new Date().toISOString();
      list[idx] = merged;
      if (!products.write(list)) return null;
      if (logAction !== false) audit.log('Product edited', merged.name + ' (' + merged.sku + ')');
      return merged;
    },
    duplicate: function (id) {
      var src = products.get(id);
      if (!src) return null;
      var copy = clone(src);
      copy.id = products.nextId();
      copy.name = src.name + ' (Copy)';
      copy.slug = slugify(src.name + '-copy') + '-' + copy.id;
      copy.sku = src.sku + '-COPY';
      copy.status = 'DRAFT';
      copy.createdAt = copy.updatedAt = new Date().toISOString();
      copy.sortOrder = (num(src.sortOrder, 0)) + 1;
      var list = products.all();
      list.push(normalise(copy));
      products.write(list);
      audit.log('Product duplicated', src.name + ' -> ' + copy.name);
      return copy;
    },
    setStatus: function (id, status) {
      var p = products.get(id);
      if (!p) return null;
      if (status === PUB_STATUS && (!p.images || p.images.length < 1 || p.images.length > 4)) {
        return { error: 'A product needs between 1 and 4 valid images before it can be published.' };
      }
      var updated = products.update(id, { status: status }, false);
      var labels = { ACTIVE: 'Product published', DRAFT: 'Product unpublished', HIDDEN: 'Product hidden', TRASH: 'Product moved to trash', OUT_OF_STOCK: 'Product marked out of stock' };
      audit.log(labels[status] || ('Product status changed to ' + status), p.name);
      return updated;
    },
    restore: function (id) {
      var updated = products.update(id, { status: 'DRAFT' }, false);
      audit.log('Product restored', updated ? updated.name : String(id));
      return updated;
    },
    destroy: function (id) {
      var p = products.get(id);
      var list = products.all().filter(function (x) { return x.id !== num(id, -1) && x.slug !== id; });
      products.write(list);
      audit.log('Product deleted', p ? (p.name + ' (' + p.sku + ')') : String(id));
      return list;
    },
    validate: function (p) {
      var errors = [];
      if (!p || !String(p.name || '').trim()) errors.push('Name is required.');
      if (!p || !String(p.sku || '').trim()) errors.push('SKU is required.');
      if (!p || !p.category) errors.push('Category is required.');
      if (!p || !(num(p.price, 0) > 0)) errors.push('Price must be greater than 0.');
      var imgs = (p && p.images) || [];
      var valid = imgs.filter(function (i) { return typeof i === 'string' && i.trim(); });
      if (valid.length < 1) errors.push('At least 1 product image is required.');
      if (valid.length > 4) errors.push('A maximum of 4 product images is allowed.');
      if (p && p.salePrice && num(p.salePrice, 0) > num(p.price, 0)) errors.push('Sale price cannot be higher than the price.');
      return errors;
    },
    publishable: function (p) { return products.validate(p).length === 0; },
    normalise: normalise,
    slugify: slugify
  };

  /* ------------------------------------------------------------------ cart */
  function productSnapshot(p) {
    return {
      productId: p.id, sku: p.sku, name: p.name, slug: p.slug,
      image: p.primaryImage || (p.images && p.images[0]) || '',
      price: num(p.price, 0), salePrice: p.salePrice ? num(p.salePrice, 0) : null,
      qty: 1, availability: p.availability, status: p.status
    };
  }

  var cart = {
    items: function () { return read(KEYS.cart, []) || []; },
    save: function (items) {
      write(KEYS.cart, items);
      emit('cart', { items: items, count: cart.count(), subtotal: cart.subtotal() });
      return items;
    },
    count: function () {
      return cart.items().reduce(function (n, i) { return n + (num(i.qty, 0) > 0 ? num(i.qty, 0) : 0); }, 0);
    },
    subtotal: function () {
      return cart.items().reduce(function (s, i) {
        var unit = i.salePrice ? num(i.salePrice, 0) : num(i.price, 0);
        return s + unit * num(i.qty, 1);
      }, 0);
    },
    shipping: function () {
      var s = settings.get().commerce || {};
      var sub = cart.subtotal();
      if (sub === 0) return 0;
      if (num(s.freeShippingAbove, 0) && sub >= num(s.freeShippingAbove, 0)) return 0;
      return num(s.shippingFee, 0);
    },
    total: function () { return cart.subtotal() + cart.shipping(); },
    add: function (id, qty) {
      var p = typeof id === 'object' ? id : products.get(id);
      if (!p) return { error: 'Product not found.' };
      if (p.status === 'TRASH' || p.status === 'HIDDEN') return { error: 'This product is not available.' };
      if (p.availability === 'OUT_OF_STOCK') return { error: 'This piece is currently out of stock.' };
      var items = cart.items();
      var found = items.filter(function (i) { return i.productId === p.id; })[0];
      if (found) found.qty = Math.min(10, num(found.qty, 1) + (num(qty, 1) || 1));
      else {
        var snap = productSnapshot(p);
        snap.qty = Math.min(10, Math.max(1, num(qty, 1) || 1));
        items.push(snap);
      }
      cart.save(items);
      return { ok: true, items: items };
    },
    setQty: function (productId, qty) {
      var items = cart.items().map(function (i) {
        if (i.productId === num(productId, -1)) i.qty = Math.max(1, Math.min(10, num(qty, 1)));
        return i;
      });
      cart.save(items);
      return items;
    },
    remove: function (productId) {
      var items = cart.items().filter(function (i) { return i.productId !== num(productId, -1); });
      cart.save(items);
      return items;
    },
    clear: function () { return cart.save([]); },
    inStock: function () {
      return cart.items().filter(function (i) { return i.availability !== 'OUT_OF_STOCK'; });
    }
  };

  /* -------------------------------------------------------------- wishlist */
  var wishlist = {
    items: function () { return read(KEYS.wishlist, []) || []; },
    save: function (list) {
      write(KEYS.wishlist, list);
      emit('wishlist', { items: list, count: list.length });
      return list;
    },
    ids: function () { return wishlist.items().map(function (i) { return i.productId; }); },
    has: function (id) { return wishlist.ids().indexOf(num(id, -1)) > -1; },
    count: function () { return wishlist.items().length; },
    add: function (id) {
      var p = typeof id === 'object' ? id : products.get(id);
      if (!p) return { error: 'Product not found.' };
      if (wishlist.has(p.id)) return wishlist.remove(p.id);
      var items = wishlist.items();
      items.push({
        productId: p.id, sku: p.sku, name: p.name, slug: p.slug,
        image: p.primaryImage || (p.images && p.images[0]) || '',
        price: num(p.price, 0), salePrice: p.salePrice ? num(p.salePrice, 0) : null,
        availability: p.availability, status: p.status, addedAt: new Date().toISOString()
      });
      wishlist.save(items);
      return { ok: true, items: items };
    },
    remove: function (id) {
      var items = wishlist.items().filter(function (i) { return i.productId !== num(id, -1); });
      wishlist.save(items);
      return { ok: true, items: items };
    },
    clear: function () { return wishlist.save([]); },
    moveToCart: function (id) {
      var res = cart.add(id);
      if (res.error) return res;
      wishlist.remove(id);
      return { ok: true, items: res.items };
    }
  };

  /* ---------------------------------------------------------------- orders */
  function formatOrderId(n) {
    return 'TAV-' + n;
  }

  var orders = {
    all: function () {
      var stored = read(KEYS.orders, []) || [];
      return Array.isArray(stored) ? stored : [];
    },
    save: function (list) {
      write(KEYS.orders, list);
      emit('orders', { count: list.length });
      return list;
    },
    get: function (id) {
      return orders.all().filter(function (o) { return o.id === id; })[0] || null;
    },
    nextId: function () {
      var max = 100000;
      orders.all().forEach(function (o) {
        var m = /(\d+)$/.exec(String(o.id || ''));
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      return formatOrderId(max + 1);
    },
    create: function (payload) {
      var now = new Date().toISOString();
      var order = {
        id: payload.id || orders.nextId(),
        date: now,
        createdAt: now,
        status: 'NEW',
        paymentMethod: payload.paymentMethod || 'COD',
        customer: payload.customer || {},
        address: payload.address || {},
        notes: payload.notes || '',
        items: payload.items || [],
        subtotal: num(payload.subtotal, 0),
        shipping: num(payload.shipping, 0),
        total: num(payload.total, 0),
        tracking: ''
      };
      var list = orders.all();
      list.unshift(order);
      orders.save(list);
      audit.log('Order placed', order.id + ' — ' + order.customer.name);
      return order;
    },
    update: function (id, patch) {
      var list = orders.all();
      var idx = -1;
      list.forEach(function (o, i) { if (o.id === id) idx = i; });
      if (idx < 0) return null;
      list[idx] = Object.assign({}, list[idx], patch, { id: list[idx].id });
      orders.save(list);
      return list[idx];
    },
    setStatus: function (id, status, tracking) {
      var patch = { status: status };
      if (tracking !== undefined) patch.tracking = tracking;
      var updated = orders.update(id, patch);
      audit.log('Order status changed', id + ' → ' + status);
      return updated;
    },
    statuses: ['NEW', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED']
  };

  /* ----------------------------------------------------------------- audit */
  var audit = {
    list: function () { return read(KEYS.audit, []) || []; },
    log: function (action, detail, actor) {
      var list = audit.list();
      list.unshift({
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        at: new Date().toISOString(),
        action: action,
        detail: detail || '',
        actor: actor || (session.user() ? session.user().username : 'system')
      });
      if (list.length > 500) list = list.slice(0, 500);
      write(KEYS.audit, list);
      emit('audit', { action: action });
      return list;
    },
    clear: function () {
      write(KEYS.audit, []);
      emit('audit', { action: 'Audit log cleared' });
    }
  };

  /* --------------------------------------------------------------- session */
  var session = {
    user: function () { return read(KEYS.session, null); },
    isAdmin: function () { return !!session.user(); },
    login: function (username, password) {
      var admin = (settings.get().admin || {});
      if (username === admin.username && password === admin.password) {
        var user = { username: username, at: new Date().toISOString(), clientSide: true };
        write(KEYS.session, user);
        audit.log('Admin login', 'Signed in as ' + username, username);
        emit('session', { user: user });
        return { ok: true, user: user };
      }
      audit.log('Admin login failed', 'Invalid credentials for "' + username + '"', username || 'unknown');
      return { error: 'Incorrect username or password.' };
    },
    logout: function () {
      var u = session.user();
      try { window.localStorage.removeItem(KEYS.session); } catch (e) {}
      audit.log('Admin logout', u ? 'Signed out of ' + u.username : '');
      emit('session', { user: null });
      return true;
    }
  };

  /* -------------------------------------------------------------- newsletter */
  var newsletter = {
    subscribe: function (email) {
      var list = read(KEYS.newsletter, []) || [];
      if (list.indexOf(email) > -1) return { ok: true, duplicate: true };
      list.push({ email: email, at: new Date().toISOString() });
      write(KEYS.newsletter, list);
      audit.log('Newsletter subscription', email);
      return { ok: true };
    },
    list: function () { return read(KEYS.newsletter, []) || []; }
  };

  /* ---------------------------------------------------------------- backup */
  var backup = {
    exportAll: function () {
      return {
        format: 'tavish-backup',
        version: SEED_VERSION,
        exportedAt: new Date().toISOString(),
        products: products.all(),
        categories: categories.list(),
        orders: orders.all(),
        settings: settings.get(),
        auditLogs: audit.list(),
        newsletter: newsletter.list()
      };
    },
    restore: function (data) {
      if (!data || typeof data !== 'object') return { error: 'Invalid backup file.' };
      var allowed = ['products', 'categories', 'orders', 'settings'];
      var applied = [];
      allowed.forEach(function (k) {
        if (data[k] !== undefined && data[k] !== null) {
          var key = KEYS[k];
          if (k === 'settings') write(key, mergeDeep(window.TAVISH_SEED_SETTINGS || {}, data[k]));
          else write(key, data[k]);
          applied.push(k);
        }
      });
      if (data.auditLogs) write(KEYS.audit, data.auditLogs);
      if (data.newsletter) write(KEYS.newsletter, data.newsletter);
      write(KEYS.seedVersion, SEED_VERSION);
      audit.log('Restore', 'Restored from backup: ' + applied.join(', '));
      emit('products', {});
      emit('categories', {});
      emit('orders', {});
      emit('settings', {});
      return { ok: true, applied: applied };
    },
    importCatalogue: function (data) {
      var payload = data && data.products ? data : null;
      if (!payload) payload = Array.isArray(data) ? { products: data } : null;
      if (!payload) return { error: 'No products found in the imported file.' };
      var incoming = (payload.products || []).map(normalise);
      if (!incoming.length) return { error: 'The file contains no products.' };
      var list = products.all();
      var added = 0, updated = 0;
      incoming.forEach(function (p) {
        var idx = -1;
        list.forEach(function (x, i) { if (x.sku === p.sku || (p.id && x.id === p.id)) idx = i; });
        if (idx > -1) { p.id = list[idx].id; p.createdAt = list[idx].createdAt; list[idx] = p; updated++; }
        else {
          p.id = p.id && !list.some(function (x) { return x.id === p.id; }) ? p.id : products.nextId() + added;
          p.createdAt = p.createdAt || new Date().toISOString();
          list.push(p); added++;
        }
      });
      products.write(list);
      if (payload.categories) categories.save(payload.categories);
      audit.log('Import', 'Catalogue import: ' + added + ' added, ' + updated + ' updated');
      return { ok: true, added: added, updated: updated };
    }
  };

  /* ---------------------------------------------------------------- helpers */
  function formatPrice(value, opts) {
    opts = opts || {};
    var s = settings.get().commerce || {};
    var symbol = opts.symbol || s.currencySymbol || '₹';
    var n = num(value, 0);
    var formatted;
    try {
      formatted = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
    } catch (e) {
      formatted = String(Math.round(n));
    }
    return symbol + formatted;
  }

  function whatsappLink(message) {
    var s = settings.get().contact || {};
    var number = String(s.whatsappNumber || '919137961623').replace(/[^0-9]/g, '');
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message || '');
  }

  var genericMessage = 'Hello TAVISH & CO., I would like to enquire about your jewellery collection.';
  function productMessage(p) {
    if (!p) return genericMessage;
    return 'Hello TAVISH & CO., I am interested in ' + p.name + ', SKU ' + p.sku + '. Please share more details.';
  }

  /* ---------------------------------------------------------- local reset */
  var localData = {
    factoryReset: function () {
      write(KEYS.products, window.TAVISH_SEED_PRODUCTS || []);
      write(KEYS.categories, window.TAVISH_SEED_CATEGORIES || []);
      write(KEYS.settings, window.TAVISH_SEED_SETTINGS || {});
      write(KEYS.orders, []);
      write(KEYS.newsletter, []);
      write(KEYS.audit, []);
      write(KEYS.cart, []);
      write(KEYS.wishlist, []);
      try { window.localStorage.removeItem(KEYS.session); } catch (e) {}
      write(KEYS.seedVersion, SEED_VERSION);
      emit('products', {}); emit('categories', {}); emit('orders', {}); emit('settings', {}); emit('audit', {});
      return true;
    },
    clearOrders: function () { write(KEYS.orders, []); emit('orders', { count: 0 }); },
    clearAudit: function () { write(KEYS.audit, []); emit('audit', { action: 'Audit log cleared' }); },
    clearNewsletter: function () { write(KEYS.newsletter, []); emit('newsletter', { count: 0 }); }
  };

  /* ------------------------------------------------------------ public API */
  var store = {
    KEYS: KEYS,
    ready: storageOK,
    seed: seed,
    read: read,
    write: write,
    settings: settings,
    categories: categories,
    products: products,
    cart: cart,
    wishlist: wishlist,
    orders: orders,
    audit: audit,
    session: session,
    newsletter: newsletter,
    backup: backup,
    localData: localData,
    helpers: {
      clone: clone, num: num, slugify: slugify, formatPrice: formatPrice,
      whatsappLink: whatsappLink, genericMessage: genericMessage,
      productMessage: productMessage, mergeDeep: mergeDeep, escapeHtml: function (s) {
        return String(s === null || s === undefined ? '' : s)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      },
      priceOf: function (p) { return p && p.salePrice ? num(p.salePrice, 0) : num(p && p.price, 0); },
      prettyDate: function (iso) {
        try {
          return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) { return iso; }
      },
      prettyDateTime: function (iso) {
        try {
          return new Date(iso).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        } catch (e) { return iso; }
      }
    }
  };

  window.TavishStore = store;
  seed(false);
  if (!storageOK) {
    setTimeout(function () {
      try {
        document.dispatchEvent(new CustomEvent('tavish:storage-unavailable'));
      } catch (e) {}
    }, 0);
  }
})(window, document);
