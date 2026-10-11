/*!
 * TAVISH & CO. — admin console (client-side only, localStorage, no backend)
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;
  var H = store.helpers;

  var PAGE = document.body.getAttribute('data-admin-page') || '';

  /* --------------------------------------------------------------- utils */
  function qs(s, root) { return (root || document).querySelector(s); }
  function qsa(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function esc(s) { return H.escapeHtml(s); }
  function money(n) { return H.formatPrice(n); }
  function num(v, d) { return H.num(v, d); }
  function params() { return T.params(); }

  var STATUS_LABELS = { DRAFT: 'Draft', ACTIVE: 'Active', OUT_OF_STOCK: 'Out of stock', HIDDEN: 'Hidden', TRASH: 'Trash' };
  var STATUS_BADGES = { DRAFT: 'badge--gold', ACTIVE: 'badge--green', OUT_OF_STOCK: 'badge--red', HIDDEN: 'badge--ink', TRASH: 'badge--ink' };
  var ORDER_LABELS = { NEW: 'New', CONFIRMED: 'Confirmed', PACKED: 'Packed', SHIPPED: 'Shipped', OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled', RETURNED: 'Returned' };
  var ORDER_BADGES = { NEW: 'badge--gold', CONFIRMED: 'badge--gold', PACKED: 'badge--gold', SHIPPED: 'badge--ink', OUT_FOR_DELIVERY: 'badge--ink', DELIVERED: 'badge--green', CANCELLED: 'badge--red', RETURNED: 'badge--red' };

  function badge(label, cls) { return '<span class="badge ' + (cls || '') + '">' + esc(label) + '</span>'; }
  function statusBadge(s) { return badge(STATUS_LABELS[s] || s, STATUS_BADGES[s] || 'badge--gold'); }
  function orderBadge(s) { return badge(ORDER_LABELS[s] || s, ORDER_BADGES[s] || 'badge--gold'); }
  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso || '');
    try {
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return d.toISOString().slice(0, 16).replace('T', ' '); }
  }

  /* ---------------------------------------------------------------- media */
  var EDITORIAL = ['ed-01', 'ed-02', 'ed-03', 'ed-04', 'ed-05', 'ed-06', 'ed-07', 'ed-08',
    'ed-p01', 'ed-p02', 'ed-p03', 'ed-p04', 'ed-p05', 'ed-p06',
    'ed-s01', 'ed-s02', 'ed-s03', 'ed-s04', 'ed-s05'];

  function mediaLibrary() {
    var out = [];
    for (var i = 1; i <= 24; i++) {
      var n = (i < 10 ? '0' : '') + i;
      for (var j = 1; j <= 4; j++) out.push('assets/images/products/p' + n + '-' + j + '.jpg');
    }
    EDITORIAL.forEach(function (e) { out.push('assets/images/editorial/' + e + '.jpg'); });
    for (var k = 1; k <= 94; k++) out.push('assets/images/stock_reference/sr-' + (k < 10 ? '0' : '') + k + '.jpg');
    return out;
  }

  function mediaUsage(path) {
    return store.products.all().filter(function (p) {
      return p.primaryImage === path || (p.images || []).indexOf(path) > -1 || (p.styleImages || []).indexOf(path) > -1 || p.slug && p.image === path;
    }).length;
  }

  /* ---------------------------------------------------------------- modal */
  function confirmBox(title, text, okLabel) {
    return new Promise(function (resolve) {
      var modal = qs('[data-admin-modal]');
      if (!modal) { resolve(window.confirm(title)); return; }
      qs('[data-admin-modal-title]').textContent = title;
      qs('[data-admin-modal-text]').textContent = text || '';
      var ok = qs('[data-admin-modal-ok]');
      var cancel = qs('[data-admin-modal-cancel]');
      ok.textContent = okLabel || 'Confirm';
      modal.hidden = false;
      function close(val) {
        modal.hidden = true;
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKey);
        resolve(val);
      }
      function onOk() { close(true); }
      function onCancel() { close(false); }
      function onKey(e) { if (e.key === 'Escape') close(false); }
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKey);
      ok.focus();
    });
  }

  /* ----------------------------------------------------------------- csv */
  function download(filename, content, type) {
    try {
      var blob = new Blob([content], { type: type || 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) {} }, 1500);
      return true;
    } catch (e) {
      T.toast('Export is not supported in this browser view.', 'error');
      return false;
    }
  }
  function csvCell(v) { return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"'; }
  function toCsv(rows) { return rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n'); }

  /* --------------------------------------------------------------- shell */
  function currentFile() {
    var f = location.pathname.split('/').pop();
    return f || 'dashboard.html';
  }

  function initShell() {
    var shell = qs('[data-admin-shell]');
    var side = qs('[data-admin-side]');
    var menuBtn = qs('[data-admin-menu]');
    var closeBtn = qs('[data-admin-close]');
    var scrim = qs('[data-admin-scrim]');
    if (shell) shell.classList.add('is-ready');

    function setMenu(open) {
      if (!shell) return;
      shell.classList.toggle('menu-open', open);
      if (side) side.classList.toggle('is-open', open);
    }
    if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    if (scrim) scrim.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

    var file = currentFile();
    var activeKey = file === 'product-edit.html' ? 'products.html' : file === 'order-detail.html' ? 'orders.html' : file;
    qsa('.admin-nav a').forEach(function (a) {
      if ((a.getAttribute('href') || '').split('/').pop() === activeKey) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
    });

    var user = (window.TavishCatalogue && window.TavishCatalogue.enabled) ? window.TavishCatalogue.user() : store.session.user();
    var userEl = qs('[data-admin-user]');
    if (userEl) userEl.textContent = user ? (user.username || user.email || 'Admin') : 'Admin';

    var logout = qs('[data-admin-logout]');
    if (logout) {
      logout.addEventListener('click', function () {
        if (window.TavishCatalogue && window.TavishCatalogue.enabled) { window.TavishCatalogue.signOut().finally(function(){ window.location.replace('login.html'); }); } else { store.session.logout(); window.location.replace('login.html'); }
      });
    }

    var demo = qs('[data-admin-demo-note]');
    if (demo) demo.textContent = store.settings.get().disclaimer && store.settings.get().disclaimer.admin || '';
  }

  /* --------------------------------------------------------------- login */
  function initLogin() {
    if (window.TavishCatalogue && window.TavishCatalogue.enabled && window.TavishCatalogue.isAdmin()) { window.location.replace('dashboard.html'); return; }
    var form = qs('[data-login-form]');
    if (!form) return;
    var errorEl = qs('[data-login-error]');
    var statusEl = qs('[data-login-status]');
    var passInput = form.querySelector('[name="password"]');
    var reveal = qs('[data-login-reveal]');

    if (reveal && passInput) {
      reveal.addEventListener('click', function () {
        var show = passInput.type === 'password';
        passInput.type = show ? 'text' : 'password';
        reveal.textContent = show ? 'Hide' : 'Show';
        reveal.setAttribute('aria-pressed', show ? 'true' : 'false');
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var username = String(form.querySelector('[name="username"]').value || '').trim();
      var password = String(form.querySelector('[name="password"]').value || '');
      try {
        if (window.TavishCatalogue && window.TavishCatalogue.enabled) {
          await window.TavishCatalogue.signIn(username, password);
        } else {
          throw new Error('Admin login is disabled until Supabase is configured. Set the project URL and publishable key in supabase-config.js, then create an authorised Auth user.');
        }
        if (errorEl) errorEl.hidden = true;
        if (statusEl) { statusEl.textContent = 'Signed in — redirecting to the dashboard…'; statusEl.hidden = false; }
        var next = params().next;
        var target = next && /^admin\/[a-z0-9-]+\.html$/i.test(next) ? next.replace('admin/', '') : 'dashboard.html';
        window.location.replace(target);
      } catch (err) {
        if (errorEl) { errorEl.textContent = err.message || 'Sign-in failed.'; errorEl.hidden = false; }
      }
    });
  }

  /* ----------------------------------------------------------- dashboard */
  function initDashboard() {
    var products = store.products.all();
    var orders = store.orders.all();
    var subs = store.newsletter.list();

    var active = products.filter(function (p) { return p.status === 'ACTIVE'; }).length;
    var drafts = products.filter(function (p) { return p.status === 'DRAFT'; }).length;
    var openOrders = orders.filter(function (o) { return ['NEW', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].indexOf(o.status) > -1; });
    var revenue = orders.reduce(function (s, o) { return o.status === 'CANCELLED' ? s : s + num(o.total, 0); }, 0);
    var newOrders = orders.filter(function (o) { return o.status === 'NEW'; }).length;

    var stats = qs('[data-stats]');
    if (stats) {
      stats.innerHTML = [
        statCard('Catalogue', active + ' active', drafts ? drafts + ' in draft' : 'no drafts'),
        statCard('Open orders', String(openOrders.length), newOrders + ' new awaiting confirmation'),
        statCard('Recorded revenue', money(revenue), orders.length + ' orders in this browser'),
        statCard('Newsletter', subs.length + ' subscriber' + (subs.length === 1 ? '' : 's'), 'stored locally only')
      ].join('');
    }

    var recent = orders.slice(0, 5);
    var rows = qs('[data-recent-orders]');
    if (rows) {
      if (!recent.length) rows.innerHTML = '<tr><td colspan="6">' + T.emptyState('No orders yet', 'Orders placed through the storefront will appear here.', null) + '</td></tr>';
      else {
        rows.innerHTML = recent.map(function (o) {
          return '<tr>' +
            '<td class="mono">' + esc(o.id) + '</td>' +
            '<td>' + esc(o.customer && o.customer.name || '—') + '<div class="sub">' + esc(o.customer && o.customer.mobile || '') + '</div></td>' +
            '<td>' + num(o.items && o.items.length, 0) + '</td>' +
            '<td>' + money(o.total) + '</td>' +
            '<td>' + orderBadge(o.status) + '</td>' +
            '<td><div class="actions"><a href="order-detail.html?id=' + encodeURIComponent(o.id) + '">Open</a></div></td>' +
          '</tr>';
        }).join('');
      }
    }

    var auditEl = qs('[data-recent-audit]');
    if (auditEl) {
      var logs = store.audit.list().slice(0, 5);
      auditEl.innerHTML = logs.length
        ? logs.map(auditItem).join('')
        : '<div class="audit-item"><span>No activity recorded yet.</span></div>';
    }
  }

  function statCard(label, value, hint) {
    return '<div class="stat-card"><p class="stat-card__label">' + esc(label) + '</p>' +
      '<p class="stat-card__value">' + esc(value) + '</p>' +
      '<p class="stat-card__hint">' + esc(hint || '') + '</p></div>';
  }

  function auditItem(entry) {
    return '<div class="audit-item">' +
      '<time datetime="' + esc(entry.at) + '">' + esc(fmtDate(entry.at)) + '</time>' +
      '<strong>' + esc(entry.action) + '</strong>' +
      '<span>' + esc(entry.detail || '') + (entry.actor ? ' · ' + esc(entry.actor) : '') + '</span>' +
    '</div>';
  }

  /* ------------------------------------------------------------ products */
  function initProducts() {
    var state = { tab: 'all', q: '', cat: '', sort: 'sort' };
    var rowsEl = qs('[data-products-rows]');
    var countEl = qs('[data-products-count]');
    if (!rowsEl) return;

    var catSel = qs('[data-products-cat]');
    if (catSel) {
      catSel.innerHTML = '<option value="">All categories</option>' + store.categories.list().map(function (c) {
        return '<option value="' + esc(c.slug) + '">' + esc(c.name) + '</option>';
      }).join('');
    }

    function filtered() {
      var list = store.products.all().slice(0);
      if (state.tab === 'all') list = list.filter(function (p) { return p.status !== 'TRASH'; });
      else list = list.filter(function (p) { return p.status === state.tab; });
      if (state.cat) list = list.filter(function (p) { return p.categorySlug === state.cat; });
      if (state.q) {
        var q = state.q.toLowerCase();
        list = list.filter(function (p) {
          return (p.name + ' ' + p.sku + ' ' + p.slug).toLowerCase().indexOf(q) > -1;
        });
      }
      return store.products.sort(list, state.sort);
    }

    function render() {
      var list = filtered();
      if (countEl) countEl.textContent = list.length + ' of ' + store.products.all().length + ' products';
      if (!list.length) {
        rowsEl.innerHTML = '<tr><td colspan="8">' + T.emptyState('Nothing here', 'No products match this filter. Try another tab or clear the search.', null) + '</td></tr>';
        return;
      }
      rowsEl.innerHTML = list.map(function (p) {
        var img = p.primaryImage || (p.images && p.images[0]) || T.FALLBACK_IMG;
        var out = p.availability === 'OUT_OF_STOCK' || p.status === 'OUT_OF_STOCK';
        var actions = '';
        if (p.status === 'TRASH') {
          actions = '<button type="button" data-act="restore" data-id="' + p.id + '">Restore</button>' +
            '<button type="button" class="danger" data-act="destroy" data-id="' + p.id + '">Delete forever</button>';
        } else {
          actions = '<a href="product-edit.html?id=' + p.id + '">Edit</a>' +
            '<a href="../product.html?slug=' + encodeURIComponent(p.slug) + '" target="_blank" rel="noopener">Preview</a>' +
            '<button type="button" data-act="trash" data-id="' + p.id + '">Trash</button>';
        }
        return '<tr>' +
          '<td><img class="thumb" src="' + esc(img) + '" alt="" width="52" height="64" loading="lazy"></td>' +
          '<td><span class="primary-name">' + esc(p.name) + '</span><div class="sub">' + esc(p.sku) + ' · ' + esc(p.slug) + '</div></td>' +
          '<td>' + esc(p.category) + (p.subcategory ? '<div class="sub">' + esc(p.subcategory) + '</div>' : '') + '</td>' +
          '<td class="mono">' + money(p.salePrice || p.price) + (p.salePrice ? '<div class="sub">was ' + money(p.price) + '</div>' : '') + '</td>' +
          '<td>' + statusBadge(p.status) + '</td>' +
          '<td>' + (out ? badge('Out of stock', 'badge--red') : badge('In stock', 'badge--green')) + '</td>' +
          '<td class="mono">' + num(p.sortOrder, 0) + '</td>' +
          '<td><div class="actions">' + actions + '</div></td>' +
        '</tr>';
      }).join('');
    }

    qsa('[data-products-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.tab = btn.getAttribute('data-products-tab');
        qsa('[data-products-tab]').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        render();
      });
    });
    var search = qs('[data-products-search]');
    if (search) search.addEventListener('input', function () { state.q = search.value.trim(); render(); });
    if (catSel) catSel.addEventListener('change', function () { state.cat = catSel.value; render(); });
    var sortSel = qs('[data-products-sort]');
    if (sortSel) sortSel.addEventListener('change', function () { state.sort = sortSel.value; render(); });

    rowsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var id = num(btn.getAttribute('data-id'), -1);
      var act = btn.getAttribute('data-act');
      if (act === 'trash') {
        confirmBox('Move to trash?', 'The product will stop appearing on the storefront. You can restore it from the Trash tab.', 'Move to trash').then(function (ok) {
          if (!ok) return;
          store.products.setStatus(id, 'TRASH');
          T.toast('Moved to trash', 'success');
          render();
        });
      } else if (act === 'restore') {
        store.products.restore(id);
        T.toast('Restored as draft', 'success');
        render();
      } else if (act === 'destroy') {
        confirmBox('Delete forever?', 'This permanently removes the product from this browser. This cannot be undone.', 'Delete forever').then(function (ok) {
          if (!ok) return;
          store.products.destroy(id);
          T.toast('Product deleted', 'success');
          render();
        });
      }
    });

    render();
  }

  /* ------------------------------------------------------- product editor */
  // V11: migrate bundled/local catalogue to the shared Supabase catalogue.
  (function initSharedCatalogueImport(){
    var btn = qs('[data-catalogue-import]');
    if (!btn || !window.TavishCatalogue || !window.TavishCatalogue.enabled) return;
    btn.hidden = false;
    btn.addEventListener('click', async function(){
      var original = btn.textContent; btn.disabled = true; btn.textContent = 'Publishing catalogue…';
      try { var count = await window.TavishCatalogue.importLocal(); T.toast(count + ' products sent to shared catalogue', 'success'); window.location.reload(); }
      catch(err) { T.toast(err.message || 'Catalogue import failed', 'error'); btn.disabled = false; btn.textContent = original; }
    });
  })();

  function initEditor() {
    var form = qs('[data-product-form]');
    if (!form) return;

    var isNew = !params().id;
    var product = isNew ? blankProduct() : store.products.get(params().id);
    var wrap = qs('[data-editor-wrap]');
    var missing = qs('[data-editor-missing]');

    if (!product) {
      if (wrap) wrap.hidden = true;
      if (missing) missing.hidden = false;
      return;
    }

    var images = (product.images || []).slice();
    var slugTouched = !isNew;
    var titleEl = qs('[data-admin-title]');
    if (titleEl) titleEl.textContent = isNew ? 'New product' : 'Edit product';

    /* fill fields */
    function set(name, value) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) el.value = value === null || value === undefined ? '' : value;
    }
    set('name', product.name);
    set('slug', product.slug);
    set('sku', product.sku);
    set('price', product.price);
    set('salePrice', product.salePrice || '');
    set('description', product.description);
    set('material', product.material);
    set('finish', product.finish);
    set('dimensions', product.dimensions);
    set('weight', product.weight);
    set('sortOrder', product.sortOrder);
    set('status', product.status);
    set('availability', product.availability);
    set('tags', (product.tags || []).join(', '));
    set('category', product.category);

    var slugInput = form.querySelector('[name="slug"]');
    if (slugInput) slugInput.addEventListener('input', function () { slugTouched = true; });

    var catSel = form.querySelector('[name="category"]');
    var subSel = form.querySelector('[name="subcategory"]');
    function fillCategories() {
      if (!catSel) return;
      catSel.innerHTML = store.categories.list().map(function (c) {
        return '<option value="' + esc(c.name) + '"' + (c.name === product.category ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('');
      fillSubs();
    }
    function fillSubs() {
      if (!subSel || !catSel) return;
      var cat = store.categories.list().filter(function (c) { return c.name === catSel.value; })[0];
      var subs = (cat && cat.subcategories) || [];
      subSel.innerHTML = '<option value="">None</option>' + subs.map(function (s) {
        return '<option value="' + esc(s.name) + '"' + (s.name === product.subcategory ? ' selected' : '') + '>' + esc(s.name) + '</option>';
      }).join('');
      if (subSel.value !== product.subcategory && isNew) subSel.value = product.subcategory || '';
    }
    if (catSel) catSel.addEventListener('change', function () {
      product.category = catSel.value;
      fillSubs();
      renderImages();
      renderChecklist();
    });
    fillCategories();

    function slugify(s) { return H.slugify(s); }

    /* image picker */
    var picker = qs('[data-image-picker]');
    var libGrid = qs('[data-lib-grid]');
    var libSearch = qs('[data-lib-search]');

    function renderImages() {
      if (!picker) return;
      if (!images.length) {
        picker.innerHTML = '<p class="form-note">No product photos selected yet. Upload at least one image to save this product.</p>';
        updateImageCount();
        return;
      }
      picker.innerHTML = images.map(function (src, i) {
        return '<div class="image-picker__item' + (i === 0 ? ' is-primary' : '') + '">' +
          (i === 0 ? '<span class="tag">Primary</span>' : '') +
          '<img src="' + esc(src) + '" alt="Image ' + (i + 1) + ' of ' + esc(product.name) + '" loading="lazy">' +
          '<div class="tools">' +
            '<button type="button" data-img="primary" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + '>Primary</button>' +
            '<button type="button" data-img="left" data-i="' + i + '"' + (i === 0 ? ' disabled' : '') + '>&larr;</button>' +
            '<button type="button" data-img="right" data-i="' + i + '"' + (i === images.length - 1 ? ' disabled' : '') + '>&rarr;</button>' +
            '<button type="button" data-img="remove" data-i="' + i + '">&times;</button>' +
          '</div>' +
        '</div>';
      }).join('');
      updateImageCount();
    }

    function updateImageCount() {
      var count = qs('[data-image-count]');
      if (count) count.textContent = images.length + ' of 4 images';
      var upload = qs('[data-product-upload-input]');
      if (upload) upload.disabled = images.length >= 4;
    }

    if (picker) {
      picker.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-img]');
        if (!btn) return;
        var i = num(btn.getAttribute('data-i'), 0);
        var act = btn.getAttribute('data-img');
        if (act === 'primary' && i > 0) { var m = images.splice(i, 1)[0]; images.unshift(m); }
        if (act === 'remove') images.splice(i, 1);
        if (act === 'left' && i > 0) { var t = images[i - 1]; images[i - 1] = images[i]; images[i] = t; }
        if (act === 'right' && i < images.length - 1) { var t2 = images[i + 1]; images[i + 1] = images[i]; images[i] = t2; }
        renderImages();
        renderChecklist();
      });
    }

    function renderLib() {
      if (!libGrid) return;
      var q = (libSearch && libSearch.value || '').trim().toLowerCase();
      var list = mediaLibrary().filter(function (p) { return !q || p.indexOf(q) > -1; });
      libGrid.innerHTML = list.map(function (src) {
        var used = images.indexOf(src) > -1;
        return '<button type="button" class="image-picker__item' + (used ? ' is-primary' : '') + '" data-lib-add="' + esc(src) + '" aria-label="Add ' + esc(src) + '">' +
          '<img src="' + esc(src) + '" alt="" loading="lazy">' +
        '</button>';
      }).join('');
    }
    if (libSearch) libSearch.addEventListener('input', renderLib);
    if (libGrid) {
      libGrid.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-lib-add]');
        if (!btn) return;
        var src = btn.getAttribute('data-lib-add');
        if (images.indexOf(src) > -1) { T.toast('Already added', 'error'); return; }
        if (images.length >= 4) { T.toast('Maximum 4 images per product. Remove one before adding another.', 'error'); return; }
        images.push(src);
        renderImages();
        renderChecklist();
        renderLib();
      });
    }
    var customBtn = qs('[data-lib-custom-add]');
    var customInput = qs('[data-lib-custom]');
    if (customBtn && customInput) {
      customBtn.addEventListener('click', function () {
        var src = customInput.value.trim();
        if (!src) return;
        if (images.indexOf(src) > -1) { T.toast('Already added', 'error'); return; }
        if (images.length >= 4) { T.toast('Maximum 4 images per product. Remove one before adding another.', 'error'); return; }
        images.push(src);
        customInput.value = '';
        renderImages();
        renderChecklist();
      });
    }

    /* upload product images: compress to keep localStorage use manageable */
    var uploadInput = qs('[data-product-upload-input]');
    var uploadStatus = qs('[data-upload-status]');
    function setUploadStatus(message, isError) {
      if (!uploadStatus) return;
      uploadStatus.textContent = message;
      uploadStatus.classList.toggle('is-error', !!isError);
      uploadStatus.classList.toggle('is-success', !isError);
    }
    function compressImage(file) {
      return new Promise(function (resolve, reject) {
        if (!file || !/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { reject(new Error('Choose a JPG, PNG, WebP, or GIF image.')); return; }
        if (file.size > 15 * 1024 * 1024) { reject(new Error(file.name + ' is larger than 15 MB.')); return; }
        var reader = new FileReader();
        reader.onerror = function () { reject(new Error('Could not read ' + file.name + '.')); };
        reader.onload = function () {
          var img = new Image();
          img.onerror = function () { reject(new Error('Could not decode ' + file.name + '.')); };
          img.onload = function () {
            var max = 1100, ratio = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
            var canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio));
            canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio));
            var ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Image compression is unavailable in this browser.')); return; }
            ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            var quality = 0.78, data = canvas.toDataURL('image/webp', quality);
            if (data.indexOf('data:image/webp') !== 0) data = canvas.toDataURL('image/jpeg', quality);
            while (data.length > 230000 && quality > 0.46) {
              quality -= 0.08;
              data = canvas.toDataURL(data.indexOf('data:image/webp') === 0 ? 'image/webp' : 'image/jpeg', quality);
            }
            if (data.length > 380000) { reject(new Error(file.name + ' could not be compressed enough. Try a smaller image.')); return; }
            resolve(data);
          };
          img.src = String(reader.result || '');
        };
        reader.readAsDataURL(file);
      });
    }
    if (uploadInput) uploadInput.addEventListener('change', async function () {
      var files = Array.prototype.slice.call(uploadInput.files || []);
      uploadInput.value = '';
      if (!files.length) return;
      var available = 4 - images.length;
      if (files.length > available) {
        setUploadStatus('You can add ' + available + ' more image(s). Maximum is 4 per product.', true);
        T.toast('Maximum 4 images per product', 'error');
        return;
      }
      uploadInput.disabled = true;
      setUploadStatus('Optimizing product photos…', false);
      try {
        for (var fi = 0; fi < files.length; fi++) {
          var dataUrl = await compressImage(files[fi]);
          images.push(dataUrl);
          renderImages();
          renderChecklist();
        }
        renderLib();
        setUploadStatus(files.length + ' image(s) added. Remember to save the product.', false);
      } catch (err) {
        setUploadStatus(err.message || 'Image upload failed.', true);
        T.toast(err.message || 'Image upload failed.', 'error');
      } finally {
        updateImageCount();
      }
    });

    /* checklist */
    var checkEl = qs('[data-publish-check]');
    function draft() { return collect(); }
    function renderChecklist() {
      if (!checkEl) return;
      var p = draft();
      var errs = store.products.validate(p);
      var items = [
        { ok: !!String(p.name || '').trim(), label: 'Product name' },
        { ok: !!String(p.sku || '').trim(), label: 'SKU' },
        { ok: !!p.category, label: 'Category' },
        { ok: num(p.price, 0) > 0, label: 'Price above ₹0' },
        { ok: (p.images || []).filter(function (i) { return i && String(i).trim(); }).length >= 1 && (p.images || []).length <= 4, label: '1–4 product images (' + (p.images || []).length + ' added)' },
        { ok: !p.salePrice || num(p.salePrice, 0) <= num(p.price, 0), label: 'Sale price ≤ price' },
        { ok: errs.length === 0, label: 'Ready to publish' }
      ];
      checkEl.innerHTML = items.map(function (i) {
        return '<li class="' + (i.ok ? 'is-ok' : 'is-bad') + '">' + esc(i.label) + '</li>';
      }).join('');
    }

    function collect() {
      function v(name) {
        var el = form.querySelector('[name="' + name + '"]');
        return el ? String(el.value || '').trim() : '';
      }
      var name = v('name');
      var catName = v('category');
      var cat = store.categories.list().filter(function (c) { return c.name === catName; })[0];
      var subName = v('subcategory');
      return {
        id: product.id,
        name: name,
        sku: v('sku'),
        slug: v('slug') || slugify(name),
        category: catName,
        categorySlug: cat ? cat.slug : slugify(catName),
        subcategory: subName,
        subcategorySlug: slugify(subName),
        description: v('description'),
        price: num(v('price'), 0),
        salePrice: v('salePrice') ? num(v('salePrice'), 0) : null,
        images: images.slice(),
        primaryImage: images[0] || '',
        material: v('material'),
        finish: v('finish'),
        dimensions: v('dimensions'),
        weight: v('weight'),
        availability: v('availability') || 'IN_STOCK',
        featured: !!form.querySelector('[name="featured"]').checked,
        newArrival: !!form.querySelector('[name="newArrival"]').checked,
        bestSeller: !!form.querySelector('[name="bestSeller"]').checked,
        tags: v('tags').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
        sortOrder: num(v('sortOrder'), 99),
        status: v('status') || 'DRAFT',
        createdAt: product.createdAt
      };
    }

    /* auto slug + live checklist */
    var nameInput = form.querySelector('[name="name"]');
    if (nameInput) nameInput.addEventListener('input', function () {
      if (!slugTouched && slugInput) slugInput.value = slugify(nameInput.value);
      renderChecklist();
    });
    form.addEventListener('input', renderChecklist);
    form.addEventListener('change', renderChecklist);

    /* flags as switches */
    qsa('[data-switch]').forEach(function (sw) {
      var name = sw.getAttribute('data-switch');
      var input = form.querySelector('[name="' + name + '"]');
      if (!input) return;
      input.checked = !!product[name];
      sw.setAttribute('aria-pressed', input.checked ? 'true' : 'false');
      sw.addEventListener('click', function () {
        input.checked = !input.checked;
        sw.setAttribute('aria-pressed', input.checked ? 'true' : 'false');
      });
    });

    var errBox = qs('[data-save-errors]');

    async function save() {
      var data = collect();
      if (!data.images.length || data.images.length > 4) {
        if (errBox) { errBox.hidden = false; errBox.textContent = !data.images.length ? 'Add at least one product image before saving.' : 'A maximum of four product images is allowed. Remove an image before saving.'; }
        T.toast(!data.images.length ? 'Add at least one product image' : 'Maximum 4 product images', 'error');
        return null;
      }
      // SKU and slug must remain unique so product lookup, cart links and
      // catalogue imports cannot silently point at the wrong product.
      var peers = store.products.all().filter(function (p) { return !product.id || p.id !== product.id; });
      var duplicateSku = peers.some(function (p) { return String(p.sku || '').trim().toLowerCase() === String(data.sku || '').trim().toLowerCase(); });
      var duplicateSlug = peers.some(function (p) { return String(p.slug || '').trim().toLowerCase() === String(data.slug || '').trim().toLowerCase(); });
      if (duplicateSku || duplicateSlug) {
        var duplicateMessage = duplicateSku && duplicateSlug ? 'This SKU and product URL are already used. Enter a unique SKU and URL.' : duplicateSku ? 'This SKU is already used by another product. Enter a unique SKU.' : 'This product URL is already used. Change the slug to a unique value.';
        if (errBox) { errBox.hidden = false; errBox.textContent = duplicateMessage; }
        T.toast(duplicateMessage, 'error');
        return null;
      }
      var errors = store.products.validate(data);
      var requested = data.status;
      if (errors.length && requested === 'ACTIVE') {
        data.status = 'DRAFT';
        if (errBox) {
          errBox.hidden = false;
          errBox.innerHTML = 'Saved as <strong>draft</strong> — resolve to publish: <ul style="margin: .4rem 0 0 1.1rem;">' +
            errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
        }
        T.toast('Saved as draft — publish requirements not met', 'error');
      } else {
        if (errBox) errBox.hidden = true;
      }
      var saved;
      try {
        if (isNew) {
          saved = store.products.create(data);
          if (!saved) throw new Error('The browser could not save this product. Storage may be full or unavailable. Export a catalogue backup, remove unused data, and try again.');
          isNew = false;
          product = saved;
          data.id = saved.id;
          try { window.history.replaceState(null, '', 'product-edit.html?id=' + saved.id); } catch (e) {}
        } else {
          saved = store.products.update(product.id, data);
          if (!saved) throw new Error('The browser could not update this product. Storage may be full or unavailable. Your changes have not been confirmed as saved.');
          product = saved;
        }
      } catch (saveError) {
        var saveMessage = saveError && saveError.message ? saveError.message : 'Could not save the product. Check browser storage and try again.';
        if (errBox) { errBox.hidden = false; errBox.textContent = saveMessage; }
        T.toast(saveMessage, 'error');
        return null;
      }
      if (window.TavishCatalogue && window.TavishCatalogue.enabled) {
        try {
          var remoteResult = await window.TavishCatalogue.saveProduct(saved);
          if (!remoteResult || !remoteResult.ok || !remoteResult.product) throw new Error('The shared catalogue did not confirm the save.');
          saved = remoteResult.product;
          product = saved;
          var localList = store.products.all().filter(function (item) { return item.sku !== saved.sku && item.id !== saved.id; });
          localList.push(saved);
          store.products.write(localList);
          T.toast('Product saved to the shared catalogue', 'success');
        } catch (remoteError) {
          var remoteMessage = 'Saved only in this browser — shared publishing failed: ' + (remoteError.message || 'unknown error') + '. Do not consider this published.';
          if (errBox) { errBox.hidden = false; errBox.textContent = remoteMessage; }
          T.toast('Shared publish failed', 'error');
          return null;
        }
      } else if (requested !== 'ACTIVE' || data.status === 'ACTIVE') {
        T.toast('Product saved in this browser only', 'success');
      }
      if (errBox && requested !== 'ACTIVE' && data.status === 'DRAFT') {
        errBox.hidden = false;
        errBox.textContent = 'Product saved as a draft. To show it in the storefront in this browser, resolve the publishing checklist and set Status to Active.';
      }
      renderChecklist();
      return saved;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      save();
    });

    var saveBtn = qs('[data-save-product]');
    if (saveBtn) saveBtn.addEventListener('click', function (e) { e.preventDefault(); save(); });

    var viewBtn = qs('[data-view-product]');
    if (viewBtn) viewBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var data = save();
      if (data && data.slug) window.open('../product.html?slug=' + encodeURIComponent(data.slug), '_blank');
    });

    var trashBtn = qs('[data-trash-product]');
    if (trashBtn) {
      trashBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (isNew) { T.toast('Nothing to trash yet', 'error'); return; }
        confirmBox('Move to trash?', 'This product will stop appearing on the storefront until restored.', 'Move to trash').then(function (ok) {
          if (!ok) return;
          store.products.setStatus(product.id, 'TRASH');
          T.toast('Moved to trash', 'success');
          window.location.replace('products.html');
        });
      });
    }

    renderImages();
    renderLib();
    renderChecklist();
  }

  function blankProduct() {
    return {
      id: 0, name: '', sku: '', slug: '', category: 'Earrings', categorySlug: 'earrings',
      subcategory: '', subcategorySlug: '', description: '', price: 0, salePrice: null,
      images: [], primaryImage: '', material: '', finish: '', dimensions: '', weight: '',
      availability: 'IN_STOCK', featured: false, newArrival: false, bestSeller: false,
      tags: [], sortOrder: 99, status: 'DRAFT', createdAt: new Date().toISOString()
    };
  }

  /* ---------------------------------------------------------- categories */
  function initCategories() {
    var listEl = qs('[data-categories-list]');
    if (!listEl) return;
    var openId = null;

    function productCount(slug) {
      return store.products.all().filter(function (p) { return p.categorySlug === slug; }).length;
    }

    function render() {
      var cats = store.categories.list();
      if (!cats.length) {
        listEl.innerHTML = T.emptyState('No categories', 'Add your first category to structure the shop.', null);
        return;
      }
      listEl.innerHTML = cats.map(function (c, idx) {
        var count = productCount(c.slug);
        var open = openId === c.id;
        return '<div class="panel" data-cat="' + esc(c.id) + '">' +
          '<div class="panel__head">' +
            '<div><strong class="primary-name">' + esc(c.name) + '</strong> ' + (c.visible ? badge('Visible', 'badge--green') : badge('Hidden', 'badge--ink')) +
              '<div class="sub">' + esc(c.slug) + ' · ' + count + ' products · ' + ((c.subcategories) || []).length + ' subcategories</div></div>' +
            '<div class="row">' +
              '<button class="btn btn--outline btn--small" type="button" data-cat-toggle="' + esc(c.id) + '">' + (open ? 'Close' : 'Edit') + '</button>' +
              '<button class="btn btn--outline btn--small" type="button" data-cat-up="' + esc(c.id) + '"' + (idx === 0 ? ' disabled' : '') + '>&uarr;</button>' +
              '<button class="btn btn--outline btn--small" type="button" data-cat-down="' + esc(c.id) + '"' + (idx === cats.length - 1 ? ' disabled' : '') + '>&darr;</button>' +
            '</div>' +
          '</div>' +
          (open ? editForm(c, count) : '') +
        '</div>';
      }).join('');
    }

    function editForm(c, count) {
      var subs = c.subcategories || [];
      return '<div class="panel__body">' +
        '<form data-cat-form="' + esc(c.id) + '">' +
          '<div class="form-row">' +
            '<label class="field"><span class="field__label">Name</span><input class="input" name="name" value="' + esc(c.name) + '" required></label>' +
            '<label class="field"><span class="field__label">Slug</span><input class="input" name="slug" value="' + esc(c.slug) + '" required></label>' +
          '</div>' +
          '<label class="field"><span class="field__label">Description</span><textarea class="textarea" name="description" rows="2">' + esc(c.description || '') + '</textarea></label>' +
          '<div class="form-row">' +
            '<label class="field"><span class="field__label">Sort order</span><input class="input" type="number" name="sortOrder" value="' + num(c.sortOrder, 0) + '"></label>' +
            '<label class="field"><span class="field__label">Visibility</span><select class="select" name="visible"><option value="1"' + (c.visible !== false ? ' selected' : '') + '>Visible in shop</option><option value="0"' + (c.visible === false ? ' selected' : '') + '>Hidden</option></select></label>' +
          '</div>' +
          '<div class="field"><span class="field__label">Subcategories</span>' +
            '<div class="stack stack--sm" data-subs>' +
              subs.map(function (s, i) {
                return '<div class="row"><input class="input" data-sub="' + i + '" value="' + esc(s.name) + '">' +
                  '<button class="btn btn--outline btn--small" type="button" data-sub-remove="' + i + '">Remove</button></div>';
              }).join('') +
            '</div>' +
            '<div class="row mt-4"><input class="input" data-sub-new placeholder="Add subcategory name">' +
            '<button class="btn btn--outline btn--small" type="button" data-sub-add>+ Add</button></div>' +
          '</div>' +
          '<div class="row mt-5">' +
            '<button class="btn btn--gold btn--small" type="submit">Save category</button>' +
            '<button class="btn btn--outline btn--small" type="button" data-cat-delete="' + esc(c.id) + '"' + (count ? ' disabled' : '') + '>Delete</button>' +
            (count ? '<span class="form-note">Delete blocked — ' + count + ' products use this category.</span>' : '') +
          '</div>' +
        '</form>' +
      '</div>';
    }

    function persist(msg, list) {
      store.categories.save(list || store.categories.list());
      T.toast(msg, 'success');
      render();
    }

    listEl.addEventListener('click', function (e) {
      var t = e.target;
      var el;
      if ((el = t.closest('[data-cat-toggle]'))) { openId = openId === el.getAttribute('data-cat-toggle') ? null : el.getAttribute('data-cat-toggle'); render(); return; }
      if ((el = t.closest('[data-cat-up]')) || (el = t.closest('[data-cat-down]'))) {
        var id = el.getAttribute('data-cat-up') || el.getAttribute('data-cat-down');
        var up = el.hasAttribute('data-cat-up');
        var cats = store.categories.list();
        var i = cats.findIndex(function (c) { return c.id === id; });
        var j = up ? i - 1 : i + 1;
        if (i > -1 && j >= 0 && j < cats.length) {
          var tmp = cats[i]; cats[i] = cats[j]; cats[j] = tmp;
          cats.forEach(function (c, k) { c.sortOrder = k + 1; });
          store.categories.save(cats);
          render();
        }
        return;
      }
      if ((el = t.closest('[data-sub-remove]'))) {
        var form = el.closest('[data-cat-form]');
        var idx = num(el.getAttribute('data-sub-remove'), -1);
        var inputs = qsa('[data-sub]', form);
        if (inputs[idx]) { inputs[idx].parentNode.removeChild(inputs[idx]); }
        return;
      }
      if ((el = t.closest('[data-sub-add]'))) {
        var f2 = el.closest('[data-cat-form]');
        var input = qs('[data-sub-new]', f2);
        if (!input || !input.value.trim()) return;
        var row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = '<input class="input" data-sub="new" value="' + esc(input.value.trim()) + '">' +
          '<button class="btn btn--outline btn--small" type="button" data-sub-remove="new">Remove</button>';
        qs('[data-subs]', f2).appendChild(row);
        input.value = '';
        return;
      }
      if ((el = t.closest('[data-cat-delete]'))) {
        var catId = el.getAttribute('data-cat-delete');
        confirmBox('Delete category?', 'Only empty categories can be deleted. Products keep their stored category value.', 'Delete').then(function (ok) {
          if (!ok) return;
          var cats2 = store.categories.list().filter(function (c) { return c.id !== catId; });
          store.categories.save(cats2);
          openId = null;
          render();
        });
      }
    });

    listEl.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-cat-form]');
      if (!form) return;
      e.preventDefault();
      var id = form.getAttribute('data-cat-form');
      var cats = store.categories.list();
      var cat = cats.filter(function (c) { return c.id === id; })[0];
      if (!cat) return;
      cat.name = form.querySelector('[name="name"]').value.trim() || cat.name;
      cat.slug = H.slugify(form.querySelector('[name="slug"]').value || cat.name);
      cat.description = form.querySelector('[name="description"]').value.trim();
      cat.sortOrder = num(form.querySelector('[name="sortOrder"]').value, cat.sortOrder);
      cat.visible = form.querySelector('[name="visible"]').value === '1';
      var names = qsa('[data-sub]', form).map(function (i) { return i.value.trim(); }).filter(Boolean);
      cat.subcategories = names.map(function (n, i) {
        var prev = (cat.subcategories || []).filter(function (s) { return s.name === n; })[0];
        return prev || { id: 'sub-' + cat.slug + '-' + H.slugify(n), name: n, slug: H.slugify(n), sortOrder: i + 1, visible: true };
      });
      persist('Category saved', cats);
    });

    var addForm = qs('[data-cat-add]');
    if (addForm) {
      addForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = addForm.querySelector('[name="name"]').value.trim();
        if (!name) { T.toast('Enter a category name', 'error'); return; }
        var cats = store.categories.list();
        var slug = H.slugify(name);
        if (cats.some(function (c) { return c.slug === slug; })) { T.toast('That category already exists', 'error'); return; }
        cats.push({
          id: 'cat-' + slug + '-' + Date.now().toString(36),
          name: name, slug: slug, description: '', image: '', sortOrder: cats.length + 1, visible: true, subcategories: []
        });
        store.categories.save(cats);
        addForm.reset();
        openId = cats[cats.length - 1].id;
        render();
        T.toast('Category added', 'success');
      });
    }

    render();
  }

  /* --------------------------------------------------------------- media */
  function initMedia() {
    var grid = qs('[data-media-grid]');
    if (!grid) return;
    var search = qs('[data-media-search]');
    var countEl = qs('[data-media-count]');

    function render() {
      var q = (search && search.value || '').trim().toLowerCase();
      var list = mediaLibrary().filter(function (p) { return !q || p.indexOf(q) > -1; });
      if (countEl) countEl.textContent = list.length + ' files';
      grid.innerHTML = list.map(function (src) {
        var used = mediaUsage(src);
        return '<div class="media-card">' +
          '<img src="' + esc(src) + '" alt="" loading="lazy">' +
          '<div class="media-card__body">' +
            '<strong>' + esc(src.split('/').pop()) + '</strong>' +
            (used ? used + ' product' + (used === 1 ? '' : 's') + ' using this' : 'unused') +
            '<div class="row mt-4"><button class="btn btn--outline btn--small" type="button" data-copy="' + esc(src) + '">Copy path</button>' +
            '<a class="btn btn--outline btn--small" href="../' + esc(src) + '" target="_blank" rel="noopener">Open</a></div>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    if (search) search.addEventListener('input', render);
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]');
      if (!btn) return;
      var val = btn.getAttribute('data-copy');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(function () { T.toast('Path copied', 'success'); }, function () { T.toast(val, 'success'); });
      } else {
        T.toast(val, 'success');
      }
    });
    render();
  }

  /* -------------------------------------------------------------- orders */
  function initOrders() {
    var rowsEl = qs('[data-orders-rows]');
    if (!rowsEl) return;
    var state = { q: '', status: '' };
    var countEl = qs('[data-orders-count]');
    var statusSel = qs('[data-orders-status]');
    var search = qs('[data-orders-search]');

    function filtered() {
      var list = store.orders.all().slice(0);
      if (state.status) list = list.filter(function (o) { return o.status === state.status; });
      if (state.q) {
        var q = state.q.toLowerCase();
        list = list.filter(function (o) {
          var hay = [o.id, o.customer && o.customer.name, o.customer && o.customer.mobile, o.customer && o.customer.email]
            .join(' ').toLowerCase();
          return hay.indexOf(q) > -1;
        });
      }
      return list;
    }

    function render() {
      var list = filtered();
      if (countEl) countEl.textContent = list.length + ' of ' + store.orders.all().length + ' orders';
      if (!list.length) {
        rowsEl.innerHTML = '<tr><td colspan="8">' + T.emptyState('No orders match', 'Adjust the search or status filter. Orders placed through the storefront appear here.', null) + '</td></tr>';
        return;
      }
      rowsEl.innerHTML = list.map(function (o) {
        var items = num(o.items && o.items.length, 0);
        return '<tr>' +
          '<td class="mono"><a href="order-detail.html?id=' + encodeURIComponent(o.id) + '"><strong>' + esc(o.id) + '</strong></a><div class="sub">' + esc(fmtDate(o.date || o.createdAt)) + '</div></td>' +
          '<td>' + esc(o.customer && o.customer.name || '—') + '<div class="sub">' + esc(o.customer && o.customer.mobile || '') + '</div></td>' +
          '<td>' + esc((o.address && [o.address.city, o.address.state].filter(Boolean).join(', ')) || '—') + '</td>' +
          '<td>' + items + '</td>' +
          '<td class="mono">' + money(o.total) + '</td>' +
          '<td>' + esc(o.paymentMethod || 'COD') + '</td>' +
          '<td>' + orderBadge(o.status) + '</td>' +
          '<td><div class="actions"><a href="order-detail.html?id=' + encodeURIComponent(o.id) + '">Open</a>' +
            '<a class="wa" href="' + esc(H.whatsappLink('Hello, following up on your TAVISH & CO. order ' + o.id + '.')) + '" target="_blank" rel="noopener">WhatsApp</a></div></td>' +
        '</tr>';
      }).join('');
    }

    if (search) search.addEventListener('input', function () { state.q = search.value.trim(); render(); });
    if (statusSel) statusSel.addEventListener('change', function () { state.status = statusSel.value; render(); });

    var exportBtn = qs('[data-orders-export]');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var rows = [['Order ID', 'Date', 'Status', 'Customer', 'Mobile', 'Email', 'Address', 'Items', 'Subtotal', 'Shipping', 'Total', 'Payment']];
        filtered().forEach(function (o) {
          rows.push([o.id, o.date || o.createdAt, o.status, o.customer && o.customer.name, o.customer && o.customer.mobile,
            o.customer && o.customer.email,
            [o.address && o.address.line1, o.address && o.address.city, o.address && o.address.state, o.address && o.address.pin].filter(Boolean).join(', '),
            (o.items || []).length, o.subtotal, o.shipping, o.total, o.paymentMethod]);
        });
        download('tavish-orders.csv', toCsv(rows));
        T.toast('CSV export downloaded', 'success');
      });
    }

    render();
  }

  function initOrderDetail() {
    var wrap = qs('[data-order-wrap]');
    if (!wrap) return;
    var id = params().id;
    var order = id ? store.orders.get(id) : null;
    if (!order) {
      wrap.hidden = true;
      var missing = qs('[data-order-missing]');
      if (missing) missing.hidden = false;
      return;
    }

    var titleEl = qs('[data-admin-title]');
    if (titleEl) titleEl.textContent = 'Order ' + order.id;

    var head = qs('[data-order-head]');
    if (head) {
      head.innerHTML = '<div><strong class="primary-name">' + esc(order.id) + '</strong> ' + orderBadge(order.status) +
        '<div class="sub">' + esc(fmtDate(order.date || order.createdAt)) + ' · ' + esc(order.paymentMethod || 'COD') + '</div></div>' +
        '<div class="row"><a class="btn btn--outline btn--small" href="orders.html">Back to orders</a>' +
        '<a class="btn btn--gold btn--small" href="' + esc(H.whatsappLink('Hello ' + (order.customer && order.customer.name || '') + ', this is TAVISH & CO. regarding your order ' + order.id + '.')) + '" target="_blank" rel="noopener">WhatsApp customer</a></div>';
    }

    var cust = qs('[data-order-customer]');
    if (cust) {
      cust.innerHTML =
        '<div class="contact-detail"><svg width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-user"></use></svg><div><strong>Customer</strong><span>' + esc(order.customer && order.customer.name || '—') + '</span></div></div>' +
        '<div class="contact-detail"><svg width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-phone"></use></svg><div><strong>Mobile</strong><span>' + esc(order.customer && order.customer.mobile || '—') + '</span></div></div>' +
        '<div class="contact-detail"><svg width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-mail"></use></svg><div><strong>Email</strong><span>' + esc(order.customer && order.customer.email || '—') + '</span></div></div>' +
        '<div class="contact-detail"><svg width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-pin"></use></svg><div><strong>Delivery address</strong><span>' +
          esc([order.address && order.address.line1, order.address && order.address.city, order.address && order.address.state, order.address && order.address.pin].filter(Boolean).join(', ') || '—') +
        '</span></div></div>' +
        '<div class="contact-detail"><svg width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-receipt"></use></svg><div><strong>Order notes</strong><span>' + esc(order.notes || '—') + '</span></div></div>';
    }

    var itemsEl = qs('[data-order-items]');
    if (itemsEl) {
      itemsEl.innerHTML = (order.items || []).map(function (i) {
        var img = i.image || T.FALLBACK_IMG;
        var unit = i.salePrice || i.price;
        return '<tr>' +
          '<td><img class="thumb" src="' + esc(img) + '" alt="" width="52" height="64" loading="lazy"></td>' +
          '<td><span class="primary-name">' + esc(i.name) + '</span><div class="sub">' + esc(i.sku || '') + '</div></td>' +
          '<td class="mono">' + money(unit) + '</td>' +
          '<td class="mono">' + num(i.qty, 1) + '</td>' +
          '<td class="mono">' + money(unit * num(i.qty, 1)) + '</td>' +
        '</tr>';
      }).join('');
    }

    var totals = qs('[data-order-totals]');
    if (totals) {
      totals.innerHTML =
        '<div class="summary__row"><span>Subtotal</span><span>' + money(order.subtotal) + '</span></div>' +
        '<div class="summary__row"><span>Shipping</span><span>' + (num(order.shipping, 0) === 0 ? 'FREE' : money(order.shipping)) + '</span></div>' +
        '<div class="summary__row summary__row--total"><span>Total (' + esc(order.paymentMethod || 'COD') + ')</span><span>' + money(order.total) + '</span></div>';
    }

    var statusForm = qs('[data-status-form]');
    if (statusForm) {
      var sel = statusForm.querySelector('[name="status"]');
      if (sel) sel.value = order.status;
      var track = statusForm.querySelector('[name="tracking"]');
      if (track) track.value = order.tracking || '';
      statusForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var newStatus = sel.value;
        store.orders.setStatus(order.id, newStatus, track.value.trim());
        T.toast('Status updated to ' + (ORDER_LABELS[newStatus] || newStatus), 'success');
        order = store.orders.get(order.id);
        if (head) initOrderDetailHeadRefresh(order);
        var badgeEl = qs('[data-order-head] .badge');
        if (badgeEl) badgeEl.outerHTML = orderBadge(order.status);
      });
    }
  }

  function initOrderDetailHeadRefresh(order) { /* head refresh handled by badge swap */ }

  /* ---------------------------------------------------------- newsletter */
  function initNewsletter() {
    var listEl = qs('[data-newsletter-list]');
    if (!listEl) return;
    var countEl = qs('[data-newsletter-count]');
    var search = qs('[data-newsletter-search]');

    function filtered() {
      var list = store.newsletter.list().slice(0);
      var q = (search && search.value || '').trim().toLowerCase();
      if (q) list = list.filter(function (s) { return s.email.toLowerCase().indexOf(q) > -1; });
      return list.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });
    }

    function render() {
      var list = filtered();
      if (countEl) countEl.textContent = list.length + ' subscriber' + (list.length === 1 ? '' : 's');
      if (!list.length) {
        listEl.innerHTML = '<tr><td colspan="3">' + T.emptyState('No subscribers yet', 'Newsletter sign-ups from the storefront appear here, stored in this browser.', null) + '</td></tr>';
        return;
      }
      listEl.innerHTML = list.map(function (s, i) {
        return '<tr>' +
          '<td>' + esc(s.email) + '</td>' +
          '<td class="mono">' + esc(fmtDate(s.at)) + '</td>' +
          '<td><div class="actions"><button type="button" data-nl-remove="' + i + '">Remove</button></div></td>' +
        '</tr>';
      }).join('');
    }

    if (search) search.addEventListener('input', render);
    listEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-nl-remove]');
      if (!btn) return;
      var email = filtered()[num(btn.getAttribute('data-nl-remove'), -1)];
      if (!email) return;
      var all = store.newsletter.list().filter(function (s) { return s.email !== email.email; });
      store.write(store.KEYS.newsletter, all);
      T.toast('Subscriber removed', 'success');
      render();
    });

    var exportBtn = qs('[data-newsletter-export]');
    if (exportBtn) exportBtn.addEventListener('click', function () {
      var rows = [['Email', 'Subscribed at']];
      store.newsletter.list().forEach(function (s) { rows.push([s.email, s.at]); });
      download('tavish-newsletter.csv', toCsv(rows));
      T.toast('CSV export downloaded', 'success');
    });

    var clearBtn = qs('[data-newsletter-clear]');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      confirmBox('Clear all subscribers?', 'This removes every saved subscriber from this browser.', 'Clear list').then(function (ok) {
        if (!ok) return;
        store.write(store.KEYS.newsletter, []);
        T.toast('Subscriber list cleared', 'success');
        render();
      });
    });

    render();
  }

  /* ------------------------------------------------------------ settings */
  function setPath(obj, path, value) {
    var parts = path.split('.');
    var node = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
  }

  function initSettings() {
    var settings = store.settings.get();

    qsa('[data-setting]').forEach(function (el) {
      var path = el.getAttribute('data-setting');
      var node = settings;
      path.split('.').forEach(function (k) { node = node ? node[k] : undefined; });
      if (el.type === 'checkbox') el.checked = !!node;
      else el.value = node === undefined || node === null ? '' : node;
    });

    qsa('[data-settings-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var patch = {};
        qsa('[data-setting]', form).forEach(function (el) {
          var path = el.getAttribute('data-setting');
          var value;
          if (el.type === 'checkbox') value = el.checked;
          else if (el.type === 'number') value = num(el.value, 0);
          else value = el.value;
          setPath(patch, path, value);
        });
        store.settings.save(patch);
        T.toast('Settings saved', 'success');
      });
    });

    var exportBtn = qs('[data-backup-export]');
    if (exportBtn) exportBtn.addEventListener('click', function () {
      var data = JSON.stringify(store.backup.exportAll(), null, 2);
      download('tavish-backup-' + new Date().toISOString().slice(0, 10) + '.json', data, 'application/json');
      T.toast('Backup downloaded', 'success');
    });

    var importBtn = qs('[data-backup-import]');
    var importArea = qs('[data-backup-json]');
    if (importBtn && importArea) {
      importBtn.addEventListener('click', function () {
        var raw = importArea.value.trim();
        if (!raw) { T.toast('Paste a backup JSON first', 'error'); return; }
        var data;
        try { data = JSON.parse(raw); } catch (e) { T.toast('That is not valid JSON', 'error'); return; }
        confirmBox('Restore this backup?', 'Products, categories, orders and settings in the backup will replace the current browser data.', 'Restore').then(function (ok) {
          if (!ok) return;
          var res = store.backup.restore(data);
          if (res.error) { T.toast(res.error, 'error'); return; }
          T.toast('Backup restored: ' + (res.applied || []).join(', '), 'success');
          window.setTimeout(function () { window.location.reload(); }, 600);
        });
      });
    }

    var fileInput = qs('[data-backup-file]');
    if (fileInput && importArea) {
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () { importArea.value = String(reader.result || ''); };
        reader.readAsText(file);
      });
    }

    var resetBtn = qs('[data-backup-reset]');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      confirmBox('Factory reset this browser?', 'This removes local orders, newsletter entries, audit history, cart, wishlist and admin session, then restores the initial catalogue and category structure. This cannot be undone.', 'Factory reset').then(function (ok) {
        if (!ok) return;
        store.localData.factoryReset();
        T.toast('Local store reset', 'success');
        window.setTimeout(function () { window.location.replace('login.html'); }, 600);
      });
    });

    qsa('[data-clear-orders]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        confirmBox('Clear all local orders?', 'This removes every order stored in this browser. Export a backup first if you need a copy.', 'Clear orders').then(function (ok) {
          if (!ok) return;
          store.localData.clearOrders();
          T.toast('Orders cleared', 'success');
          window.setTimeout(function () { window.location.reload(); }, 400);
        });
      });
    });

    qsa('[data-clear-audit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        confirmBox('Clear audit log?', 'This permanently removes the local audit history from this browser.', 'Clear audit log').then(function (ok) {
          if (!ok) return;
          store.localData.clearAudit();
          T.toast('Audit log cleared', 'success');
          window.setTimeout(function () { window.location.reload(); }, 400);
        });
      });
    });

    var importCat = qs('[data-catalogue-import]');
    var importCatArea = qs('[data-catalogue-json]');
    if (importCat && importCatArea) {
      importCat.addEventListener('click', function () {
        var raw = importCatArea.value.trim();
        if (!raw) { T.toast('Paste catalogue JSON first', 'error'); return; }
        var data;
        try { data = JSON.parse(raw); } catch (e) { T.toast('That is not valid JSON', 'error'); return; }
        confirmBox('Import catalogue?', 'Matching SKUs will be updated; new SKUs will be added.', 'Import').then(function (ok) {
          if (!ok) return;
          var res = store.backup.importCatalogue(data);
          if (res.error) { T.toast(res.error, 'error'); return; }
          T.toast('Imported: ' + res.added + ' added, ' + res.updated + ' updated', 'success');
          importCatArea.value = '';
        });
      });
    }
  }

  /* --------------------------------------------------------------- audit */
  function initAudit() {
    var listEl = qs('[data-audit-list]');
    if (!listEl) return;
    var countEl = qs('[data-audit-count]');
    var search = qs('[data-audit-search]');

    function filtered() {
      var list = store.audit.list();
      var q = (search && search.value || '').trim().toLowerCase();
      if (q) list = list.filter(function (e) { return (e.action + ' ' + (e.detail || '') + ' ' + (e.actor || '')).toLowerCase().indexOf(q) > -1; });
      return list;
    }

    function render() {
      var list = filtered();
      if (countEl) countEl.textContent = list.length + ' entries';
      listEl.innerHTML = list.length ? list.map(auditItem).join('')
        : '<div class="audit-item"><span>No matching activity.</span></div>';
    }

    if (search) search.addEventListener('input', render);
    var clearBtn = qs('[data-audit-clear]');
    if (clearBtn) clearBtn.addEventListener('click', function () {
      confirmBox('Clear the audit log?', 'All recorded activity in this browser will be removed.', 'Clear log').then(function (ok) {
        if (!ok) return;
        store.audit.clear();
        render();
        T.toast('Audit log cleared', 'success');
      });
    });
    render();
  }

  /* ------------------------------------------------------------ dispatch */
  if (PAGE === 'login') {
    initLogin();
    return;
  }

  if (!(window.TavishCatalogue && window.TavishCatalogue.enabled && window.TavishCatalogue.isAdmin())) {
    window.location.replace('login.html?next=' + encodeURIComponent('admin/' + currentFile()));
    return;
  }

  initShell();
  if (PAGE === 'dashboard') initDashboard();
  else if (PAGE === 'products') initProducts();
  else if (PAGE === 'product-edit') initEditor();
  else if (PAGE === 'categories') initCategories();
  else if (PAGE === 'media') initMedia();
  else if (PAGE === 'orders') initOrders();
  else if (PAGE === 'order-detail') initOrderDetail();
  else if (PAGE === 'newsletter') initNewsletter();
  else if (PAGE === 'settings') initSettings();
  else if (PAGE === 'audit') initAudit();
})(window, document);
