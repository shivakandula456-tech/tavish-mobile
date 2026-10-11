# TAVISH & CO. V13 — Mobile UX Polish

## Locked design decisions implemented
- Preserve the V7 desktop styling and V8 responsive mobile/tablet direction.
- Homepage header remains transparent over the hero and switches to the ivory sticky state on scroll.
- Two-column mobile product cards with always-visible Quick Add on touch devices.
- Sticky product Add to Bag bar is offset above the fixed Home / Shop / Wishlist / Bag navigation to prevent overlap.
- Mobile controls include visible keyboard focus states and reduced-motion overrides.
- Product pages retain the existing swipe gallery, sticky purchase CTA, WhatsApp contact and current category/catalogue structure.
- Lightweight hero strategy retained: muted inline video with metadata preload and a high-priority static fallback image.

## Scope and limitations
This is a responsive UI patch on the V12 source package. It does not establish that Supabase is configured or that cross-device publishing works. The existing localStorage behaviour remains until a real Supabase project is configured and end-to-end tested. No claim of live browser visual verification is made.

## Validation performed
- JavaScript syntax checks on project JS files.
- CSS parsing check where parser available.
- HTML structure and local asset reference checks.
- ZIP integrity test.
- Desktop styles were not intentionally changed; new mobile UX rules are limited to viewport widths <= 1023px, with small-phone adjustments <= 380px.

## Manual tests still required
Open using a local HTTP server (not file:// for features that fetch data) and test 360px, 390px, 430px, 768px, 1024px, 1440px and 1920px. Verify actual sticky header, bottom navigation, product gallery, add-to-bag, cart totals, checkout validation, WhatsApp links, and Supabase publishing after credentials/configuration are supplied.
