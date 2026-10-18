# Changelog

## 0.1.6 — 2026-10-18 (beta naming update)

- Renamed the Foundry module's visible title to **AFT Navbar+**. The same name now appears in the Arrange Icons settings entry, configuration window, release title and notifications.
- Retained the module ID `foundry-nav-order`, installation folder, GitHub repository and **permanent update manifest**. This updates the existing installation without duplicating the module or migrating any data.
- No changes to icon ordering, Hide/Show permissions, per-user color preferences, user settings, macros or world documents.
- Existing v0.1.5 users can use Foundry's normal **Update** function. Earlier pinned-manifest versions still require their one-time transition to the permanent manifest.
- Automated checks cover branding, release metadata, existing functionality and ZIP integrity; real Foundry v14 client behavior still requires a live test.

## 0.1.5 — 2026-10-18 (beta update-channel repair)

- Introduced one permanent update manifest: `https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`.
- Fixed the previously version-pinned manifest field so Foundry can detect future module releases with Update/Update All.
- Introduced an `update-channel` branch that is promoted by GitHub Actions **only after** tests, ZIP validation, and creation of both public release assets succeed.
- Preserved the `foundry-nav-order` module ID, hide/show, GM role controls, icon ordering, color choices, and all existing user/world settings. No migration.
- Added upgrade and rollback instructions for older pinned installations. A one-time update is required for those installations to join the stable update channel.
- Functional Foundry UI behavior remains beta pending actual GM/player testing; this patch changes distribution/update metadata only.


## 0.1.4 — 2026-10-18 (beta)

- Added **Hide/Show** (eye icon) beside the up/down arrows for left toolbar categories, left subtools and right sidebar tabs. Hidden icons stay in the organizer, and **Restore All Hidden Icons** restores them without changing colors or order.
- Added a **GM-controlled minimum role** setting with GM only (default), Trusted Players and above, or All Players. Each user's visibility preference is independent; removing access temporarily reveals their icons without discarding preferences.
- Protects the Settings sidebar tab from being hidden, and attempts to switch active hidden tabs to Settings. If switching fails, the active tab remains visible.
- Uses Foundry v14 native `visible` fields for left controls/tools and non-destructive DOM visibility for right tabs. Does not uninstall modules, edit world documents or change Foundry permission grants.
- Preserves `foundry-nav-order`, existing `layout` and `appearance` settings, and all previous functionality. No data migration.
- Automated/mock tests; real Foundry v14 client behavior and third-party UI compatibility remain unverified.


## 0.1.3 — 2026-10-18 (beta)

- Added a compact **Appearance** section beneath icon ordering: separate left-toolbar and right-sidebar tab-bar background, icon, and selected-icon highlight colors.
- Color customization is opt-in, user-scoped, and effective immediately. Unchecked color options leave Foundry's theme untouched.
- Added **Restore Default Colors**, independent of **Reset Icon Order**. Existing layout settings, Actors, macros and hotbar slots are unchanged.
- Added strict hexadecimal color validation, safe style removal on reset, save-failure rollback and color-specific automated tests.
- Preserved the `foundry-nav-order` module ID, GitHub repository and versioned download paths.
- Automated/mock tests passed; full Foundry v14 visual compatibility still requires GM and player tests.

## 0.1.2 — 2026-10-18 (beta naming update)

- Renamed the visible Foundry module title to **AFT Navbar Customizer** to make it easier to identify with the other AFT tools in Manage Modules.
- Preserved the original module ID `foundry-nav-order` and existing per-user settings; no duplicate module, migration or functional changes.
- Updated documentation and version-pinned GitHub release assets. The GitHub repository remains `rebsiot/navbar-customizer` to preserve URLs.
- Automated tests and package verification passed; live Foundry v14 behavior remained unconfirmed.

## 0.1.1 — 2026-10-18 (beta naming update)

- Renamed the visible module from **Foundry Navigation Organizer** to **Navbar Customizer**; internal module ID unchanged.
- Clarified enabled/disabled module status in the native Manage Modules window and pinned release installation steps.

## 0.1.0 — 2026-10-17 (initial beta)

- Added independent ordering of left toolbar categories, category tools and right sidebar tabs.
- Added per-user layouts, drag/drop, up/down buttons, automatic saves, and Reset to Defaults.
- Preserved native callbacks and player data; no world-document migration.
