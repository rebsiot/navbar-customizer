import { EMPTY_LAYOUT, normalizeLayout, sortedEntries, applySceneOrders, orderedIds, reorderTabElements } from "./layout.mjs";
import { applySceneVisibility, applySidebarVisibility, canUserHide, getVisibility } from "./visibility.mjs";

export const MODULE_ID = "foundry-nav-order";
export const SETTING_KEY = "layout";

let currentLayout = normalizeLayout(EMPTY_LAYOUT);
let confirmedLayout = normalizeLayout(EMPTY_LAYOUT);
let writeQueue = Promise.resolve();
let pendingWrites = 0;
let initialized = false;
let observedControls = null;
const sidebarBaselines = new WeakMap();

const TAB_NAMES = {
  chat: "Chat", combat: "Combat", scenes: "Scenes", actors: "Actors",
  items: "Items", journal: "Journal", tables: "Roll Tables",
  cards: "Cards", playlists: "Playlists", compendium: "Compendiums",
  settings: "Settings", macros: "Macros"
};

function warn(message, error) {
  console.warn(`${MODULE_ID} | ${message}`, error ?? "");
}

export function localizedLabel(label, fallback = "") {
  const candidate = (typeof label === "string" && label.trim()) ? label : fallback;
  if (!candidate) return "Unknown";
  try {
    const translated = game.i18n.localize(candidate);
    if (translated && translated !== candidate) return translated;
  } catch (_error) { /* Localization not yet available. */ }
  return candidate.includes(".") && fallback ? fallback : candidate;
}

export function getLayout() {
  return normalizeLayout(currentLayout);
}

function getSidebarRoot() {
  try {
    const el = ui.sidebar?.element;
    if (el && typeof el.querySelectorAll === "function") return el;
  } catch (_error) { /* Sidebar has not rendered yet. */ }
  return document.getElementById("sidebar");
}

/** Locate just the sidebar tab navigation, never content tabs in inner sheets. */
export function findSidebarNavigation() {
  const root = getSidebarRoot();
  if (!root) return null;
  const selectors = '#sidebar-tabs, .sidebar-tabs, nav.tabs, nav[role="tablist"], [data-application-part="tabs"], nav, [role="tablist"]';
  const candidates = [root, ...root.querySelectorAll(selectors)];
  const names = new Set(Object.keys(ui.sidebar?.constructor?.TABS ?? {}));
  let best = null;
  let bestScore = -1;
  for (const container of candidates) {
    if (!container.children || typeof container.insertBefore !== "function") continue;
    const entries = [];
    for (const child of container.children) {
      let clickable = child;
      if (!clickable.dataset?.tab) {
        const descendants = child.querySelectorAll?.("[data-tab]") ?? [];
        if (descendants.length !== 1) continue;
        clickable = descendants[0];
      }
      const id = clickable.dataset?.tab;
      if (!id || entries.some(entry => entry.id === id)) continue;
      entries.push({ id, element: child, clickable });
    }
    if (entries.length < 2) continue;
    const matches = entries.filter(entry => names.has(entry.id)).length;
    if (names.size && matches < 2) continue;
    const score = matches * 10 + (container.id === "sidebar-tabs" ? 100 : 0) +
      (container.tagName === "NAV" ? 30 : 0) + entries.length;
    if (score > bestScore) {
      best = { container, entries };
      bestScore = score;
    }
  }
  return best;
}

export function getRightTabs() {
  const nav = findSidebarNavigation();
  const descriptors = ui.sidebar?.constructor?.TABS ?? {};
  const available = nav ? nav.entries.map(entry => entry.id) : Object.keys(descriptors)
    .filter(id => !descriptors[id]?.gmOnly || game.user?.isGM);
  return available.map(id => {
    const desc = descriptors[id] ?? {};
    const navItem = nav?.entries.find(entry => entry.id === id)?.clickable;
    const title = desc.tooltip || navItem?.getAttribute?.("aria-label") ||
      navItem?.getAttribute?.("title") || TAB_NAMES[id] || id;
    return { id, title: localizedLabel(title, TAB_NAMES[id] || id), icon: desc.icon || "fa-solid fa-folder" };
  });
}

