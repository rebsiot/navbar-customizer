import { NavOrganizerApp } from "./organizer.mjs";
import {
  APPEARANCE_SETTING_KEY, DEFAULT_APPEARANCE,
  initializeAppearanceFromSettings, appearanceSettingsChanged
} from "./appearance.mjs";
import {
  MODULE_ID, SETTING_KEY, initializeLayoutFromSettings,
  settingsChanged, updateSceneControls, sidebarRendered, attachSidebarEvents
} from "./runtime.mjs";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, SETTING_KEY, {
    name: "Navigation Icon Order",
    hint: "Your independent left-toolbar, subtool, and right-sidebar icon order.",
    scope: "user",
    config: false,
    type: Object,
    default: { version: 1, left: [], tools: {}, right: [] },
    onChange: settingsChanged
  });

  game.settings.register(MODULE_ID, APPEARANCE_SETTING_KEY, {
    name: "Navigation Bar Appearance",
    hint: "Optional color preferences for each user's left toolbar and right sidebar tabs.",
    scope: "user",
    config: false,
    type: Object,
    default: DEFAULT_APPEARANCE,
    onChange: appearanceSettingsChanged
  });

  game.settings.registerMenu(MODULE_ID, "arrangeIcons", {
    name: "Arrange Icons and Colors",
    label: "Arrange Icons",
    hint: "Change icon order and optional colors for your own Foundry interface.",
    icon: "fa-solid fa-grip-vertical",
    type: NavOrganizerApp,
    restricted: false
  });
});

Hooks.on("getSceneControlButtons", updateSceneControls);
Hooks.on("renderSidebar", sidebarRendered);

Hooks.once("ready", () => {
  initializeLayoutFromSettings();
  initializeAppearanceFromSettings();
  attachSidebarEvents();
  console.info(`${MODULE_ID} | v0.1.3 loaded. Open Configure Settings > Module Settings > Arrange Icons.`);
});
