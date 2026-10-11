/*!
 * TAVISH & CO. — product detail page (gallery, meta, related, schema)
 */
(function (window, document) {
  'use strict';

  var store = window.TavishStore;
  var T = window.Tavish;
  var H = store.helpers;

  var params = T.params();
  var slug = params.slug || params.id || params.sku || '';
  var product = slug ? store.products.get(slug) : (store.products.publicList()[0] || null);
  if (product && ['DRAFT', 'HIDDEN', 'TRASH'].indexOf(product.status) > -1) product = null;

  var wrap = T.qs('[data-pdp-wrap]');
  var notFound = T.qs('[data-pdp-notfound]');
  var relatedSection = T.qs('[data-related-section]');

  function setMeta(selector, value) {
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function updateLink(rel, href) {
    var el = document.querySelector('link[rel="' + rel + '"]');
    if (el) el.setAttribute('href', href);
  }

  if (!product) {
    var pdpBlock = wrap ? wrap.querySelector('.pdp') : null;
    if (pdpBlock) pdpBlock.style.display = 'none';
    if (notFound) notFound.hidden = false;
    if (relatedSection) relatedSection.style.display = 'none';
    setMeta('title', 'Product not found | TAVISH & CO.');
    setMeta('meta[name="description"]', 'This product could not be found in the TAVISH & CO. catalogue.');
    return;
  }

  var settings = store.settings.get();
  var base = (settings.seo && settings.seo.base) || '';
  var canonical = base + '/product.html?slug=' + encodeURIComponent(product.slug);
  var images = (product.images && product.images.length ? product.images : [product.primaryImage]).slice();
  var primary = product.primaryImage || images[0];
  var out = product.availability === 'OUT_OF_STOCK' || product.status === 'OUT_OF_STOCK';
  var onSale = !!product.salePrice && product.salePrice < product.price;
  var abs = function (rel) { return base + '/' + String(rel).replace(/^\.\//, ''); };

  /* ------------------------------------------------------------- header */
  document.title = product.name + ' | TAVISH & CO.';
  setMeta('meta[name="description"]', product.description ? product.description.slice(0, 158) : document.title);
  updateLink('canonical', canonical);
  var ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonical);
  var ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', product.name + ' | TAVISH & CO.');
  var ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage) ogImage.setAttribute('content', abs(primary));

  setMeta('[data-pdp-title]', product.name);
  setMeta('[data-pdp-name]', product.name);
  setMeta('[data-pdp-cat]', product.category + (product.subcategory ? ' · ' + product.subcategory : ''));
  setMeta('[data-pdp-eyebrow]', product.newArrival ? 'New arrival' : product.bestSeller ? 'Best seller' : product.category);
  setMeta('[data-pdp-desc]', product.description);
  setMeta('[data-pdp-sku]', 'SKU ' + product.sku);

  var priceEl = T.qs('[data-pdp-price]');
  if (priceEl) priceEl.innerHTML = T.priceHtml(product);

  var stockEl = T.qs('[data-pdp-stock]');
  if (stockEl) {
    stockEl.classList.toggle('is-out', out);
    stockEl.textContent = out ? 'Out of stock — join the list on WhatsApp' : 'In stock · dispatches in 2 – 4 working days';
  }

  var crumb = T.qs('[data-pdp-crumb]');
  if (crumb) {
    var catLi = document.createElement('li');
    var catA = document.createElement('a');
    catA.href = T.categoryUrl(product.categorySlug);
    catA.textContent = product.category;
    catLi.appendChild(catA);
    crumb.appendChild(catLi);
    var nameLi = document.createElement('li');
    nameLi.setAttribute('aria-current', 'page');
    nameLi.textContent = product.name;
    crumb.appendChild(nameLi);
  }

  /* ------------------------------------------------------------- gallery */
  var mainImg = T.qs('[data-gallery-main]');
  var thumbs = T.qs('[data-gallery-thumbs]');

  function showImage(index) {
    var src = images[index];
    if (!src || !mainImg) return;
    mainImg.src = src;
    mainImg.alt = product.name + ' — view ' + (index + 1) + ' of ' + images.length;
    if (thumbs) {
      T.qsa('button', thumbs).forEach(function (btn, i) {
        var active = i === index;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }
  }

  if (thumbs && images.length) {
    thumbs.innerHTML = images.map(function (src, i) {
      return '<button class="gallery__thumb' + (i === 0 ? ' is-active' : '') + '" type="button" role="tab" ' +
        'aria-selected="' + (i === 0 ? 'true' : 'false') + '" data-thumb="' + i + '" ' +
        'aria-label="Show image ' + (i + 1) + ' of ' + images.length + '">' +
        '<img src="' + T.esc(src) + '" alt="" width="200" height="200" loading="lazy"></button>';
    }).join('');
    thumbs.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-thumb]');
      if (!btn) return;
      showImage(parseInt(btn.getAttribute('data-thumb'), 10));
    });
    showImage(0);
    T.hydrateImages(thumbs);
  }

  /* --------------------------------------------------------------- meta */
  var metaEl = T.qs('[data-pdp-meta]');
  if (metaEl) {
    var rows = [
      ['SKU', product.sku],
      ['Category', product.category + (product.subcategory ? ' · ' + product.subcategory : '')],
      ['Material', product.material],
      ['Finish', product.finish],
      ['Dimensions', product.dimensions],
      ['Weight', product.weight]
    ].filter(function (r) { return r[1]; });
    metaEl.innerHTML = rows.map(function (r) {
      return '<div><dt>' + T.esc(r[0]) + '</dt><dd>' + T.esc(r[1]) + '</dd></div>';
    }).join('');
  }

  var details = T.qs('[data-pdp-details]');
  if (details) {
    details.innerHTML = '<p>' + T.esc(product.description) + '</p>' +
      '<ul>' +
      '<li>Anti-tarnish protective coating over gold-tone plating.</li>' +
      '<li>Store in the pouch provided; avoid perfume, water and heat.</li>' +
      (product.tags && product.tags.length ? '<li>Tags: ' + product.tags.map(T.esc).join(', ') + '.</li>' : '') +
      '</ul>';
  }

  /* ------------------------------------------------------------ actions */
  T.qsa('[data-pdp-add]').forEach(function (btn) {
    btn.setAttribute('data-add-to-cart', String(product.id));
    if (out) { btn.setAttribute('disabled', ''); btn.textContent = 'Out of stock'; }
  });

  var wishBtn = T.qs('[data-pdp-wish]');
  if (wishBtn) {
    wishBtn.setAttribute('data-wish', String(product.id));
    var wished = store.wishlist.has(product.id);
    wishBtn.classList.toggle('is-active', wished);
    wishBtn.setAttribute('aria-pressed', wished ? 'true' : 'false');
  }

  T.qsa('[data-wa="product"]').forEach(function (a) {
    a.href = H.whatsappLink(H.productMessage(product));
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ------------------------------------------------------ style inspiration */
  var styleSection = T.qs('[data-style-section]');
  var styleGrid = T.qs('[data-style-grid]');
  var styleImages = Array.isArray(product.styleImages) ? product.styleImages.filter(Boolean).slice(0, 4) : [];
  if (styleSection && styleGrid && styleImages.length) {
    styleSection.hidden = false;
    styleGrid.innerHTML = styleImages.map(function (src, i) {
      return '<a href="' + T.esc(src) + '" target="_blank" rel="noopener"><img src="' + T.esc(src) + '" alt="TAVISH style inspiration ' + (i + 1) + '" width="900" height="900" loading="lazy"><span>Style inspiration</span></a>';
    }).join('');
    T.hydrateImages(styleGrid);
  }

  /* ------------------------------------------------------------ related */
  var related = store.products.publicList().filter(function (p) {
    return p.id !== product.id && p.categorySlug === product.categorySlug;
  });
  if (related.length < 4) {
    var extras = store.products.publicList().filter(function (p) {
      return p.id !== product.id && p.categorySlug !== product.categorySlug && p.subcategorySlug === product.subcategorySlug;
    });
    related = related.concat(extras);
  }
  related = store.products.sort(related, 'featured').slice(0, 4);

  var relatedGrid = T.qs('[data-related-grid]');
  if (relatedGrid) {
    if (!related.length && relatedSection) relatedSection.style.display = 'none';
    else T.renderProducts(relatedGrid, related);
  }

  /* ----------------------------------------------------------- json-ld */
  var ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    sku: product.sku,
    description: product.description,
    brand: { '@type': 'Brand', name: 'TAVISH & CO.' },
    image: images.map(abs),
    url: canonical,
    material: product.material || undefined,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: 'INR',
      price: String(onSale ? product.salePrice : product.price),
      availability: out ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  };
  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
})(window, document);
