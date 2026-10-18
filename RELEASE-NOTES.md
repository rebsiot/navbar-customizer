# AFT Navbar Customizer v0.1.4 (Beta) — Hide/Show Icons

You can now hide individual icons directly beside the up/down arrows in **Arrange Icons**. Hidden entries stay listed, so you can show them again at any time.

## What's new

- Eye button beside each permitted row to **Hide** or **Show** a left toolbar category, a tool within a category, or a right sidebar tab.
- **Restore All Hidden Icons** brings back everything you've hidden. It does not reset your saved order or colors.
- A GM sets **Who Can Hide Icons** in Module Settings to **GM only** (default), **Trusted Players and above**, or **All Players**. Each user hides icons only on their own interface.
- The Settings tab always remains visible. The current active sidebar tab is switched to Settings before hiding where the native UI allows it.
- Colors and ordering from v0.1.3 remain intact. No module IDs, Actors, Scenes, Journals, macros, or module activation settings are changed.

## Install / upgrade

In Foundry **Setup > Add-on Modules > Install Module**, use this version-pinned beta manifest:

`https://github.com/rebsiot/navbar-customizer/releases/download/v0.1.4/module.json`

Or download the full `foundry-nav-order-0.1.4.zip` and extract it into `Data/modules/foundry-nav-order/`, with `module.json` at the module root. **Back up the existing module folder and stop Foundry before manual replacement**; restart and refresh client browsers afterward. Keep the existing folder and module ID `foundry-nav-order`. Older version-pinned manifests may require manual upgrading.

## Where to find it

- **Arrange Icons**: Game Settings > Configure Settings > Module Settings > Arrange Icons.
- **GM permission choice**: Game Settings > Configure Settings > Module Settings > **Who Can Hide Icons**.
- Hidden rows are visibly marked; use **Show** on a row or **Restore All Hidden Icons**.

## Limitations and rollback

**Beta**: automated tests and release-package checks do not prove real Foundry v14 behavior. Test left categories, subtools, sidebar tabs and permissions with a GM and a player, particularly when using another UI theme. Hiding is visual only, not an access-control feature.

Disable the module and reload to restore Foundry's original icon order, visibility and colors, or restore the backed-up v0.1.3 module folder. v0.1.3 ignores the new hidden-preference setting; your old visibility selection will become active again on a future v0.1.4 update unless you use **Restore All Hidden Icons** first. No world-document migration is involved.

Source: https://github.com/rebsiot/navbar-customizer
