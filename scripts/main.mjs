import { NavOrganizerApp } from "./organizer.mjs";
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

  game.settings.registerMenu(MODULE_ID, "arrangeIcons", {
    name: "Arrange Navigation Icons",
    label: "Arrange Icons",
    hint: "Drag to reorder scene controls, their tools and sidebar tabs. Saved separately for each user.",
    icon: "fa-solid fa-grip-vertical",
    type: NavOrganizerApp,
    restricted: false
  });
});

Hooks.on("getSceneControlButtons", updateSceneControls);
Hooks.on("renderSidebar", sidebarRendered);

Hooks.once("ready", () => {
  initializeLayoutFromSettings();
  attachSidebarEvents();
  console.info(`${MODULE_ID} | v0.1.0 loaded. Open Configure Settings > Module Settings > Arrange Icons.`);
});
