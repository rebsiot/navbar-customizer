# AFT Navbar+

Arrange, recolor, and optionally hide icons in Foundry VTT’s left scene toolbar and right sidebar. Hidden icons can always be restored. Changes affect only your own interface; nothing moves between sides.

**Version:** 0.1.10 beta — October 18, 2026  
**Previously named:** AFT Navbar Customizer; the module ID and your saved settings are unchanged.  
**Requirements:** Foundry VTT v14; system-independent  
**Verification:** Automated/mock-tested. Not yet verified in a live Foundry v14 world.

## What you can do

**Separate settings entries:** **Arrange Icon Order** handles moving and hiding; **Change Colors** handles appearance. Both are under the **AFT Navbar+** heading in Foundry's Module Settings.

- Reorder the left toolbar categories (Tokens, Tiles, Drawings and module-added controls).
- Reorder tools inside an individual left toolbar category.
- Reorder right sidebar tabs (Chat, Combat, Actors, Scenes and module-added tabs).
- Apply saved ordering automatically when entering a game; no manual browser refresh or scene switch should be needed.
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

**Already on v0.1.5–v0.1.9:** Use Setup > Add-on Modules > Update. The permanent manifest is unchanged and advertises v0.1.10. This release fixes first-login order timing; it does not create a second module.

**Upgrading from v0.1.0–v0.1.4:** Those installs include a manifest pinned to an old GitHub release, so their Update button cannot discover this version. Make a backup and **do one manual transition**:

1. Stop Foundry and back up your existing `Data/modules/foundry-nav-order/` folder.
2. Download the [complete v0.1.10 ZIP](https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.10/foundry-nav-order-0.1.10.zip) and extract its contents into that same folder (do not create an additional directory).
3. Restart Foundry and refresh the browser. Verify that Setup shows **AFT Navbar+ v0.1.10**. After that, Update will follow the permanent manifest link.

Alternatively, if you can safely edit the installed `Data/modules/foundry-nav-order/module.json`, back it up and replace **only** its `manifest` URL with the permanent link above. Restart Foundry, then use **Setup > Add-on Modules > Update** for AFT Navbar+; it should find v0.1.10 without manually replacing the ZIP. Do not change the module ID, version or download fields yourself.

For the St. Louis Samba installation, the folder is `Z:\Data\modules\foundry-nav-order`. Only module code is replaced; existing world data and per-user settings are not migrated. Avoid uninstalling/reinstalling unless otherwise necessary.

**How the permanent URL works:** GitHub publishes the numbered release ZIP and validates the release assets first; only then does the automated workflow update the `update-channel` manifest to point to it. Failed builds and unreleased work on `main` are not advertised as installable updates. Individual release archives stay version-pinned for rollback.

## Use

1. Enable **AFT Navbar+** in your test world under **Game Settings > Manage Modules** (as GM).
2. Open a Scene and go to **Game Settings > Configure Settings > Module Settings > AFT Navbar+**.
3. Select **Arrange Icon Order** to move toolbar categories, subtools and right sidebar tabs with the up/down arrows or drag-and-drop. If your GM permits, use the eye buttons to Hide/Show, or **Restore All Hidden Icons**. Use **Reset Icon Order** only to reset order.
4. Return to the **AFT Navbar+** module settings and select **Change Colors**. Choose backgrounds, icon colors and active highlights for the left and right navigation bars independently. Use **Restore Default Colors** to clear only color preferences.
5. Each window has its own **Done** button. Both windows save automatically for your user; changes in one window do not reset the other settings.

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

## Player Hide/Show visual synchronization (v0.1.9)

Some combinations of Foundry v14 and other interface modules can re-enable a toolbar button after AFT's original visibility hook, so the organizer indicates **Hidden** while the button remains on screen. v0.1.9 adds a late native hook pass plus a reversible client-side presentation fallback. The fallback only touches identifiable buttons within Foundry's own SceneControls area (native `data-control`, `data-tool` or `data-tab` attributes). It never unregisters actions, changes Foundry permissions, removes world documents or affects another user's display.

The fallback preserves original inline display and `aria-hidden` values when an icon is shown again or a GM withdraws Hide/Show permission. This applies to both ordinary Players and Trusted Players, provided the GM selected an appropriate **Who Can Hide Icons** minimum role. Sidebar tabs still use their existing native DOM-based visibility handling; the **Settings** tab cannot be hidden. If a module replaces the toolbar with custom markup lacking native identifiers, additional module-specific compatibility work may be necessary.

## Module-added toolbar controls (fixed in v0.1.8)

The **Tools within a category** list now reads Foundry v14's fully prepared scene controls rather than an early snapshot taken before all modules finish adding buttons. AFT Navbar+ can therefore list native and module-added controls together, including controls added by a later `getSceneControlButtons` hook. Previously missing tools may now appear when choosing **Token Controls** or another category. This does not change your existing saved icon order or hidden/color preferences.

When a module adds a tool after AFT Navbar+'s hook has run, AFT can re-apply your saved position and hide preference to the prepared controls, then request one guarded refresh without resetting that prepared record. Action callbacks and tool names/IDs are left intact. Module controls built **outside** Foundry's native scene-control registry, such as direct ad-hoc DOM insertions, are not automatically supported. Third-party compatibility still needs a real Foundry v14 world test.

## Compatibility and beta limitations

The left toolbar uses native v14 scene-control ordering/visibility fields plus a scoped DOM fallback for late-rendered buttons. Sidebar tabs use their existing DOM nodes (no replacement of native actions). Styling targets Foundry's v14 `#scene-controls` and sidebar tab navigation structure. UI replacement modules may change those elements, so third-party themes can conflict. The **right-sidebar tab bar**, dynamic third-party tabs, hidden active tools, permission changes, highlighted controls and GM/player color persistence still need real v14 checks.

This module does **not** modify game documents, Actors, Scenes, Journals, macros, hotbar placements, or module activation state. It stores separate user-scoped `layout`, `appearance`, and `visibility` settings, plus one GM-controlled world setting for hiding access. Colors use strict six-digit hex validation, and no custom CSS code can be entered.

## Rollback

Disable the module and reload the client to return to Foundry's ordinary icon order, visibility and colors. A manual rollback to [v0.1.8](https://github.com/rebsiot/navbar-customizer/releases/tag/v0.1.8) is possible using the backed-up module folder or earlier complete ZIP. A code rollback to v0.1.8 retains Hide/Show and addon tool discovery, but may restore the player visibility issue. Disable the module and reload for immediate UI rollback; do not remove saved settings unless you intentionally reset them. Existing colors/order are preserved. Code rollback does not require a world-data restoration because no world documents are migrated.

## Source, support and license

- [Source repository](https://github.com/rebsiot/navbar-customizer)
- [Issues and support](https://github.com/rebsiot/navbar-customizer/issues)
- [Release history](CHANGELOG.md)
- Automated local checks: `npm run check` and `npm test` with Node 22+.

No public software redistribution license has been selected. The repository and release do not include licensed creator art, credentials, world data, or player-private information. This GitHub beta is not an official Foundry package listing. Future releases are available with Foundry’s normal Update command via the permanent manifest.
