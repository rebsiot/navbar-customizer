# AFT Navbar Customizer v0.1.2 (Beta)

This update changes the name shown in Foundry's **Manage Modules** list to **AFT Navbar Customizer**. It is a naming-only update; the icon ordering features work the same as the previous beta.

## What's changed

- The module now appears as **AFT Navbar Customizer** instead of Navbar Customizer.
- The GitHub release and installation instructions use the same title.
- The internal ID remains `foundry-nav-order`, so upgrading does not install a second module or erase any per-user layout settings.
- No changes to Actors, Scenes, Journals, macros, or the macro hotbar.

## Install / upgrade

In Foundry **Setup > Add-on Modules > Install Module**, paste the pinned beta manifest:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.2/module.json`

Or download `foundry-nav-order-0.1.2.zip` from this release and install it in `Data/modules/foundry-nav-order/`. Back up the existing folder and stop Foundry before manual replacement, then restart Foundry and refresh browser clients. Do not rename the installed folder.

**Existing v0.1.0/v0.1.1 installations:** Older version-pinned manifests may not discover the upgrade automatically. If needed, install the updated manifest or replace the existing module folder with the complete v0.1.2 ZIP, preserving the original folder path.

Inside a running world, a GM can check **Game Settings > Manage Modules**. A checked **AFT Navbar Customizer** entry means it is enabled in that world. Other installed modules' checked/unchecked states are displayed independently.

## Verification and limitations

The project release workflow runs syntax checks, automated mock tests, and ZIP-integrity checks. Real Foundry v14 GM/player testing of the icon-ordering controls remains pending, particularly right sidebar re-renders and third-party tabs. This release does not alter module activation state.

Source: https://github.com/rebsiot/navbar-customizer
