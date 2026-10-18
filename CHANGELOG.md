# Changelog

## 0.1.1 — 2026-10-18 (beta naming update)

- Changed the visible module name from **Foundry Navigation Organizer** to **Navbar Customizer**, consistent with the GitHub repository.
- Kept the existing `foundry-nav-order` module ID, all user layout settings, and the same functionality. No world data or settings migration.
- Clarified how to check whether this and other installed modules are enabled in Foundry's built-in Manage Modules panel.
- Updated release links and install/upgrade instructions; existing v0.1.0 installation manifest is pinned, so a manual update may be required.
- Automated tests passed; real Foundry v14 UI behavior remains unverified.

## 0.1.0 — 2026-10-17 (test build)

- Added user-scoped left scene category ordering, with independent ordering of the tools in each category.
- Added right sidebar tab ordering without moving icons between sides.
- Added an Arrange Icons window in Configure Settings, with drag-and-drop, up/down buttons, automatic save and Reset to Defaults.
- Preserved existing Foundry UI actions, user macro/hotbar data, and world documents.
- Foundry v14 public API fields reviewed; automated tests and live compatibility status are in the companion test report.
- **Live verification required:** real GM/player v14 interface, right sidebar re-render, module-added tabs, and user-scoped settings across devices.
