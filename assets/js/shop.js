/*!
 * TAVISH & CO. — shop page (filters, sorting, faceted counts, URL state)
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;
  var H = store.helpers;

  var grid = T.qs('[data-shop-grid]');
  if (!grid) return;

  var state = {
    category: [],
    sub: [],
    flag: [],
    price: [],
    availability: [],
    sale: false,
    q: '',
    sort: 'featured'
  };

  var LABELS = {
    'anti-tarnish': 'Anti-Tarnish', korean: 'Korean Edit', festive: 'Festive',
    kadas: 'Kadas', bangles: 'Bangles', statement: 'Statement', bands: 'Bands',
    'chains-pendants': 'Chains & Pendants', brooches: 'Brooches', keepsakes: 'Keepsakes', charms: 'Charms',
    newArrival: 'New arrivals', bestSeller: 'Best sellers', featured: 'Featured', sale: 'On sale'
  };

  var PRICE_LABELS = {
    '0-1500': 'Under ₹1,500',
    '1500-3000': '₹1,500 – ₹3,000',
    '3000-6000': '₹3,000 – ₹6,000',
    '6000-': 'Above ₹6,000'
  };

  function split(v) {
    return String(v || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function readUrl() {
    var p = T.params();
    state.category = split(p.category);
    state.sub = split(p.sub);
    state.flag = split(p.flag);
    state.price = split(p.price);
    state.availability = split(p.availability);
    state.sale = p.sale === '1' || p.sale === 'true';
    state.q = p.q || '';
    state.sort = p.sort || 'featured';
  }

  function writeUrl() {
    var parts = [];
    function add(k, v) { if (v && v.length) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v.join(','))); }
    add('category', state.category);
    add('sub', state.sub);
    add('flag', state.flag);
    add('price', state.price);
    add('availability', state.availability);
    if (state.sale) parts.push('sale=1');
    if (state.q) parts.push('q=' + encodeURIComponent(state.q));
    if (state.sort && state.sort !== 'featured') parts.push('sort=' + encodeURIComponent(state.sort));
    var url = window.location.pathname + (parts.length ? '?' + parts.join('&') : '');
    try { window.history.replaceState(null, '', url); } catch (e) {}
  }

  function priceOf(p) { return H.priceOf(p); }

  function inPriceBand(p, band) {
    var price = priceOf(p);
    var bits = band.split('-');
    var min = parseInt(bits[0], 10) || 0;
    var max = bits[1] === '' ? Infinity : (parseInt(bits[1], 10) || Infinity);
    return price >= min && price < max;
  }

  function applyFilters(list, skip) {
    skip = skip || '';
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (p) {
        return (p.name + ' ' + p.sku + ' ' + p.category + ' ' + p.subcategory + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase().indexOf(q) > -1;
      });
    }
    if (skip !== 'category' && state.category.length) {
      list = list.filter(function (p) { return state.category.indexOf(p.categorySlug) > -1; });
    }
    if (skip !== 'sub' && state.sub.length) {
      list = list.filter(function (p) { return state.sub.indexOf(p.subcategorySlug) > -1; });
    }
    if (skip !== 'flag' && state.flag.length) {
      list = list.filter(function (p) {
        return state.flag.some(function (f) { return !!p[f]; });
      });
    }
    if (skip !== 'flag' && state.sale) {
      list = list.filter(function (p) { return !!p.salePrice && p.salePrice < p.price; });
    }
    if (skip !== 'price' && state.price.length) {
      list = list.filter(function (p) {
        return state.price.some(function (band) { return inPriceBand(p, band); });
      });
    }
    if (skip !== 'availability' && state.availability.length) {
      list = list.filter(function (p) { return state.availability.indexOf(p.availability) > -1; });
    }
    return list;
  }

  function syncControls() {
    T.qsa('#shopFilters input[type="checkbox"]').forEach(function (input) {
      var name = input.name;
      var value = input.value;
      var checked = false;
      if (name === 'sale') checked = state.sale;
      else checked = (state[name] || []).indexOf(value) > -1;
      input.checked = checked;
    });
    var sortSel = T.qs('[data-sort]');
    if (sortSel) sortSel.value = state.sort;
  }

  function updateCounts() {
    var base = store.products.publicList();
    function countWith(skip, matcher) {
      return applyFilters(base, skip).filter(matcher).length;
    }
    T.qsa('#shopFilters input[type="checkbox"]').forEach(function (input) {
      var name = input.name;
      var value = input.value;
      var span = input.parentElement.querySelector('.count');
      if (!span) return;
      var n = 0;
      if (name === 'category') n = countWith('category', function (p) { return p.categorySlug === value; });
      else if (name === 'sub') n = countWith('sub', function (p) { return p.subcategorySlug === value; });
      else if (name === 'flag') n = countWith('flag', function (p) { return !!p[value]; });
      else if (name === 'sale') n = countWith('flag', function (p) { return !!p.salePrice && p.salePrice < p.price; });
      else if (name === 'price') n = countWith('price', function (p) { return inPriceBand(p, value); });
      else if (name === 'availability') n = countWith('availability', function (p) { return p.availability === value; });
      span.textContent = n;
    });
  }

  function renderChips() {
    var box = T.qs('[data-active-chips]');
    if (!box) return;
    var chips = [];
    function chip(label, group, value) {
      chips.push('<button class="chip is-active" type="button" data-chip-group="' + group + '" data-chip-value="' + T.esc(value) + '">' +
        T.esc(label) + ' <svg width="11" height="11" aria-hidden="true" focusable="false"><use href="#icon-close"></use></svg>' +
        '<span class="sr-only">Remove filter</span></button>');
    }
    state.category.forEach(function (v) { chip(categoryLabel(v), 'category', v); });
    state.sub.forEach(function (v) { chip(LABELS[v] || v, 'sub', v); });
    state.flag.forEach(function (v) { chip(LABELS[v] || v, 'flag', v); });
    if (state.sale) chip(LABELS.sale, 'sale', '1');
    state.price.forEach(function (v) { chip(PRICE_LABELS[v] || v, 'price', v); });
    state.availability.forEach(function (v) { chip(v === 'IN_STOCK' ? 'In stock' : 'Out of stock', 'availability', v); });
    if (state.q) chip('Search: ' + state.q, 'q', '');
    if (chips.length > 1) {
      chips.push('<button class="chip" type="button" data-reset-filters>Clear all</button>');
    }
    box.innerHTML = chips.join('');
  }

  function categoryLabel(slug) {
    var cat = store.categories.find(slug);
    return cat ? cat.name : slug;
  }

  function renderHeaderInfo(list) {
    var titleEl = T.qs('[data-shop-title]');
    var ledeEl = T.qs('[data-shop-lede]');
    if (ledeEl) {
      var total = store.products.publicList().length;
      ledeEl.textContent = (total === 1 ? '1 piece' : total + ' pieces') + ' across five families — every one finished with an anti-tarnish coating and packed by hand in Wagholi, Pune.';
    }
    if (titleEl) {
      if (state.category.length === 1) {
        var cat = store.categories.find(state.category[0]);
        titleEl.textContent = cat ? cat.name : 'Shop jewellery';
        if (ledeEl && cat) ledeEl.textContent = cat.description || '';
        var crumb = T.qs('.breadcrumb');
        if (crumb && cat && crumb.children.length < 3) {
          var li = document.createElement('li');
          li.setAttribute('aria-current', 'page');
          li.textContent = cat.name;
          crumb.appendChild(li);
        }
      } else if (state.sub.length === 1) {
        titleEl.textContent = (LABELS[state.sub[0]] || state.sub[0]) + ' edit';
        if (ledeEl) ledeEl.textContent = 'Pieces from the ' + (LABELS[state.sub[0]] || state.sub[0]) + ' collection, finished to the same anti-tarnish standard.';
      } else if (state.q) {
        titleEl.textContent = 'Results for “' + state.q + '”';
      }
    }
    document.title = (state.category.length === 1 ? categoryLabel(state.category[0]) + ' | ' : '') + 'Shop Jewellery | TAVISH & CO.';
  }

  function render() {
    var list = applyFilters(store.products.publicList());
    list = store.products.sort(list, state.sort);

    var countEl = T.qs('[data-result-count]');
    if (countEl) {
      countEl.textContent = list.length === 1 ? '1 piece' : list.length + ' pieces';
    }

    if (!list.length) {
      grid.innerHTML = T.emptyState(
        'No pieces match those filters',
        'Try removing a filter, or browse the full collection.',
        { href: 'shop.html', label: 'View all jewellery' }
      );
    } else {
      T.renderProducts(grid, list);
    }

    renderChips();
    syncControls();
    updateCounts();
    renderHeaderInfo(list);
    writeUrl();
  }

  function toggleArray(arr, value, on) {
    var i = arr.indexOf(value);
    if (on && i < 0) arr.push(value);
    if (!on && i > -1) arr.splice(i, 1);
  }

  function bindEvents() {
    T.qsa('#shopFilters input[type="checkbox"]').forEach(function (input) {
      input.addEventListener('change', function () {
        var name = input.name;
        if (name === 'sale') state.sale = input.checked;
        else toggleArray(state[name], input.value, input.checked);
        render();
      });
    });

    var sortSel = T.qs('[data-sort]');
    if (sortSel) {
      sortSel.addEventListener('change', function () {
        state.sort = sortSel.value;
        render();
      });
    }

    var chips = T.qs('[data-active-chips]');
    if (chips) {
      chips.addEventListener('click', function (e) {
        var reset = e.target.closest('[data-reset-filters]');
        if (reset) { resetAll(); return; }
        var chip = e.target.closest('[data-chip-group]');
        if (!chip) return;
        var group = chip.getAttribute('data-chip-group');
        var value = chip.getAttribute('data-chip-value');
        if (group === 'sale') state.sale = false;
        else if (group === 'q') state.q = '';
        else toggleArray(state[group], value, false);
        render();
      });
    }

    T.qsa('[data-reset-filters]').forEach(function (btn) {
      btn.addEventListener('click', resetAll);
    });

    var toggle = T.qs('[data-filter-toggle]');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var panel = T.qs('#shopFilters');
        var open = panel.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  function resetAll() {
    state.category = [];
    state.sub = [];
    state.flag = [];
    state.price = [];
    state.availability = [];
    state.sale = false;
    state.q = '';
    state.sort = 'featured';
    render();
  }

  function buildCategoryOptions() {
    var box = T.qs('[data-filter-options]');
    if (!box) return;
    var cats = store.categories.list().filter(function (c) { return c.visible !== false; });
    box.innerHTML = cats.map(function (c) {
      return '<label><input type="checkbox" name="category" value="' + T.esc(c.slug) + '"> ' + T.esc(c.name) +
        ' <span class="count" data-count-cat="' + T.esc(c.slug) + '"></span></label>';
    }).join('');
  }

  readUrl();
  buildCategoryOptions();
  bindEvents();
  render();
})(window, document);
