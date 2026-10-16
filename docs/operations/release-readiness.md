# Release readiness checklist

## Before a website or app release

- Run `node --test tests/*.test.mjs`, `node --check worker/index.js`, and `git diff --check`.
- Confirm all database migrations are applied to the intended environment. Back up before applying a schema change.
- Check public, admin, and API URLs over HTTPS. Verify login, exhibit search/detail, submission, consent controls, moderation, account export, and account deletion flows.
- Check that public responses exclude reviewer notes, appeal reasons, private account fields, and hidden exhibits.
- Confirm the current Cloudflare error dashboard and D1 health/usage after deployment. Treat authentication, email, database, and AI failures separately.
- Verify that the public exhibit image URLs return the expected image type, size, and cache headers. Do not change R2 retention or cache rules without an image rollback plan.
- Confirm text contrast, keyboard focus, phone-sized layouts, and all three language options for touched pages.

## Windows Store clients

- Keep the public client and dedicated admin client as separate listings and installations.
- Verify each listing URL, Store protocol link, website fallback, app identity, screenshots, and version number from a clean Windows account.
- Confirm that installing or opening the admin client never silently grants a management session; authentication remains required on every visit.

## Future Google Play package

- Decide whether to ship a Trusted Web Activity or a native wrapper only after the current web flows pass on Android phones and tablets.
- Prepare a separate application ID, signing-key backup, Android screenshots, icon assets, support contact, privacy-policy URL, and account-deletion URL.
- Complete the current Play Console data-safety and content declarations from the actual app behavior; disclose account data, user-uploaded images, AI image recognition, and third-party service processing.
- Verify Android back navigation, file picking from camera/gallery, upload conversion, external links, sign-in and passkeys, offline/error states, and the system share sheet.
- Test an internal/closed track build with real devices before production rollout. Keep admin access on the separate protected website unless a dedicated admin-app security review approves otherwise.

## Rollback

- A Worker code rollback does not revert D1 or R2 data. Keep schema migrations additive and forward-compatible where possible.
- Restore database state only through the documented recovery process and a confirmed point-in-time bookmark.
- For static site regressions, redeploy the previously reviewed Git commit; do not restore a stale entire site directory over newer user-facing content.
