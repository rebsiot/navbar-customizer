import { NavOrganizerApp } from "./organizer.mjs";
import {
  VISIBILITY_KEY, HIDE_MIN_ROLE_KEY, DEFAULT_MIN_ROLE, EMPTY_VISIBILITY,
  initializeVisibilityFromSettings, visibilitySettingsChanged, hideRoleSettingChanged
} from "./visibility.mjs";
import {
  APPEARANCE_SETTING_KEY, DEFAULT_APPEARANCE,
  initializeAppearanceFromSettings, appearanceSettingsChanged
} from "./appearance.mjs";
import {
  MODULE_ID, SETTING_KEY, initializeLayoutFromSettings,
  settingsChanged, updateSceneControls, sidebarRendered, attachSidebarEvents, applyLayoutToUI
} from "./runtime.mjs";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, APPEARANCE_SETTING_KEY, {
    name: "Navigation Bar Appearance",
    hint: "Optional color preferences for each user's left toolbar and right sidebar tabs.",
    scope: "user",
    config: false,
    type: Object,
    default: DEFAULT_APPEARANCE,
    onChange: appearanceSettingsChanged
  });

  game.settings.register(MODULE_ID, VISIBILITY_KEY, {
    name: "Hidden Navigation Icons",
    hint: "Your hidden icon preferences. Hidden icons can be restored through Arrange Icons.",
    scope: "user",
    config: false,
    type: Object,
    default: EMPTY_VISIBILITY,
    onChange: visibilitySettingsChanged
  });

  game.settings.register(MODULE_ID, HIDE_MIN_ROLE_KEY, {
    name: "Who Can Hide Icons",
    hint: "Allow these user roles to hide and restore icons on their own screen. Only GMs can change this world setting. Ordering and colors remain available to every user.",
    scope: "world",
    config: true,
    type: Number,
    choices: {
      4: "GM only",
      2: "Trusted Players and higher",
      1: "All Players and higher"
    },
    default: DEFAULT_MIN_ROLE,
    onChange: hideRoleSettingChanged
  });

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
    name: "AFT Navbar+ — Arrange Icons, Visibility and Colors",
    label: "Arrange Icons",
    hint: "Change icon order, optional visibility (if permitted by GM) and custom colors for your own interface.",
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
  initializeVisibilityFromSettings(applyLayoutToUI);
  attachSidebarEvents();
  console.info(`${MODULE_ID} | v0.1.6 loaded. Open Configure Settings > Module Settings > Arrange Icons.`);
});
