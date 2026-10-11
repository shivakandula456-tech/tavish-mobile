# TAVISH & CO. — Supabase catalogue and customer email authentication

This package includes a vanilla-JavaScript Supabase REST/Auth/Storage adapter and a customer email-authentication page at `account.html`. It is not live until you configure your own project URL and publishable key. No service-role key belongs in the browser.

## Configure
1. Create a Supabase project.
2. In `supabase-config.js`, set `url` to the project URL and `publishableKey` to the public publishable/anon key.
3. In SQL Editor, run `backend/supabase/schema.sql` on the new project. This creates the catalogue/Admin tables and a customer-owned `customer_profiles` table protected by row-level security.
4. Create the `product-images` Storage bucket and mark it PUBLIC (product images are public assets; upload/delete are restricted by RLS policies in the SQL file).
5. Create an Admin user in Authentication → Users. Copy its UUID, then run: `insert into public.admin_users(user_id) values ('AUTH-USER-UUID');`
6. Sign in at `/admin/login.html` using that Auth user's email/password. The local demo login is bypassed when Supabase is configured.
7. Open Admin → Products and use **Import local catalogue to Supabase** to migrate the current local seed catalogue. This uploads data-URL images into Storage and upserts product records by SKU. Relative asset paths remain relative to the deployed storefront, so deploy the site and assets together.
8. Test with a second browser/device: publish a product, then confirm it appears on the customer storefront. Also test unauthorized writes with a non-admin account.
9. Open `/account.html` to create a customer account, confirm the email if required, sign in, save a profile, reset a password, and sign out. Configure Auth → URL Configuration with the deployed site URL and allowed redirect URLs first.
10. **Enable Google sign-in:** in Google Cloud Console, create/configure an OAuth client ID for a Web application. Add the Supabase Auth callback URL shown in Supabase → Authentication → Providers → Google (typically `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`) as an authorized redirect URI in Google Cloud. In Supabase → Authentication → Providers → Google, enable the provider and enter the Google Client ID and Client Secret. In Supabase → Authentication → URL Configuration, set your production site URL and add the exact account page URL (for example `https://your-domain.example/account.html`) to the allowed redirect URLs. Then test **Continue with Google** on the deployed HTTPS site. Never put the Google Client Secret in website files.

## Security
- Only use the publishable key in `supabase-config.js`. Never use `service_role` or a secret key in client code.
- Public visitors can read only ACTIVE/OUT_OF_STOCK rows; authenticated users listed in `admin_users` can manage catalogue rows.
- Admin access is enforced by Supabase Auth + RLS, not by hiding the Admin page.
- The adapter writes product records to Supabase and uploads data-URL images to `product-images`.
- Guest checkout remains available and is not gated by login. This build does not centralize order records, newsletter records, wishlists or saved addresses; do not advertise cross-device order history/wishlist sync until those are implemented. Customer profile fields are centralized when Supabase is configured.
- Do not launch real checkout/order processing until order storage, payment/COD workflow, privacy, shipping, returns, backups and operational security are implemented and tested.

## Current limitations
- No Supabase URL/key or Google OAuth credentials were available during this build, so Google OAuth, live requests, email delivery, profile saves and cross-device publishing could not be exercised here. Configure and test them in your own Supabase project before launch.
- Remote catalogue loading uses a one-time reload after successful fetch to hydrate existing synchronous page renderers.
- Importing existing local catalogue is an explicit Admin action, not automatic.
