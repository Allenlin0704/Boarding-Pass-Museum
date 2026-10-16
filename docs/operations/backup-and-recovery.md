# Production backup and recovery

Production data lives in Cloudflare D1 (`boardingpassmuseum-db`) and exhibit images live in R2. The Worker does not delete or recreate production data during deployment.

## Recovery window

D1 Time Travel is enabled automatically. [Cloudflare's current documentation](https://developers.cloudflare.com/d1/reference/time-travel/) says the Free plan retains up to 7 days of point-in-time history and the Paid plan up to 30 days. Check the account's plan before relying on a particular retention period. Use the current bookmark or timestamp lookup before any recovery:

```sh
./node_modules/.bin/wrangler d1 info boardingpassmuseum-db
./node_modules/.bin/wrangler d1 time-travel info boardingpassmuseum-db
./node_modules/.bin/wrangler d1 time-travel info boardingpassmuseum-db --timestamp="2026-10-16T12:00:00Z"
```

## Make and verify a separate export

An export contains user records, contact details, password hashes, submissions, and community content. Keep it outside Git, restrict local file permissions, and store any longer-lived copy in encrypted storage:

```sh
./scripts/backup-production-d1.sh /private/tmp/bpm-production-YYYYMMDD.sql
```

The script refuses to overwrite a file or place it inside this repository. It imports the export into a disposable in-memory SQLite database and runs `PRAGMA integrity_check`; it prints table count and file size only, never row contents.

## Recovery procedure

1. Record the incident time in UTC and the current D1 bookmark.
2. Export the current database to a new protected file before changing anything.
3. Identify the point immediately before the bad migration or write with `time-travel info`.
4. Have the site owner confirm the chosen recovery point and expected loss window.
5. Restore only after that confirmation. `time-travel restore` overwrites the live database in place and cancels in-flight queries; never run it as a routine deployment step.
6. Check the returned bookmark so the restore can be undone if needed. Verify login, public gallery, a known exhibit, submissions, and SA review access without editing records.
7. Keep both the pre-restore export and the returned bookmark until the site owner confirms the recovered site.

## Drill completed

On 2026-10-16, a fresh remote D1 SQL export was imported into an isolated in-memory SQLite database. All 44 tables loaded and `PRAGMA integrity_check` returned `ok`. Four approved exhibits had legacy inline JPEG data; the exact bytes were copied to new R2 objects, their public URLs were checked for matching MIME type, byte size, and immutable cache headers, and only those four `image` references were changed. Their image bytes and exhibit records remain intact. No live restore or object deletion was run. The one-off private export is at `/private/tmp/bpm-production-before-release.sql`; move an encrypted copy to a separately managed backup location if it must survive this machine or temporary-directory cleanup.

## Image recovery

Exhibit originals are stored in the existing R2 bucket. Do not bulk-delete or overwrite `tickets/` objects during cleanup. To recover a missing image, verify its database URL and object key first, then use the Cloudflare dashboard or a targeted `wrangler r2 object get` into a private directory. Confirm the recovered file's type and size before putting it back.

New ticket images use random object keys and are immutable; the Worker assigns a one-year public cache lifetime. The public gallery API uses a short 30-second browser cache with stale-while-revalidate. Do not apply the same immutable rule to any future image whose object key can be overwritten.
