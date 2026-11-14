# BoardingPassMuseum Windows app

This is one packaged Windows desktop app with two workspaces: the public museum and the dedicated admin sign-in site. It reuses the production website, so accounts, permissions, submissions, and moderation continue to be enforced by the existing server. The app does not read or trust browser `localStorage` roles, store passwords, or change the web/PWA experience.

## Build on Windows

1. Install Visual Studio 2026 with the **Windows application development** workload and Windows SDK 10.0.26100 or newer.
2. Open `BoardingPassMuseum.sln` in Visual Studio.
3. Restore NuGet packages and select `x64` (or `ARM64`) plus `Release`.
4. Build and run locally. To create an MSIX for sideload testing, use **Publish → Create App Packages → Sideloading**. A Microsoft Store release requires the Store's package identity and a signed package; set those values in the package manifest from Partner Center before submission.

The current repo checkout is on macOS and has no .NET/Windows SDK, so it cannot produce or validate an MSIX here. The project targets the stable Windows App SDK 2.6.5 and .NET 10. Test login, OAuth/passkey, upload/file pickers, image editing, and admin/SA navigation on Windows before Store submission. The existing client and admin Store product IDs remain separate; this combined project has a placeholder package identity and will need to be associated with a Store product before it can replace either listing.

## Navigation and security

- **线上展厅** opens `https://bpmuseum.org.cn/`.
- **管理入口** opens `https://admin.bpmuseum.org.cn/admin-login.html`; the existing site decides whether a signed-in administrator proceeds, and SA routing remains in the website.
- HTTPS is required. Main-site and admin-site pages stay in the app. OAuth identity-provider pages needed by current sign-in buttons are allowed. Other outbound links open in the default browser.
- WebView2 uses its standard Windows user-data profile, allowing the browser session to persist on the device. Do not use a shared/public Windows account on an untrusted computer.
- No backend, database, public website, or existing Store product link was changed by this app scaffold.
