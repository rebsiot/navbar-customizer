# Changelog

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
