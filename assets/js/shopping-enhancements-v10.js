/* TAVISH & CO. V10: mobile filter-sheet controls and swipeable product gallery. */
(function (window, document) {
  'use strict';
  var panel = document.getElementById('shopFilters');
  var toggle = document.querySelector('[data-filter-toggle]');
  var scrim;
  var priorFocus = null;

  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement('button');
    scrim.type = 'button';
    scrim.className = 'tc-filter-scrim';
    scrim.setAttribute('aria-label', 'Close filters');
    scrim.tabIndex = -1;
    scrim.addEventListener('click', closeFilters);
    document.body.appendChild(scrim);
    return scrim;
  }
  function openFilters() {
    if (!panel || window.matchMedia('(min-width: 1024px)').matches) return;
    priorFocus = document.activeElement;
    panel.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    ensureScrim().classList.add('is-visible');
    document.body.classList.add('tc-filters-open');
    var first = panel.querySelector('input, button, select');
    if (first) window.setTimeout(function () { first.focus({preventScroll:true}); }, 20);
  }
  function closeFilters() {
    if (!panel) return;
    panel.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (scrim) scrim.classList.remove('is-visible');
    document.body.classList.remove('tc-filters-open');
    if (priorFocus && priorFocus.focus) priorFocus.focus({preventScroll:true});
  }
  if (panel && toggle) {
    // shop.js owns the open/close class; this listener adds the scrim and focus behaviour.
    toggle.addEventListener('click', function () {
      window.setTimeout(function () {
        if (panel.classList.contains('is-open')) {
          priorFocus = toggle;
          ensureScrim().classList.add('is-visible');
          document.body.classList.add('tc-filters-open');
          var first = panel.querySelector('input, button, select');
          if (first) first.focus({preventScroll:true});
        } else {
          if (scrim) scrim.classList.remove('is-visible');
          document.body.classList.remove('tc-filters-open');
        }
      }, 0);
    });
    panel.addEventListener('change', function (event) {
      if (event.target && event.target.matches('input[type="checkbox"]')) {
        // Keep the sheet open while shoppers combine filters.
        if (window.matchMedia('(max-width: 1023px)').matches) {
          panel.classList.add('is-open');
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
          ensureScrim().classList.add('is-visible');
        }
      }
    });
    panel.addEventListener('click', function (event) {
      if (event.target.closest('[data-reset-filters]') && window.matchMedia('(max-width: 1023px)').matches) closeFilters();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && panel.classList.contains('is-open')) closeFilters();
    });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1024px)').matches) closeFilters();
    });
  }

  // Enable touch swipe through the already-rendered product gallery images.
  var main = document.querySelector('[data-gallery-main]');
  if (main) {
    var startX = 0, startY = 0, startTime = 0;
    main.addEventListener('touchstart', function (event) {
      if (!event.touches || event.touches.length !== 1) return;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
      startTime = Date.now();
    }, {passive:true});
    main.addEventListener('touchend', function (event) {
      if (!event.changedTouches || !event.changedTouches.length || Date.now() - startTime > 700) return;
      var dx = event.changedTouches[0].clientX - startX;
      var dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      var thumbs = Array.prototype.slice.call(document.querySelectorAll('[data-gallery-thumbs] [data-thumb]'));
      if (thumbs.length < 2) return;
      var active = thumbs.findIndex(function (button) { return button.getAttribute('aria-selected') === 'true'; });
      if (active < 0) active = 0;
      var next = (active + (dx < 0 ? 1 : -1) + thumbs.length) % thumbs.length;
      thumbs[next].click();
    }, {passive:true});
    var hint = document.createElement('p');
    hint.className = 'tc-gallery-hint';
    hint.textContent = 'Swipe to explore more views';
    var galleryFrame = main.closest('.gallery__main') || main;
    galleryFrame.insertAdjacentElement('afterend', hint);
  }
})(window, document);
