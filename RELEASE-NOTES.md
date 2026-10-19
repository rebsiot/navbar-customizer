# AFT Navbar+ v0.1.9 (Beta) — Player Hide/Show visibility

## Fix

Player and Trusted Player Hide/Show preferences now have an additional client-side rendering pass so that an icon marked **Hidden** is also concealed from that player's Foundry navigation UI, even when a subsequent addon overwrites the native toolbar visibility flag. The original native visibility hooks remain in place, and a late hook pass also applies preferences to tools registered after AFT Navbar+.

This is **visual customization**, not a module disable feature or a permissions control. Each user's saved `visibility` choice remains independent. Other player/GM layouts, color settings, world documents and installed module IDs are unchanged. The native Settings sidebar tab is still protected against hiding.

## Install / update

Use **Foundry Setup → Add-on Modules → Update** if your installed version is v0.1.5 or later. The permanent manifest does not change:

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

For a manual update, back up `Data/modules/foundry-nav-order` (or `Z:\Data\modules\foundry-nav-order`), stop Foundry, replace the existing folder contents with the full `foundry-nav-order-0.1.9.zip` and restart. Do not rename the module folder. Older version-pinned manifests require a one-time transition as described in README.

## Verification and limitations

Mock tests cover ordinary and Trusted Players; native and late-added categories/tools; a later addon overwriting `visible`; reversible rendering; active sidebar-tab handling; GM access revocation and failed saves. Real Foundry v14 player-browser acceptance is **not yet confirmed**. Addons that inject entirely custom toolbar DOM without Foundry's native data identifiers may still require compatibility work. Do not interpret passing mock tests as live deployment.

**First live test:** Log in as a non-GM Player while the GM has selected **All Players** under **Who Can Hide Icons**. Use **AFT Navbar+ → Arrange Icon Order** to hide an addon toolbar subtool; verify it disappears immediately, survives refresh, and returns on Show. Repeat with a Trusted Player if using the Trusted Players threshold.

**Rollback:** Restore the backed-up complete module folder or install the [v0.1.8 ZIP](https://github.com/rebsiot/navbar-customizer/releases/tag/v0.1.8). No world-data migration. Saved settings remain under the same keys.

Source and issues: https://github.com/rebsiot/navbar-customizer
