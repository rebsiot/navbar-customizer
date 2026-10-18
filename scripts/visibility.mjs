/**
 * Per-user icon visibility with GM-configurable permission threshold.
 * Hiding is visual-only. It never unregisters modules, deletes callbacks,
 * changes sidebar contents, or changes native user permissions.
 */
import { normalizeLayout } from "./layout.mjs";

export const VISIBILITY_KEY = "visibility";
export const HIDE_MIN_ROLE_KEY = "minimumHideRole";
export const DEFAULT_MIN_ROLE = 4;
export const EMPTY_VISIBILITY = Object.freeze({ version: 1, left: [], tools: {}, right: [] });
const MODULE_ID = "foundry-nav-order";
const ROLE_VALUES = new Set([1, 2, 4]);
const validId = id => typeof id === "string" && id.length > 0 && id.length <= 128 &&
  !["__proto__", "prototype", "constructor"].includes(id);
const sidebarHiddenState = new WeakMap();

export function normalizeVisibility(input) {
  const value = normalizeLayout(input);
  // Keep Settings available so the organizer and its restore action stay reachable.
  value.right = value.right.filter(id => id !== "settings");
  return value;
}

export function minHideRole() {
  try {
    const configured = Number(game.settings.get(MODULE_ID, HIDE_MIN_ROLE_KEY));
    return ROLE_VALUES.has(configured) ? configured : DEFAULT_MIN_ROLE;
  } catch (_error) {
    return DEFAULT_MIN_ROLE;
  }
}

export function canUserHide(user = game.user, minimum = minHideRole()) {
  if (!user) return false;
  const role = Number.isInteger(user.role) ? user.role : (user.isGM ? 4 : 0);
  return ROLE_VALUES.has(Number(minimum)) && role >= Number(minimum);
}

export function toggleHidden(previous, area, id, controlId, hidden) {
  const next = normalizeVisibility(previous);
  if (!["left", "right", "tools"].includes(area) || !validId(id)) return next;
  if (area === "right" && id === "settings") return next;
  if (area === "tools" && !validId(controlId)) return next;
  const list = area === "tools" ? (next.tools[controlId] ??= []) : next[area];
  const index = list.indexOf(id);
  if (hidden && index < 0) list.push(id);
  if (!hidden && index >= 0) list.splice(index, 1);
  return normalizeVisibility(next);
}

export function isHidden(value, area, id, controlId) {
  const current = normalizeVisibility(value);
  if (area === "tools") return (current.tools[controlId] ?? []).includes(id);
  if (area === "left" || area === "right") return current[area].includes(id);
  return false;
}

/** Only use native `visible` fields on current-user scene controls/tools. */
export function applySceneVisibility(controls, value, allowed) {
  if (!allowed || !controls || typeof controls !== "object") return;
  const hidden = normalizeVisibility(value);
  for (const id of hidden.left) {
    if (Object.hasOwn(controls, id) && controls[id] && typeof controls[id] === "object") {
      controls[id].visible = false;
    }
  }
  for (const [controlId, tools] of Object.entries(hidden.tools)) {
    const nativeTools = controls[controlId]?.tools;
    if (!nativeTools || typeof nativeTools !== "object") continue;
    for (const toolId of tools) {
      if (Object.hasOwn(nativeTools, toolId) && nativeTools[toolId] && typeof nativeTools[toolId] === "object") {
        nativeTools[toolId].visible = false;
      }
    }
  }
}

/**
 * Preserve the *exact* native inline state of each existing sidebar tab node.
 * This is intentionally DOM-only: no tab is deregistered and native callbacks
 * are not replaced. Restores work even if a permission is later revoked.
 */
export function applySidebarVisibility(entries, value, allowed, sidebar = ui.sidebar) {
  if (!Array.isArray(entries)) return;
  const hidden = allowed ? new Set(normalizeVisibility(value).right) : new Set();
  const active = sidebar?.tabGroups?.primary;
  if (active && hidden.has(active)) {
    const fallback = entries.some(entry => entry.id === "settings") ? "settings" :
      entries.find(entry => !hidden.has(entry.id))?.id;
    if (fallback && fallback !== active && typeof sidebar?.changeTab === "function") {
      try { sidebar.changeTab(fallback, "primary"); }
      catch (error) { console.warn("foundry-nav-order | Could not switch from a hidden sidebar tab", error); }
    }
  }
  const stillActive = sidebar?.tabGroups?.primary;
  for (const { id, element } of entries) {
    if (!element) continue;
    // If a sidebar tab cannot be safely deactivated, leave its icon visible.
    const shouldHide = hidden.has(id) && (id !== stillActive || !sidebar?.tabGroups);
    const original = sidebarHiddenState.get(element);
    if (shouldHide) {
      if (!original) {
        sidebarHiddenState.set(element, {
          display: element.style?.display ?? "",
          hidden: Boolean(element.hidden),
          ariaHidden: element.getAttribute?.("aria-hidden") ?? null
        });
      }
      element.hidden = true;
      if (element.style) element.style.display = "none";
      element.setAttribute?.("aria-hidden", "true");
    } else if (original) {
      element.hidden = original.hidden;
      if (element.style) element.style.display = original.display;
      if (original.ariaHidden === null) element.removeAttribute?.("aria-hidden");
      else element.setAttribute?.("aria-hidden", original.ariaHidden);
      sidebarHiddenState.delete(element);
    }
  }
}

let current = normalizeVisibility(EMPTY_VISIBILITY);
let confirmed = normalizeVisibility(EMPTY_VISIBILITY);
let writeQueue = Promise.resolve();
let pending = 0;
let initialized = false;
let refresh = () => {};

export function getVisibility() { return normalizeVisibility(current); }

export function initializeVisibilityFromSettings(refreshUI = () => {}) {
  refresh = refreshUI;
  try {
    const saved = normalizeVisibility(game.settings.get(MODULE_ID, VISIBILITY_KEY));
    current = saved;
    confirmed = normalizeVisibility(saved);
  } catch (error) { console.warn("foundry-nav-order | Could not read hidden icons", error); }
  initialized = true;
  refresh();
}

export function visibilitySettingsChanged(value) {
  if (!initialized || pending) return;
  current = normalizeVisibility(value);
  confirmed = normalizeVisibility(value);
  refresh();
}

export function hideRoleSettingChanged() {
  if (initialized) refresh();
}

export async function saveVisibility(value) {
  if (!canUserHide()) throw new Error("You do not have permission to hide icons.");
  const next = normalizeVisibility(value);
  current = next;
  refresh();
  pending++;
  const work = writeQueue.catch(() => {}).then(async () => {
    try {
      if (!canUserHide()) throw new Error("Hiding icons is no longer permitted for your role.");
      await game.settings.set(MODULE_ID, VISIBILITY_KEY, next);
      confirmed = normalizeVisibility(next);
    } catch (error) {
      if (current === next) {
        current = normalizeVisibility(confirmed);
        refresh();
      }
      throw error;
    } finally { pending--; }
  });
  writeQueue = work;
  return work;
}

export function resetVisibility() { return saveVisibility(EMPTY_VISIBILITY); }
