# AFT Navbar Customizer v0.1.3 (Beta) — Optional navbar colors

Choose the look of the left scene toolbar and right sidebar tabs without affecting anyone else's preferences. Existing icon ordering remains unchanged.

## What's new

- **Appearance** section in **Arrange Icons** for the left toolbar and right sidebar tabs.
- Separate background, icon and active-icon highlight color choices on each side.
- All colors start disabled; no changes to Foundry's theme unless a user enables a color.
- **Restore Default Colors** removes only color changes. **Reset Icon Order** still handles the existing layout separately.
- Per-user preferences persist across browsers within the same world.

## Install or upgrade

Use the v0.1.3 beta manifest in **Foundry Setup > Add-on Modules > Install Module**:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.3/module.json`

Or install the full `foundry-nav-order-0.1.3.zip` into `Data/modules/foundry-nav-order/`. Back up the module folder and stop the server before manual replacement; then restart and reload clients. Versions 0.1.0–0.1.2 used pinned manifests and might require manual updating. **Do not rename the installed folder:** the module ID is still `foundry-nav-order`.

## Compatibility and verification

Foundry v14 target, system-independent. Automated syntax, unit/mocked UI and ZIP checks passed. Real Foundry GM/player operation, sidebar UI replacement modules and third-party styling have **not** yet been verified. This is a beta, not a live-confirmed release. No Actor, Scene, Journal, macro or hotbar data is migrated.

## Rollback

Disable the module and reload for native styling and ordering, or restore the saved previous module folder/v0.1.2 complete ZIP. Color settings stored under the v0.1.3 user preference are ignored by v0.1.2, not deleted; use **Restore Default Colors** before downgrading to clear them deliberately.

Source and issues: https://github.com/rebsiot/navbar-customizer
