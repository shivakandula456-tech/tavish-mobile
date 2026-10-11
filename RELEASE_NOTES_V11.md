# TAVISH & CO. V11 Release Notes

## Implemented in this package
- Royal Indian heritage visual system: warm ivory, antique gold, burgundy accents, refined serif headings and restrained ornament.
- Cinematic hero treatment and existing hero video assets retained, with motion-reduction support and existing mobile-specific video assets.
- Shopping UX refinements: product card transitions, mobile filter sheet, touch swipe on product galleries, focus states and responsive layouts.
- Existing V7 desktop layout and V8 mobile/tablet structure retained as the baseline rather than replaced wholesale.
- Supabase REST/Auth/Storage adapter added for shared catalogue reads, product upserts, data-URL image uploads and Admin authentication.
- Supabase RLS schema and Storage policies included.
- Hardcoded demo Admin password removed. Admin access is disabled until a Supabase project is configured.

## Required before live catalogue publishing
1. Configure `supabase-config.js` with the project URL and publishable key.
2. Run `backend/supabase/schema.sql` in Supabase SQL Editor.
3. Create a public `product-images` bucket; policies restrict upload/update/delete to catalogue admins.
4. Create an Auth user and add its UUID to `public.admin_users`.
5. Sign in to `/admin/login.html` and use the Products page's **Import local catalogue to Supabase** action.
6. Test a create/edit/publish from a second browser/device and confirm RLS denies unauthorised writes.

## Not represented as complete
- Supabase was not connected to a real project during this build, so live cross-device publishing and authentication were not end-to-end tested.
- Orders, newsletter signups, settings and audit history remain local-browser data. The shared catalogue integration does not make those systems shared.
- No real checkout/order backend or payment processor is configured.
- Browser screenshot/interaction verification was unavailable in this environment; structural checks are documented separately in the delivery message.


## Screenshot review fixes
- Replaced four similar homepage social-gallery campaign images with distinct product imagery and updated captions/alt text.
- Replaced placeholder Instagram links with the brand profile URL.
- Forced homepage hero header to remain truly transparent at the top, with a separate ivory surface only after scrolling.
- Fixed footer contrast with deep burgundy background, ivory text and gold headings; added responsive mobile footer layout.
- Applied the fixes to the shared stylesheet so they affect desktop, tablet and mobile.
- Source-level checks only; actual browser rendering and live Supabase publishing still require end-to-end verification.
