# BoardingPassMuseum implementation and release notes

## Implemented
- HttpOnly, Secure, host-only sessions; server-authoritative actors and the ID=1 + database role SA rule. Existing passwords upgrade to PBKDF2 on successful login. Logout and password reset revoke sessions.
- Expiring, single-use, purpose-bound verification codes; login/email rate limits; request and image size/type checks; restricted credentialed CORS; output escaping.
- Owner-only restore to `screening`, least-loaded reviewer reassignment; hidden status UI; duplicate withdrawal code/buttons removed. Existing administrator application DOM binding and v4 entry retained.
- Distinct-flight reviewer totals include approved and rejected decisions. Review events and first approvals persist. Public profile only exposes approved submissions and visible community posts to other viewers.
- Beijing annual level reset: a closing score greater than 50 carries 50, otherwise 0. Administrator review counts do not reset. Priority applies at Lv5–9 and Lv96–99. Hourly scheduled refresh and on-review updates maintain caches.
- All 18 achievements and public profile display; PEK/PVG/CAN gateway rule. Six complete consecutive Beijing months define the streak, each with at least three submissions and no rejected submission in those months.
- Dedicated community posting with required rules acknowledgement; reporting, temporary moderation, SA final moderation, warnings, bans, notifications, appeals, and reversible successful appeals. Working days mean Beijing Monday–Friday; statutory holiday substitutions are not modeled.

## Data migration limitations
The old schema did not record approval/review dates or historical decisions. Existing approved flights are migrated with submission time as an explicitly marked historical proxy. Only the currently recorded reviewer and outcome can be recovered; unrecorded decisions and deleted old submissions cannot be reconstructed. Historical records do not award time-sensitive review achievements. Existing CSS/JS backups are retained, excluded from the deployment artifact.

Airport aliases come from the existing project airport dataset. Country continent fallbacks come from https://github.com/datasets/country-codes . 9,268 airport matches were verified against complete records obtained from https://github.com/davidmegginson/ourairports-data . Unmatched airports in transcontinental countries do not receive a guessed continent. Unknown geography does not grant a geographic achievement.

## Validation and deployment
- `node --check` on active JavaScript; `node --test tests/*.test.mjs`.
- Local HTTP smoke test: `node tests/http-smoke.mjs` (requires the isolated fixture and private local credential file; never points at production).
- Browser verified profile content and layout at 1280px and 390px, including no horizontal overflow on mobile.
- D1 migrations 0003, 0004, 0005, 0006 must run in that order against the existing production schema. Do not replay the obsolete baseline migrations on production.
- Export a private database backup before migration. Deploy Worker and Pages after migration. Old localStorage sessions require a fresh login. Production login is supported at https://bpmuseum.org.cn .
- Do not commit/export `.dev.vars`, database files, local credentials, or backup exports. Stage only the intended source files.

Historical local database files were tracked in this public repository. They are now untracked but remain in old commits. One live account matched an exposed historical password hash; a private deployment statement marks it for a mandatory email password reset. No user hashes or backup exports are included in source. History rewriting requires separate explicit coordination.
