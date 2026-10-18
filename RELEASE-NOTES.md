# AFT Navbar+ v0.1.7 (Beta) - Separate settings screens

The module now has **two settings entries** inside Foundry's **AFT Navbar+** section. Ordering and colors no longer share the same window.

## What's new

- **Arrange Icon Order** - drag-and-drop and arrow reordering for left toolbar categories, their tools, and right sidebar tabs. The Hide/Show eye buttons and Restore All Hidden Icons remain here for players permitted by the GM.
- **Change Colors** - a separate compact window for independently customizing backgrounds, icons and active highlights on each navigation bar; Restore Default Colors is here only.
- Both configuration windows are titled **AFT Navbar+** and have independent Done buttons. Settings names use the same branding.

## Install / upgrade

In Foundry Setup > Add-on Modules, choose **Update** for AFT Navbar+ if you already installed v0.1.5 or later through its permanent manifest:

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

Older v0.1.0-v0.1.4 installations have version-pinned manifests. Back up the existing `Data/modules/foundry-nav-order` folder, stop Foundry and replace its contents with the full v0.1.7 ZIP; alternatively update only the stored manifest URL after a backup and restart, then use Update. Refresh browser clients. Do not change the module ID or installed folder name.

## Preserved data and limitations

This is a UI organization update. The stored `layout`, `appearance`, `visibility` and `minimumHideRole` settings, GM permission choices, per-user color preferences, Actors, Scenes, Journals, macros and hotbar slots are untouched. Each reset action still affects only its own settings.

This beta passed automated tests and package validation. Two independent settings menu buttons and their exact placement still require confirmation in a real Foundry v14 GM and player session. Roll back by disabling the module or restoring the complete previous v0.1.6 folder from a backup.

Source and issues: https://github.com/rebsiot/navbar-customizer
