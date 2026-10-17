# Foundry Navigation Organizer v0.1.0 (Beta)

Rearrange the existing icons on either side of Foundry's interface without moving icons between sides. Each user can keep a separate layout.

## What's included

- Order left scene-control categories and each category's tools independently.
- Reorder right sidebar tabs, including tabs added by other modules.
- Open **Arrange Icons** in Module Settings; use drag-and-drop or up/down controls.
- Automatically save user preferences and use **Reset to Defaults** to restore normal order.
- No changes to macros, hotbar slots, Actors, Scenes or world documents.

## Before installing

**Beta for Foundry v14.** Automated/mock tests passed, but no live Foundry v14 GM/player session has been confirmed. In particular, the right sidebar re-render and module-added tabs require live verification. No WoD20 dependency.

Back up any existing `Data/modules/foundry-nav-order` folder and install in a test world first. Enabling the module only stores a user-scoped icon-order setting. Disable the module and reload to restore native ordering; use **Reset to Defaults** first if you also want to clear the saved preference.

## Install

In Foundry's **Setup > Add-on Modules > Install Module**, use this pinned test manifest:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.0/module.json`

Or download the full `foundry-nav-order-0.1.0.zip` asset from this release and extract it into `Data/modules/foundry-nav-order/` (with `module.json` at the folder root).

Source and issues: https://github.com/rebsiot/navbar-customizer
