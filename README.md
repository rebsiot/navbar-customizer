# AFT Navbar+

Arrange, recolor, and optionally hide icons in Foundry VTT’s left scene toolbar and right sidebar. Hidden icons can always be restored. Changes affect only your own interface; nothing moves between sides.

**Version:** 0.1.6 beta — October 18, 2026  
**Previously named:** AFT Navbar Customizer; the module ID and your saved settings are unchanged.  
**Requirements:** Foundry VTT v14; system-independent  
**Verification:** Automated/mock-tested. Not yet verified in a live Foundry v14 world.

## What you can do

- Reorder the left toolbar categories (Tokens, Tiles, Drawings and module-added controls).
- Reorder tools inside an individual left toolbar category.
- Reorder right sidebar tabs (Chat, Combat, Actors, Scenes and module-added tabs).
- Independently choose a **background**, **icon** and **active-icon highlight** color for the left toolbar or right sidebar *tab bar*.
- Hide or show individual left categories, left subtools or right sidebar tab icons using an eye button next to the up/down arrows. Hidden entries remain in the organizer.
- GMs can allow hiding for **GMs only** (default), **Trusted Players and above**, or **All Players** through a world setting.
- Keep separate ordering, visibility and colors for each user in each world. Changes save automatically.
- **Restore All Hidden Icons** without resetting icon order or colors. The Settings tab is never hideable, keeping this action reachable.
- Restore **Default Colors** without changing visibility or saved icon order, or **Reset Icon Order** without changing hiding or colors.

All color checkboxes are **off by default**, and unchecked properties use the ordinary Foundry theme. Color changes affect only the left scene controls and right sidebar tab navigation, **not** sidebar contents, other game windows or the macro hotbar. If chosen colors make icons hard to distinguish, uncheck them or use **Restore Default Colors**.

## Install and keep updating

Use this **permanent Foundry manifest URL**. It will not change for future releases:

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

In **Foundry Setup > Add-on Modules > Install Module**, paste that link and install. The Foundry **Update** or **Update All** action will then check it for new versions. Foundry does not install updates unattended.

**Already on v0.1.5:** Use Setup > Add-on Modules > Update. The permanent manifest is unchanged and should offer v0.1.6. This update renames only the displayed module and settings; it does not create a second module.

**Upgrading from v0.1.0–v0.1.4:** Those installs include a manifest pinned to an old GitHub release, so their Update button cannot discover this version. Make a backup and **do one manual transition**:

1. Stop Foundry and back up your existing `Data/modules/foundry-nav-order/` folder.
2. Download the [complete v0.1.6 ZIP](https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.6/foundry-nav-order-0.1.6.zip) and extract its contents into that same folder (do not create an additional directory).
3. Restart Foundry and refresh the browser. Verify that Setup shows **AFT Navbar+ v0.1.6**. After that, Update will follow the permanent manifest link.

Alternatively, if you can safely edit the installed `Data/modules/foundry-nav-order/module.json`, back it up and replace **only** its `manifest` URL with the permanent link above. Restart Foundry, then use **Setup > Add-on Modules > Update** for AFT Navbar+; it should find v0.1.6 without manually replacing the ZIP. Do not change the module ID, version or download fields yourself.

For the St. Louis Samba installation, the folder is `Z:\Data\modules\foundry-nav-order`. Only module code is replaced; existing world data and per-user settings are not migrated. Avoid uninstalling/reinstalling unless otherwise necessary.

**How the permanent URL works:** GitHub publishes the numbered release ZIP and validates the release assets first; only then does the automated workflow update the `update-channel` manifest to point to it. Failed builds and unreleased work on `main` are not advertised as installable updates. Individual release archives stay version-pinned for rollback.

## Use

1. Enable **AFT Navbar+** in your test world under **Game Settings > Manage Modules** (as GM).
2. Open a Scene, then choose **Game Settings > Configure Settings > Module Settings > Arrange Icons**.
3. Drag icon rows or use up/down arrows. When permitted, press the **eye icon** beside a row to **Hide** it; press the eye again to **Show** it. Hidden rows remain listed, marked “Hidden.”
4. In **Appearance**, tick any desired custom color and choose a color swatch. The **Left toolbar** and **Right sidebar tabs** have separate controls.
5. Use **Restore All Hidden Icons** to show everything you hid, **Restore Default Colors** to remove custom colors, or **Reset Icon Order** for the icon order. These operations are independent. Click **Done** when finished.

Changes save for your user in the current world; another player may select a different layout and colors. Colors are displayed immediately without manually refreshing. The right sidebar's contents remain in Foundry's existing colors.

## GM permission for hiding icons

In a running world, a GM opens **Game Settings > Configure Settings > Module Settings** and changes **Who Can Hide Icons**:

| Choice | May hide/show |
|---|---|
| **GM only** (default) | Game Masters |
| **Trusted Players and above** | Trusted Players, Assistant GMs and GMs |
| **All Players and above** | Players, Trusted Players, Assistant GMs and GMs |

This controls only **Hide/Show** and **Restore All Hidden Icons**. Ordering and colors remain available to every user. When access is revoked, any previously hidden icons are shown again; the user's hidden preferences remain saved and become effective if access is granted again. Each user hides only their own icons. This is a **visual preference**, not a security boundary or Foundry permission replacement; hiding a tab does not prevent opening the underlying document by another supported path.

**Safety:** The **Settings** sidebar tab cannot be hidden. When hiding the currently active sidebar tab, the module tries to activate Settings first. If it cannot switch safely, it keeps the active icon visible instead. A tab that is hidden in your interface remains registered in Foundry.

## Compatibility and beta limitations

The left toolbar uses native v14 scene-control ordering and visibility fields. Sidebar tabs use their existing DOM nodes (no replacement of native actions). Styling targets Foundry's v14 `#scene-controls` and sidebar tab navigation structure. UI replacement modules may change those elements, so third-party themes can conflict. The **right-sidebar tab bar**, dynamic third-party tabs, hidden active tools, permission changes, highlighted controls and GM/player color persistence still need real v14 checks.

This module does **not** modify game documents, Actors, Scenes, Journals, macros, hotbar placements, or module activation state. It stores separate user-scoped `layout`, `appearance`, and `visibility` settings, plus one GM-controlled world setting for hiding access. Colors use strict six-digit hex validation, and no custom CSS code can be entered.

## Rollback

Disable the module and reload the client to return to Foundry's ordinary icon order, visibility and colors. A manual rollback to [v0.1.4](https://github.com/rebsiot/navbar-customizer/releases/tag/v0.1.4) is possible using the backed-up module folder or earlier complete ZIP. A code rollback to v0.1.4 retains the existing visibility feature and user preferences. Disable the module and reload for immediate UI rollback; do not remove saved settings unless you intentionally reset them. Existing colors/order are preserved. Code rollback does not require a world-data restoration because no world documents are migrated.

## Source, support and license

- [Source repository](https://github.com/rebsiot/navbar-customizer)
- [Issues and support](https://github.com/rebsiot/navbar-customizer/issues)
- [Release history](CHANGELOG.md)
- Automated local checks: `npm run check` and `npm test` with Node 22+.

No public software redistribution license has been selected. The repository and release do not include licensed creator art, credentials, world data, or player-private information. This GitHub beta is not an official Foundry package listing. Future releases are available with Foundry’s normal Update command via the permanent manifest.
