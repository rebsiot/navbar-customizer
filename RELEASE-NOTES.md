# AFT Navbar+ v0.1.10 (Beta) — Saved order applies on first login

Your saved left-toolbar and right-sidebar arrangement should now appear when you enter a Foundry game, without refreshing the browser or switching Scenes.

## What's changed

- Waits for Foundry's first completed SceneControls render before replaying saved left-toolbar and subtool order when the controls weren't ready at login.
- Applies saved right-sidebar tab order when the sidebar is first created or rendered, even if that happens after the module's ready hook.
- Handles native SceneControls applications created or replaced during initial scene loading, with a one-time guarded replay instead of recurring refreshes.
- Avoids unnecessary startup rerenders when the user has no saved toolbar/Hide preferences.

## Install / upgrade

With v0.1.5 or newer installed, use **Foundry Setup > Add-on Modules > Update**. The permanent manifest remains:

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

For manual installation, back up `Data/modules/foundry-nav-order`, stop Foundry, then replace the folder contents with the complete `foundry-nav-order-0.1.10.zip` (module.json at the folder root), restart Foundry and reload the browser. Do not rename the folder or module ID. A pinned-manifest installation older than v0.1.5 needs this one-time manual transition.

Existing user preferences for ordering, visibility and colors and the GM hide-role setting remain unchanged. No Foundry Actors, Scenes, Journals, macros, hotbar slots, or world documents are migrated.

## Verification and rollback

Automated tests simulate Foundry v14 startup timing, including a toolbar rendered before ready, a sidebar created afterward, replacement controls applications and uncustomized defaults. Real Foundry v14 login testing is still required. UI replacement modules can behave differently.

To roll back, disable AFT Navbar+ and reload for Foundry defaults, or restore the previous saved module folder or the complete v0.1.9 ZIP. Existing user settings remain in place; this release does not migrate world data.

Source, prior releases and issues: https://github.com/rebsiot/navbar-customizer
