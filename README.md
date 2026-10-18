# AFT Navbar Customizer

Arrange the left scene-control icons and right sidebar tabs in Foundry VTT. Optionally choose different background, icon and selected-icon highlight colors for each side. No icons can move from one side to the other.

**Version:** 0.1.3 beta — October 18, 2026  
**Requirements:** Foundry VTT v14; system-independent  
**Verification:** Automated/mock-tested. Not yet verified in a live Foundry v14 world.

## What you can do

- Reorder the left toolbar categories (Tokens, Tiles, Drawings and module-added controls).
- Reorder tools inside an individual left toolbar category.
- Reorder right sidebar tabs (Chat, Combat, Actors, Scenes and module-added tabs).
- Independently choose a **background**, **icon** and **active-icon highlight** color for the left toolbar or right sidebar *tab bar*.
- Keep a separate arrangement and color selection for each user in each world. Changes save automatically.
- Restore **Default Colors** without changing saved icon order, or **Reset Icon Order** without changing colors.

All color checkboxes are **off by default**, and unchecked properties use the ordinary Foundry theme. Color changes affect only the left scene controls and right sidebar tab navigation, **not** sidebar contents, other game windows or the macro hotbar. If chosen colors make icons hard to distinguish, uncheck them or use **Restore Default Colors**.

## Installation — v0.1.3 beta

In **Foundry Setup > Add-on Modules > Install Module**, paste this version-pinned manifest:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.3/module.json`

Or download the ZIP from the [v0.1.3 beta release](https://github.com/rebsiot/navbar-customizer/releases/tag/v0.1.3) and extract it directly to `Data/modules/foundry-nav-order/`, with `module.json` at that directory's root.

**Upgrading:** Back up the existing module folder; stop Foundry before manual replacement; restart Foundry and refresh the client. The module ID remains `foundry-nav-order`. This is **not** a new/additional module. Existing v0.1.0–v0.1.2 icon order preferences are retained. Earlier manifests use version-pinned URLs and may not discover upgrades automatically. In the St. Louis installation, the Samba path is `Z:\Data\modules\foundry-nav-order`.

## Use

1. Enable **AFT Navbar Customizer** in your test world under **Game Settings > Manage Modules** (as GM).
2. Open a Scene, then choose **Game Settings > Configure Settings > Module Settings > Arrange Icons**.
3. Drag icon rows or use up/down arrows. Changing a category's tools or the right tabs is independent of the other lists.
4. In **Appearance**, tick any desired custom color and choose a color swatch. The **Left toolbar** and **Right sidebar tabs** have separate controls.
5. Use **Restore Default Colors** to turn off all custom colors. **Reset Icon Order** only resets the order. Click **Done** when finished.

Changes save for your user in the current world; another player may select a different layout and colors. Colors are displayed immediately without manually refreshing. The right sidebar's contents remain in Foundry's existing colors.

## Compatibility and beta limitations

The left toolbar uses native v14 scene-control ordering fields. Sidebar tabs use their existing DOM nodes (no replacement of native actions). Styling targets Foundry's v14 `#scene-controls` and sidebar tab navigation structure. UI replacement modules may change those elements, so third-party themes can conflict. The **right-sidebar tab bar**, dynamic third-party tabs, highlighted controls and GM/player color persistence still need real v14 checks.

This module does **not** modify game documents, Actors, Scenes, Journals, macros, hotbar placements, or module activation state. It stores separate user-scoped `layout` (existing) and `appearance` (new) settings. Colors use strict six-digit hex validation, and no custom CSS code can be entered.

## Rollback

Disable the module and reload the client to return to Foundry's ordinary icon order and colors. A manual rollback to [v0.1.2](https://github.com/rebsiot/navbar-customizer/releases/tag/v0.1.2) is possible using the backed-up module folder or earlier complete ZIP. v0.1.2 ignores the new appearance setting; if returning to v0.1.3 later, the saved color choices may reappear. Use **Restore Default Colors** before downgrading if you want to clear them. Code rollback does not require a world-data restoration because no world documents are migrated.

## Source, support and license

- [Source repository](https://github.com/rebsiot/navbar-customizer)
- [Issues and support](https://github.com/rebsiot/navbar-customizer/issues)
- [Release history](CHANGELOG.md)
- Automated local checks: `npm run check` and `npm test` with Node 22+.

No public software redistribution license has been selected. The repository and release do not include licensed creator art, credentials, world data, or player-private information. This GitHub beta is not an official Foundry package listing.
