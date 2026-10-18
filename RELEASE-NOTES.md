# AFT Navbar+ v0.1.6 (Beta) — Name update

The module is now called **AFT Navbar+** in Foundry's module list and settings. The configuration window, messages, and GitHub release use the same name.

## What's changed

- Renamed the visible module title and settings entry from **AFT Navbar Customizer** to **AFT Navbar+**.
- Kept the existing module ID `foundry-nav-order`, installation folder, GitHub URL and permanent manifest. This is an update to the same module, not a second installation.
- Icon order, Hide/Show, player/Trusted Player permissions, colors and user preferences are unchanged. No Actor, Scene, Journal, macro or hotbar data is migrated.

## Install / upgrade

If you already have **v0.1.5**, use **Foundry Setup > Add-on Modules > Update**. The permanent manifest automatically offers this release once the verified ZIP is published.

For a new installation, use the *same permanent manifest*:

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

If your installed version is **v0.1.0–v0.1.4**, it may still use a version-pinned manifest. Back up `Data/modules/foundry-nav-order`, stop Foundry and install the complete v0.1.6 ZIP into the existing folder, or back up and update only the installed manifest URL to the permanent URL, then restart and run Update. Do not rename the module directory or uninstall it. Hard-refresh browser clients after updating.

## Compatibility and verification

Foundry v14 target, system-independent. Automated tests, archive validation and release-channel promotion are checked by GitHub Actions. The live Foundry GM/Trusted Player/Player interface remains unverified. Disable the module and reload to restore native UI, or restore the backed-up previous module folder for code rollback.

Source: https://github.com/rebsiot/navbar-customizer
