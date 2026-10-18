# AFT Navbar+ v0.1.8 (Beta) — Missing module toolbar tools

The **Arrange Icon Order** window can now find tools added by other modules to the selected toolbar category. Previously it could show only the core tools because AFT Navbar+ captured the toolbar list before other modules had finished adding their controls.

## What's fixed

- The category and subtool lists use Foundry v14's prepared scene controls, including tools/categories added by later native hook subscribers.
- Saved ordering and per-user Hide/Show preferences are re-applied to late-added tools after render, with a guarded one-time refresh. Native buttons and their actions remain unchanged.
- Hidden tools remain available in the organizer for restoring. Foundry/user-inaccessible controls remain excluded.
- Separate **Arrange Icon Order** and **Change Colors** settings, your saved colors, GM hide permissions and existing module ID are unchanged.

## Install / update

Use Foundry Setup → Add-on Modules → Update if already on v0.1.5 or newer. The existing permanent manifest automatically offers this version:

`https://raw.githubusercontent.com/rebsiot/navbar-customizer/update-channel/module.json`

For a manual update, download the complete `foundry-nav-order-0.1.8.zip`, back up `Data/modules/foundry-nav-order`, stop Foundry, replace its contents, restart, and refresh the client. Do not create a differently named module folder. See README for upgrades from earlier pinned-manifest versions.

## Known limitations / verification

Automated syntax and mock tests cover multiple third-party native `getSceneControlButtons` additions, hide/order persistence, permission filtering and avoiding redraw loops. No actual Foundry v14 GM/player test has yet run. Modules that inject toolbar buttons directly into DOM outside Foundry's native control registry may still be absent from the organizer; third-party themes can also affect layout.

Rollback: restore the previous complete module folder or v0.1.7 ZIP. Preferences remain stored under the same user/world setting keys; no world-document migration occurs.

Source and issues: https://github.com/rebsiot/navbar-customizer
