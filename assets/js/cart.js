/*!
 * TAVISH & CO. — cart, COD checkout and order confirmation
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;
  var H = store.helpers;

  var itemsBox = T.qs('[data-cart-items]');
  if (!itemsBox) return;

  var views = {
    cart: T.qs('[data-view="cart"]'),
    checkout: T.qs('[data-view="checkout"]'),
    success: T.qs('[data-view="success"]')
  };
  var stepEls = T.qsa('[data-steps] li');
  var titleEl = T.qs('[data-page-title]');
  var ledeEl = T.qs('[data-page-lede]');
  var proceedBtn = T.qs('[data-go-checkout]');
  var form = T.qs('[data-checkout-form]');
  var errorBox = T.qs('[data-checkout-error]');
  var view = 'cart';

  var COPY = {
    cart: {
      title: 'Your bag',
      lede: 'Cash on delivery, dispatch from Pune in 2 – 4 working days, free shipping above ₹2,499.'
    },
    checkout: {
      title: 'Checkout',
      lede: 'Delivery and payment details for your cash-on-delivery order.'
    },
    success: {
      title: 'Order placed',
      lede: 'Your order has been saved in this browser.'
    }
  };
  var STEP = { cart: 1, checkout: 2, success: 3 };

  function money(n) { return T.money(n); }

  function commerce() { return store.settings.get().commerce || {}; }

  function setView(name) {
    if (!views[name]) return;
    view = name;
    Object.keys(views).forEach(function (key) {
      if (views[key]) views[key].hidden = key !== name;
    });
    stepEls.forEach(function (li, i) {
      if (i + 1 === STEP[name]) li.classList.add('is-active');
      else li.classList.remove('is-active');
    });
    if (titleEl) titleEl.textContent = COPY[name].title;
    if (ledeEl) ledeEl.textContent = COPY[name].lede;
    document.title = COPY[name].title + ' | TAVISH & CO.';
    if (name !== 'success' && window.scrollTo) {
      try { window.scrollTo(0, 0); } catch (e) { /* noop */ }
    }
  }

  function lineUnit(i) { return i.salePrice ? i.salePrice : i.price; }

  function itemRow(i) {
    var unit = lineUnit(i);
    var onSale = i.salePrice && i.salePrice < i.price;
    var out = i.availability === 'OUT_OF_STOCK';
    return '<article class="cart-item">' +
      '<a class="cart-item__media" href="' + T.productUrl(i) + '" aria-label="' + T.esc(i.name) + '">' +
        '<img src="' + T.esc(i.image || T.FALLBACK_IMG) + '" alt="' + T.esc(i.name) + '" width="220" height="275" loading="lazy">' +
      '</a>' +
      '<div class="cart-item__body">' +
        '<a class="cart-item__name" href="' + T.productUrl(i) + '">' + T.esc(i.name) + '</a>' +
        '<p class="cart-item__meta">SKU ' + T.esc(i.sku || '') + (out ? ' · Out of stock' : '') + '</p>' +
        '<div class="cart-item__controls">' +
          '<div class="qty" data-qty-for="' + i.productId + '">' +
            '<button type="button" data-qty-btn="minus" aria-label="Decrease quantity of ' + T.esc(i.name) + '">&minus;</button>' +
            '<input type="number" data-cart-qty value="' + T.esc(i.qty) + '" min="1" max="10" aria-label="Quantity for ' + T.esc(i.name) + '">' +
            '<button type="button" data-qty-btn="plus" aria-label="Increase quantity of ' + T.esc(i.name) + '">+</button>' +
          '</div>' +
          '<button class="cart-link" type="button" data-cart-remove="' + i.productId + '">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="cart-item__side">' +
        '<span class="cart-item__price">' + money(unit * (i.qty || 1)) + '</span>' +
        (onSale ? '<span class="cart-link">Was ' + money(i.price) + '</span>' : '') +
        '<a class="cart-link" href="' + T.productUrl(i) + '">View</a>' +
      '</div>' +
    '</article>';
  }

  function renderItems() {
    var items = store.cart.items();
    if (!items.length) {
      itemsBox.innerHTML = T.emptyState(
        'Your bag is empty',
        'Discover anti-tarnish essentials, Korean-inspired edits and festive heirlooms.',
        { label: 'Start shopping', href: 'shop.html' }
      );
      if (proceedBtn) proceedBtn.disabled = true;
      if (view === 'checkout') setView('cart');
    } else {
      itemsBox.innerHTML = items.map(itemRow).join('');
      if (proceedBtn) proceedBtn.disabled = false;
    }
    renderSummaries();
  }

  function fillSummary(box, data) {
    T.qsa('[data-sum]', box).forEach(function (el) {
      var key = el.getAttribute('data-sum');
      if (data[key] !== undefined) el.textContent = data[key];
    });
  }

  function renderSummaries() {
    var c = commerce();
    var sub = store.cart.subtotal();
    var ship = store.cart.shipping();
    var total = store.cart.total();
    var count = store.cart.count();
    var freeAbove = c.freeShippingAbove || 0;
    var note;
    if (sub > 0 && ship === 0) note = 'Free shipping unlocked for your order.';
    else if (sub === 0) note = freeAbove ? 'Free shipping above ' + money(freeAbove) + '.' : '';
    else note = 'Add ' + money(freeAbove - sub) + ' more to unlock free shipping.';

    T.qsa('[data-summary]').forEach(function (box) {
      fillSummary(box, {
        count: String(count),
        subtotal: money(sub),
        shipping: sub > 0 && ship === 0 ? 'FREE' : money(ship),
        total: money(total)
      });
      var noteEl = T.qs('[data-sum="note"]', box);
      if (noteEl) noteEl.textContent = note;
    });
  }

  /* ------------------------------------------------------------ cart edits */
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || !input.matches || !input.matches('[data-cart-qty]')) return;
    var wrap = input.closest ? input.closest('.qty') : null;
    if (!wrap) return;
    store.cart.setQty(wrap.getAttribute('data-qty-for'), parseInt(input.value, 10) || 1);
  });

  document.addEventListener('click', function (e) {
    var rm = e.target.closest ? e.target.closest('[data-cart-remove]') : null;
    if (rm) {
      store.cart.remove(rm.getAttribute('data-cart-remove'));
      T.toast('Removed from your bag', 'success');
      return;
    }
    if (proceedBtn && e.target === proceedBtn) {
      if (!store.cart.items().length) { T.toast('Your bag is empty.', 'error'); return; }
      setView('checkout');
      var first = form ? T.qs('input', form) : null;
      if (first) first.focus();
      return;
    }
    var back = e.target.closest ? e.target.closest('[data-back-to-bag]') : null;
    if (back) setView('cart');
  });

  window.addEventListener('tavish:cart', renderItems);

  /* -------------------------------------------------------------- checkout */
  function fieldOf(input) { return input ? (input.closest('.field') || input.closest('label')) : null; }

  function mark(input, ok) {
    if (!input) return false;
    var f = fieldOf(input);
    if (f) {
      if (ok) f.classList.remove('is-invalid');
      else f.classList.add('is-invalid');
    }
    return ok;
  }

  function showError(msg) {
    if (!errorBox) return;
    if (msg) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
      try { if (errorBox.scrollIntoView) errorBox.scrollIntoView({ block: 'center' }); } catch (err) { /* noop */ }
    } else {
      errorBox.hidden = true;
      errorBox.textContent = '';
    }
  }

  function validate() {
    var data = {};
    var issues = [];
    var firstBad = null;
    function grab(name) { var el = form.querySelector('[name="' + name + '"]'); data[name] = el ? String(el.value || '').trim() : ''; return el; }

    var nameEl = grab('name');
    if (!mark(nameEl, data.name.length >= 2)) { issues.push('full name'); firstBad = firstBad || nameEl; }

    var mobEl = grab('mobile');
    var mobOk = /^[6-9]\d{9}$/.test(data.mobile.replace(/\D/g, '')) && data.mobile.replace(/\D/g, '').length === 10;
    if (!mark(mobEl, mobOk)) { issues.push('mobile number'); firstBad = firstBad || mobEl; }

    var mailEl = grab('email');
    var mailOk = !data.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email);
    if (!mark(mailEl, mailOk)) { issues.push('email address'); firstBad = firstBad || mailEl; }

    var pinEl = grab('pin');
    if (!mark(pinEl, /^\d{6}$/.test(data.pin))) { issues.push('PIN code'); firstBad = firstBad || pinEl; }

    var lineEl = grab('line1');
    if (!mark(lineEl, data.line1.length >= 4)) { issues.push('address'); firstBad = firstBad || lineEl; }

    var cityEl = grab('city');
    if (!mark(cityEl, data.city.length >= 2)) { issues.push('city'); firstBad = firstBad || cityEl; }

    var stateEl = grab('state');
    if (!mark(stateEl, data.state.length >= 2)) { issues.push('state'); firstBad = firstBad || stateEl; }

    grab('notes');
    var termsEl = form.querySelector('[name="terms"]');
    var termsOk = !!(termsEl && termsEl.checked);
    if (termsEl) mark(termsEl, termsOk);
    if (!termsOk) { issues.push('terms acceptance'); firstBad = firstBad || termsEl; }

    if (issues.length) {
      showError('Please correct: ' + issues.join(', ') + '.');
      if (firstBad && firstBad.focus) firstBad.focus();
      return null;
    }

    var max = commerce().codMaxOrderValue || 0;
    if (max && store.cart.total() > max) {
      showError('Cash on delivery is not available above ' + money(max) + ' per order. Please contact us on WhatsApp to complete this order.');
      return null;
    }

    showError('');
    return data;
  }

  function renderSuccess(order) {
    var idEl = T.qs('[data-order-id]');
    if (idEl) idEl.textContent = order.id;
    var box = T.qs('[data-view="success"]');
    if (box) {
      T.qsa('[data-success]', box).forEach(function (el) {
        var key = el.getAttribute('data-success');
        if (key === 'count') el.textContent = String(order.items.reduce(function (n, i) { return n + (i.qty || 1); }, 0));
        if (key === 'shipping') el.textContent = order.shipping === 0 ? 'FREE' : money(order.shipping);
        if (key === 'total') el.textContent = money(order.total);
      });
    }
    var wa = T.qs('[data-order-wa]');
    if (wa) {
      wa.href = H.whatsappLink(
        'Hello TAVISH & CO., I have placed order ' + order.id +
        ' worth ' + money(order.total) + ' (cash on delivery). Please confirm availability and dispatch.'
      );
      wa.target = '_blank';
      wa.rel = 'noopener';
    }
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!store.cart.items().length) {
        showError('Your bag is empty. Please add a piece before checking out.');
        setView('cart');
        return;
      }
      var data = validate();
      if (!data) return;

      var order = store.orders.create({
        paymentMethod: 'COD',
        customer: { name: data.name, mobile: data.mobile, email: data.email },
        address: { line1: data.line1, city: data.city, state: data.state, pin: data.pin },
        notes: data.notes,
        items: store.cart.items(),
        subtotal: store.cart.subtotal(),
        shipping: store.cart.shipping(),
        total: store.cart.total()
      });

      store.cart.clear();
      renderSuccess(order);
      setView('success');
      try { window.history.replaceState(null, '', 'cart.html?order=' + encodeURIComponent(order.id)); } catch (err) { /* noop */ }
      T.toast('Order ' + order.id + ' saved in this browser', 'success');
    });
  }

  /* ------------------------------------------------------------------ init */
  renderItems();

  var orderParam = T.params().order;
  if (orderParam) {
    var existing = store.orders.get(orderParam);
    if (existing) {
      renderSuccess(existing);
      setView('success');
    }
  }
})(window, document);
