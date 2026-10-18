# Navbar Customizer v0.1.1 (Beta)

**Easier to find in Foundry's Manage Modules window.** The displayed name now matches the GitHub repository: **Navbar Customizer**. Previously it appeared as **Foundry Navigation Organizer**.

## What's changed

- Updated the visible module title and documentation. No gameplay behavior changed.
- Retained the existing internal module ID, `foundry-nav-order`, and user-scoped layout preferences, so this upgrades the same module rather than installing a duplicate.
- Clarified how to identify enabled and disabled modules using Foundry's native **Manage Modules** checkboxes. This organizer itself does not enable or disable modules.

## Install / upgrade

Use this version-pinned test manifest in Foundry **Setup > Add-on Modules > Install Module**:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.1/module.json`

Alternatively, download `foundry-nav-order-0.1.1.zip` and install it in `Data/modules/foundry-nav-order/` (the `module.json` must be at the folder root). Back up the existing module folder and stop Foundry before a manual replacement; then restart and refresh. Do not change the installed folder name.

**Previous v0.1.0 installs:** Their pinned manifest may not discover this update automatically. If necessary, upgrade manually, retaining the original folder and its backup.

In a running world, open **Game Settings > Manage Modules**, find **Navbar Customizer**, and confirm its checkbox is checked. Other modules' checked/unchecked states are also visible there.

## Testing and limitations

The unchanged code has automated tests, and the release workflow validates the module and ZIP. The right-sidebar behavior and actual live Foundry v14 GM/player interaction have not been confirmed; this remains a beta. No Actor, Scene, Journal, hotbar or macro data migration is performed.

Source and support: https://github.com/rebsiot/navbar-customizer
