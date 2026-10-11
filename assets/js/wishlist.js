/*!
 * TAVISH & CO. — wishlist page (desktop table + mobile cards)
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;

  var body = T.qs('[data-wishlist-body]');
  var cardsBox = T.qs('[data-wishlist-mobile]');
  var desktopBox = T.qs('[data-wishlist-desktop]');
  var emptyBox = T.qs('[data-wishlist-empty]');
  var allBtn = T.qs('[data-wish-all]');
  if (!body || !cardsBox) return;

  function price(i) {
    var html = '<span class="price' + (i.salePrice && i.salePrice < i.price ? ' price--sale' : '') + '">' +
      T.money(i.salePrice && i.salePrice < i.price ? i.salePrice : i.price) + '</span>';
    if (i.salePrice && i.salePrice < i.price) html += ' <s class="price price--old">' + T.money(i.price) + '</s>';
    return html;
  }

  function stockLine(i) {
    var out = i.availability === 'OUT_OF_STOCK' || i.status === 'OUT_OF_STOCK';
    return '<span class="pcard__stock' + (out ? ' is-out' : '') + '">' + (out ? 'Out of stock' : 'In stock') + '</span>';
  }

  function row(i) {
    var img = i.image || T.FALLBACK_IMG;
    return '<tr data-wish-row="' + i.productId + '">' +
      '<td class="media"><a href="' + T.productUrl(i) + '"><img src="' + T.esc(img) + '" alt="' + T.esc(i.name) + '" width="156" height="195" loading="lazy"></a></td>' +
      '<td><a class="name" href="' + T.productUrl(i) + '">' + T.esc(i.name) + '</a>' +
        '<div class="cart-item__meta">SKU ' + T.esc(i.sku || '') + '</div>' + stockLine(i) + '</td>' +
      '<td>' + price(i) + '</td>' +
      '<td><div class="wish-card__actions">' +
        '<button class="btn btn--gold btn--small" type="button" data-wish-move="' + i.productId + '"' + (i.availability === 'OUT_OF_STOCK' ? ' disabled' : '') + '>Add to bag</button>' +
        '<button class="cart-link" type="button" data-wish-remove="' + i.productId + '">Remove</button>' +
      '</div></td>' +
    '</tr>';
  }

  function card(i) {
    var img = i.image || T.FALLBACK_IMG;
    return '<article class="wish-card" data-wish-row="' + i.productId + '">' +
      '<a href="' + T.productUrl(i) + '"><img src="' + T.esc(img) + '" alt="' + T.esc(i.name) + '" width="168" height="210" loading="lazy"></a>' +
      '<div>' +
        '<a class="cart-item__name" href="' + T.productUrl(i) + '">' + T.esc(i.name) + '</a>' +
        '<div class="cart-item__meta">SKU ' + T.esc(i.sku || '') + '</div>' +
        '<div class="cart-item__price">' + price(i) + '</div>' +
        '<div class="wish-card__actions">' +
          '<button class="btn btn--gold btn--small" type="button" data-wish-move="' + i.productId + '"' + (i.availability === 'OUT_OF_STOCK' ? ' disabled' : '') + '>Add to bag</button>' +
          '<button class="cart-link" type="button" data-wish-remove="' + i.productId + '">Remove</button>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function render() {
    var items = store.wishlist.items();
    var empty = !items.length;
    if (emptyBox) {
      emptyBox.hidden = !empty;
      emptyBox.innerHTML = empty
        ? T.emptyState('No saved pieces yet', 'Tap the heart on any product to keep it here for later.', { label: 'Browse the collection', href: 'shop.html' })
        : '';
    }
    if (desktopBox) desktopBox.hidden = empty;
    cardsBox.hidden = empty;
    if (allBtn) allBtn.hidden = empty;

    body.innerHTML = items.map(row).join('');
    cardsBox.innerHTML = items.map(card).join('');
  }

  document.addEventListener('click', function (e) {
    var rm = e.target.closest ? e.target.closest('[data-wish-remove]') : null;
    if (rm) {
      store.wishlist.remove(rm.getAttribute('data-wish-remove'));
      T.toast('Removed from wishlist', 'success');
      return;
    }
    var move = e.target.closest ? e.target.closest('[data-wish-move]') : null;
    if (move) {
      var id = move.getAttribute('data-wish-move');
      var res = store.wishlist.moveToCart(id);
      if (res.error) { T.toast(res.error, 'error'); return; }
      T.toast('Moved to your bag', 'success');
      return;
    }
    if (allBtn && e.target === allBtn) {
      var ids = store.wishlist.ids().slice();
      var moved = 0;
      ids.forEach(function (id) {
        var res = store.wishlist.moveToCart(id);
        if (res.ok) moved++;
      });
      T.toast(moved ? 'Moved ' + moved + ' piece' + (moved === 1 ? '' : 's') + ' to your bag' : 'Nothing could be moved', moved ? 'success' : 'error');
    }
  });

  window.addEventListener('tavish:wishlist', render);
  window.addEventListener('tavish:wishlist-view-refresh', render);

  render();
})(window, document);
