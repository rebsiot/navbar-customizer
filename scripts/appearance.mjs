/**
 * Optional user-specific colors for Foundry's left Scene Controls and right sidebar tabs.
 * Kept in a separate setting from saved icon ordering so older layouts survive upgrades.
 */
import { MODULE_ID } from "./runtime.mjs";

export const APPEARANCE_SETTING_KEY = "appearance";
export const APPEARANCE_STYLE_ID = "fno-custom-appearance";
export const DEFAULT_APPEARANCE = Object.freeze({
  left: Object.freeze({ background: null, icons: null, active: null }),
  right: Object.freeze({ background: null, icons: null, active: null })
});

const SIDES = ["left", "right"];
const FIELDS = ["background", "icons", "active"];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function normalizeAppearance(input) {
  const output = {
    left: { background: null, icons: null, active: null },
    right: { background: null, icons: null, active: null }
  };
  if (!input || typeof input !== "object" || Array.isArray(input)) return output;
  for (const side of SIDES) {
    const group = input[side];
    if (!group || typeof group !== "object" || Array.isArray(group)) continue;
    for (const field of FIELDS) {
      const candidate = group[field];
      if (typeof candidate === "string" && HEX_COLOR.test(candidate)) {
        output[side][field] = candidate.toLowerCase();
      }
    }
  }
  return output;
}

/**
 * CSS is only emitted for explicitly selected colors. Absent fields leave
 * Foundry's normal light/dark themes completely untouched. Values are checked
 * against a strict six-digit hex pattern before entering the stylesheet.
 *
 * The selectors are scoped to native scene-control / primary sidebar tab bars,
 * and do not recolor window contents, popped-out sheets or the macro hotbar.
 */
export function buildAppearanceCss(input) {
  const theme = normalizeAppearance(input);
  const leftRoot = ":is(#scene-controls, #controls)";
  const rightRoot = ":is(#sidebar #sidebar-tabs, #sidebar .sidebar-tabs, #sidebar > nav.tabs, #sidebar > [data-application-part=\"tabs\"])";
  const iconButtons = ":is(button, .control, .control-tool, .scene-control, .tool, [data-control], [data-tool])";
  const sidebarButtons = ":is(button, a, .item, [data-tab])";
  const leftItem = `${leftRoot} ${iconButtons}`;
  const rightItem = `${rightRoot} ${sidebarButtons}`;
  const activeState = ':is(.active, .selected, [aria-selected="true"], [aria-pressed="true"], [data-active="true"])';
  const result = [];

  for (const [side, root, item] of [
    ["left", leftRoot, leftItem],
    ["right", rightRoot, rightItem]
  ]) {
    const color = theme[side];
    if (color.background) {
      result.push(`${root}, ${item} { background-color: ${color.background} !important; }`);
    }
    if (color.icons) {
      result.push(`${item}, ${item} :is(i, svg) { color: ${color.icons} !important; }`);
    }
    if (color.active) {
      // Place last so active color takes precedence over the optional base background.
      result.push(`${item}${activeState} { background-color: ${color.active} !important; }`);
    }
  }
  return result.join("\n");
}

let currentAppearance = normalizeAppearance(DEFAULT_APPEARANCE);
let confirmedAppearance = normalizeAppearance(DEFAULT_APPEARANCE);
let appearanceWriteQueue = Promise.resolve();
let pendingAppearanceWrites = 0;
let appearanceInitialized = false;

export function getAppearance() {
  return normalizeAppearance(currentAppearance);
}

/** Replaces only this module's style element. Never modifies Foundry stylesheets. */
export function applyAppearanceToUI() {
  const css = buildAppearanceCss(currentAppearance);
  let element = document.getElementById(APPEARANCE_STYLE_ID);
  if (!css) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("style");
    element.id = APPEARANCE_STYLE_ID;
    document.head.appendChild(element);
  }
  if (element.textContent !== css) element.textContent = css;
}

export function initializeAppearanceFromSettings() {
  try {
    const fromSettings = normalizeAppearance(game.settings.get(MODULE_ID, APPEARANCE_SETTING_KEY));
    currentAppearance = fromSettings;
    confirmedAppearance = normalizeAppearance(fromSettings);
  } catch (error) {
    console.warn(`${MODULE_ID} | Could not read appearance setting`, error);
  }
  appearanceInitialized = true;
  applyAppearanceToUI();
}

export function appearanceSettingsChanged(value) {
  if (!appearanceInitialized || pendingAppearanceWrites) return;
  currentAppearance = normalizeAppearance(value);
  confirmedAppearance = normalizeAppearance(value);
  applyAppearanceToUI();
}

export async function saveAppearance(value) {
  const next = normalizeAppearance(value);
  currentAppearance = next;
  applyAppearanceToUI();
  pendingAppearanceWrites++;
  const work = appearanceWriteQueue.catch(() => undefined).then(async () => {
    try {
      await game.settings.set(MODULE_ID, APPEARANCE_SETTING_KEY, next);
      confirmedAppearance = normalizeAppearance(next);
    } catch (error) {
      if (currentAppearance === next) {
        currentAppearance = normalizeAppearance(confirmedAppearance);
        applyAppearanceToUI();
      }
      throw error;
    } finally {
      pendingAppearanceWrites--;
    }
  });
  appearanceWriteQueue = work;
  return work;
}

export function resetAppearance() {
  return saveAppearance(DEFAULT_APPEARANCE);
}
