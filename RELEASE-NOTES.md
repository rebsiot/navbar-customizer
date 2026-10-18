# AFT Navbar Customizer v0.1.5 — Permanent update URL

You no longer need a new manifest URL for every release. This update fixes the module's update configuration so Foundry can discover future releases when you use **Update** or **Update All**.

## Permanent installation and update manifest

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

This URL remains the same across future module versions. Only successfully built and published releases are promoted to it. Foundry checks on demand; this does not silently install updates.

## Upgrading an existing installation

Previously installed versions (including v0.1.3 and v0.1.4) used version-pinned manifests and will **not** discover this release automatically. **Back up** your `Data/modules/foundry-nav-order` folder before changing code. Stop Foundry and extract the [v0.1.5 full ZIP](https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.5/foundry-nav-order-0.1.5.zip) directly over that same module folder (with `module.json` at the folder root); restart and reload clients. The new install can check for later releases using the normal Update command.

If you can edit the currently installed `module.json`, there is also a smaller one-time option: back it up, replace only its `manifest` field with the permanent URL above, restart Foundry, and select **Update** in Foundry Setup. The updater can then retrieve v0.1.5 itself.

## Scope and status

This is a packaging/update-path repair. There are **no changes** to hiding/showing icons, player permissions, ordering, color settings, module ID `foundry-nav-order`, or stored Foundry/world data. Roll back with the saved v0.1.4 module folder/complete ZIP if needed. Functionality remains beta: Foundry v14 GM/player live tests are still pending.

Release source, support and notes: https://github.com/rebsiot/navbar-customizer
