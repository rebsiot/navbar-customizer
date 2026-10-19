# Changelog

## 0.1.9 — 2026-10-18 (beta player visibility)

- Fixed a player-facing Hide/Show rendering gap: saved preferences could change the organizer to **Hidden** while module-added toolbar icons remained visible because other modules changed the prepared controls afterward.
- Added a late `getSceneControlButtons` pass applying per-user ordering and visibility after early module registration, without deleting native entries or replacing their action callbacks.
- Added scoped post-render visual reconciliation of native scene control/category/tool/tab buttons using the Foundry control element and native data attributes; originals are restored when shown, after permission revocation or during rollback.
- Added eight player-focused mock tests covering ordinary/Trusted Player roles, addon override, category and tool hiding, sidebar restoration, saving failures, exact style restoration, and permissions. The existing 61 tests remain the regression baseline.
- Preserved `foundry-nav-order`, AFT Navbar+ title, color/arrangement windows, user settings (`layout`, `visibility`, `appearance`), GM `minimumHideRole` and stable update manifest. No world-document or player-content migration.
- Real-world Foundry v14/player sessions and third-party replacement toolbar markup still require live acceptance testing.

## 0.1.8 — 2026-10-18 (beta)

- Fixed the **Tools within a category** list missing additional tools registered after AFT Navbar+'s `getSceneControlButtons` hook. The organizer now reads the fully prepared native v14 controls, with the live hook record as an early fallback.
- Added guarded post-render reconciliation to apply existing per-user order and Hide/Show preferences to late-registered native tools and categories without replacing native callbacks or rebuilding world data.
- Preserve previously hidden items in the organizer for restoration, but do not expose controls that native Foundry or another module marked unavailable for this user.
- Added regression tests using 9 module-added tools, an additional category, late hook registrations, restricted controls and a one-time non-reset refresh.
- Kept `foundry-nav-order` module ID, permanent update manifest, AFT Navbar+ display title, separate ordering/color windows, settings keys and GM hide permission unchanged.
- Automated/mock-tested; real Foundry v14 module combinations remain live-unverified.

## 0.1.7 - 2026-10-18 (beta settings split)

- Split the former combined organizer into **two independent settings entries** under AFT Navbar+: **Arrange Icon Order** (drag/drop, arrows, Hide/Show and visibility reset) and **Change Colors** (left/right color picks and native color reset).
- Renamed the settings menus and both window titles consistently to AFT Navbar+; each window now displays only controls relevant to its purpose.
- Kept existing world and user settings keys, saved values, module ID, permissions, GitHub repository and permanent update manifest. No migration, duplicate module or world-document changes.
- Preserved release gating, ZIP verification, automated regression tests and previous release notes. Live Foundry v14 integration still needs a smoke test.

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
