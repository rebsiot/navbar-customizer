# Navbar Customizer

Reorder the icons in Foundry VTT's left scene toolbar and right sidebar. Keep each side separate. No cross-side movement, hidden controls, or hotbar changes.

**Version:** 0.1.1 beta (2026-10-18)  
**Compatibility target:** Foundry VTT v14; any game system.  
**Status:** Automated tests passed. Not yet tested in a live Foundry v14 world.

## Features

- Move left toolbar categories (Tokens, Tiles, Drawings, etc.) into your preferred order.
- Arrange the tools within each left toolbar category separately.
- Change the order of right sidebar tabs (Chat, Combat, Actors, Scenes, module-added tabs).
- Use drag-and-drop or up/down arrows in the **Arrange Icons** window.
- Automatically save a layout for **each user in each world**, across browser sessions.
- **Reset to Defaults** without touching Actors, Scenes, macros, or document data.

## Install the v0.1.1 beta

This prerelease is for testing in Foundry v14, not a verified live release.

**Foundry installer:** In **Setup > Add-on Modules > Install Module**, paste this version-pinned manifest URL:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.1/module.json`

**Manual installation:** Download `foundry-nav-order-0.1.1.zip` from [the v0.1.1 release](https://github.com/rebsiot/navbar-customizer/releases/tag/v0.1.1), then:

1. Back up `Data/modules/foundry-nav-order`, if it exists. Use a test world.
2. Stop Foundry before replacing existing module files.
3. Extract the ZIP contents directly into `Data/modules/foundry-nav-order/`, with `module.json` at the root.
4. Restart Foundry, enable **Navbar Customizer** in the world and refresh your browser.
5. Open **Game Settings > Configure Settings > Module Settings > Arrange Icons**.

For the private St. Louis Samba deployment, modules are under `Z:\Data\modules`.

## Verify enablement in Foundry

In an active world, open **Game Settings > Manage Modules** as GM and search for **Navbar Customizer**. The checked box means it is enabled **for that world**; unchecked means installed but disabled. You can also see the activation state of the other installed modules in that window. This module does not change module enablement, and GitHub cannot read your live world's active module list.

**Upgrading from v0.1.0:** Both versions use the *same* module ID (`foundry-nav-order`). There is no second module to enable and no data migration. The v0.1.0 beta used a version-pinned manifest that may not discover later versions automatically. If it does not offer the update, back up the existing `Data/modules/foundry-nav-order` folder, stop Foundry, replace its contents with the v0.1.1 release ZIP, then restart and refresh the client. Do **not** rename the installed folder or delete character/world data.

## First use

Choose left categories, a category's tools, or right tabs, then drag rows or use the arrow buttons. Changes save automatically for the current user. Select **Done** to close the window. **Reset to Defaults** restores the native icon order on both sides for that user.

Open a Scene to populate the left category list. Controls unavailable to the current user's role do not appear. Module-added controls become available after Foundry renders them.

## How it works and limitations

Left controls use the native v14 `getSceneControlButtons` hook and `SceneControl.order`/`SceneControlTool.order` values. Right tabs are existing sidebar DOM nodes that this module reorders after rendering. Sidebar DOM structure can vary by Foundry build or UI-replacement module, so **the right sidebar still needs a real v14 smoke test**.

This module does not duplicate native controls, replace callbacks, alter active tabs intentionally, generate macros, or write to world documents. Its only persistent change is a user-scoped setting.

## Rollback

Disable the module in **Manage Modules**, then reload. Native Foundry ordering returns. To uninstall, stop Foundry and remove only `Data/modules/foundry-nav-order/`. Saved user preferences remain dormant while the module is disabled; clear them with **Reset to Defaults** before uninstalling if desired. No game-document migration is performed.

## Source, tests and support

- Source: https://github.com/rebsiot/navbar-customizer
- Local checks: `npm test` (Node 22+; no dependencies) and `npm run check`.
- Report issues: https://github.com/rebsiot/navbar-customizer/issues (include Foundry v14 build number, browser, affected UI modules and a screenshot).
- Version history: [CHANGELOG.md](CHANGELOG.md).

**Licensing:** No public software redistribution license has been selected yet. The public source repository is not an official Foundry package listing. The repository includes no licensed TC Modern artwork, characters, world data, credentials, or session material.
