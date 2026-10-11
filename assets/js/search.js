/*!
 * TAVISH & CO. — search results page
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;

  var grid = T.qs('[data-search-grid]');
  var form = T.qs('[data-search-form]');
  var input = T.qs('[data-search-input]');
  if (!grid || !form || !input) return;

  var toolbar = T.qs('[data-search-toolbar]');
  var countEl = T.qs('[data-search-count]');
  var sortSel = T.qs('[data-search-sort]');
  var emptyBox = T.qs('[data-search-empty]');
  var titleEl = T.qs('[data-search-title]');
  var timer = null;

  function currentQuery() { return String(input.value || '').trim(); }

  function syncUrl(q) {
    var url = 'search.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    try { window.history.replaceState(null, '', url); } catch (e) { /* noop */ }
  }

  function render() {
    var q = currentQuery();

    if (titleEl) titleEl.textContent = q ? 'Results for “' + q + '”' : 'Search';
    document.title = (q ? q + ' — Search' : 'Search') + ' | TAVISH & CO.';

    if (emptyBox) emptyBox.innerHTML = '';

    if (!q) {
      grid.innerHTML = '';
      if (toolbar) toolbar.hidden = true;
      if (emptyBox) {
        emptyBox.innerHTML = T.emptyState(
          'Search the collection',
          'Try a keyword such as pearl, korean, kada, polki, hoops or anti-tarnish.',
          { label: 'Browse all jewellery', href: 'shop.html' }
        );
      }
      return;
    }

    var sort = sortSel ? sortSel.value : 'featured';
    var list = store.products.sort(store.products.search(q), sort);

    if (toolbar) toolbar.hidden = false;
    if (countEl) {
      countEl.textContent = list.length
        ? list.length + ' piece' + (list.length === 1 ? '' : 's') + ' found for “' + q + '”'
        : 'No pieces found for “' + q + '”';
    }

    if (!list.length) {
      grid.innerHTML = T.emptyState(
        'No matches for “' + q + '”',
        'Try a broader word — pearl, korean, kada, festive — or browse the full collection.',
        { label: 'View all jewellery', href: 'shop.html' }
      );
      return;
    }
    T.renderProducts(grid, list);
  }

  function refresh(push) {
    render();
    if (push) syncUrl(currentQuery());
  }

  input.addEventListener('input', function () {
    window.clearTimeout(timer);
    timer = window.setTimeout(function () { refresh(true); }, 180);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    window.clearTimeout(timer);
    refresh(true);
  });

  if (sortSel) sortSel.addEventListener('change', function () { render(); });

  T.qsa('[data-page-suggest] button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      input.value = btn.textContent.trim();
      input.focus();
      refresh(true);
    });
  });

  input.value = T.params().q || '';
  render();
})(window, document);