export function getLeftControls() {
  const source = observedControls ?? ui.controls?.controls ?? {};
  return sortedEntries(source);
}

export function getToolsFor(controlId) {
  const source = observedControls ?? ui.controls?.controls ?? {};
  return sortedEntries(source[controlId]?.tools);
}

function applyRightOrder() {
  const nav = findSidebarNavigation();
  if (!nav) return false;
  const { container, entries } = nav;
  if (!sidebarBaselines.has(container)) sidebarBaselines.set(container, entries.map(entry => entry.id));
  const native = sidebarBaselines.get(container);
  // A blank user preference means Foundry's original order for this exact DOM.
  const saved = currentLayout.right.length ? currentLayout.right : native;
  const desired = orderedIds(saved, native.concat(entries.map(entry => entry.id)));
  const reordered = reorderTabElements(container, entries, desired);
  applySidebarVisibility(entries, getVisibility(), canUserHide());
  return reordered;
}

export function applyLayoutToUI({ left = true, right = true } = {}) {
  if (right) {
    try { applyRightOrder(); } catch (error) { warn("Could not reorder sidebar tabs", error); }
  }
  if (left) {
    const controls = ui.controls;
    if (controls?.render) {
      Promise.resolve(controls.render({ reset: true }))
        .catch(error => warn("Could not refresh scene controls", error));
    }
  }
}

export async function saveLayout(value) {
  const next = normalizeLayout(value);
  currentLayout = next;
  applyLayoutToUI();
  // Serializes rapid drops / arrow clicks, preventing an older save winning a race.
  pendingWrites++;
  const work = writeQueue.catch(() => undefined).then(async () => {
    try {
      await game.settings.set(MODULE_ID, SETTING_KEY, next);
      confirmedLayout = normalizeLayout(next);
    } catch (error) {
      if (currentLayout === next) {
        currentLayout = normalizeLayout(confirmedLayout);
        applyLayoutToUI();
      }
      throw error;
    } finally {
      pendingWrites--;
    }
  });
  writeQueue = work;
  return work;
}

export async function resetLayout() {
  return saveLayout(EMPTY_LAYOUT);
}

export function initializeLayoutFromSettings() {
  try {
    const initial = normalizeLayout(game.settings.get(MODULE_ID, SETTING_KEY));
    currentLayout = initial;
    confirmedLayout = normalizeLayout(initial);
  } catch (error) { warn("Could not read user layout", error); }
  initialized = true;
  applyLayoutToUI({ left: true, right: true });
}

export function settingsChanged(value) {
  if (!initialized || pendingWrites) return;
  currentLayout = normalizeLayout(value);
  confirmedLayout = normalizeLayout(value);
  applyLayoutToUI();
}

export function updateSceneControls(controls) {
  // Snapshot before our mutations: keep the real control/tool labels and defaults.
  observedControls = Object.fromEntries(Object.entries(controls ?? {}).map(([id, control]) => [id, {
    ...control,
    tools: control?.tools ? Object.fromEntries(Object.entries(control.tools).map(([key, value]) => [key, { ...value }])) : {}
  }]));
  applySceneOrders(controls, currentLayout);
  applySceneVisibility(controls, getVisibility(), canUserHide());
}

export function attachSidebarEvents() {
  const sidebar = ui.sidebar;
  if (!sidebar?.addEventListener) return;
  sidebar.addEventListener("render", () => {
    // Resolve from the next microtask in case other module render hooks add tabs.
    queueMicrotask(() => {
      try { applyRightOrder(); } catch (error) { warn("Sidebar render ordering failed", error); }
    });
  });
}

export function sidebarRendered() {
  queueMicrotask(() => {
    try { applyRightOrder(); } catch (error) { warn("Sidebar tab ordering failed", error); }
  });
}
