import { EMPTY_LAYOUT, normalizeLayout, sortedEntries, applySceneOrders, orderedIds, reorderTabElements } from "./layout.mjs";
import { applySceneVisibility, applySceneDomVisibility, applySidebarVisibility, canUserHide, getVisibility, isHidden } from "./visibility.mjs";

export const MODULE_ID = "foundry-nav-order";
export const SETTING_KEY = "layout";

let currentLayout = normalizeLayout(EMPTY_LAYOUT);
let confirmedLayout = normalizeLayout(EMPTY_LAYOUT);
let writeQueue = Promise.resolve();
let pendingWrites = 0;
let initialized = false;
let observedControls = null;
let lastHookControls = null;
let sceneRefreshPending = false;
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

/** The last hook snapshot may be incomplete: other modules can register more
 * SceneControlTool entries later during getSceneControlButtons. Foundry v14's
 * ui.controls.controls exposes the fully prepared record after those callbacks.
 * Keep the hook record as a fallback before the first render. */
function currentControlRecord() {
  let live;
  try { live = ui.controls?.controls; }
  catch (_error) { /* Controls not prepared yet. */ }
  if (live && typeof live === "object" && Object.keys(live).length) return live;
  return lastHookControls ?? observedControls ?? {};
}

/** Record newly registered entries before AFT applies any visibility changes.
 * Original availability is kept separately so GM-only entries aren't exposed
 * just because they share an id with a saved hidden preference. */
function rememberNewControls(controls) {
  if (!controls || typeof controls !== "object") return;
  if (!observedControls) observedControls = {};
  for (const [id, control] of Object.entries(controls)) {
    if (!control || typeof control !== "object") continue;
    if (!Object.hasOwn(observedControls, id)) {
      observedControls[id] = {
        ...control,
        tools: Object.fromEntries(Object.entries(control.tools ?? {})
          .filter(([, tool]) => tool && typeof tool === "object")
          .map(([key, tool]) => [key, { ...tool }]))
      };
      continue;
    }
    const knownTools = observedControls[id].tools ??= {};
    for (const [key, tool] of Object.entries(control.tools ?? {})) {
      if (tool && typeof tool === "object" && !Object.hasOwn(knownTools, key)) {
        knownTools[key] = { ...tool };
      }
    }
  }
}

/** A hidden entry remains in the settings list only if it was originally
 * available to this user. These are UI preferences, never permission grants. */
function showableEntries(record, area, controlId = null) {
  const hidden = getVisibility();
  const allowed = canUserHide();
  const originals = area === "tools" ? observedControls?.[controlId]?.tools : observedControls;
  return sortedEntries(record, { visibleOnly: false }).filter(({ id }) => {
    const candidate = record[id];
    if (candidate?.visible !== false) return true;
    const original = originals?.[id];
    return allowed && original && original.visible !== false &&
      isHidden(hidden, area, id, controlId);
  });
}

/** Some builds may omit hidden buttons from the prepared record. Keep only
 * known, user-hidden originals as a fallback, not arbitrary disabled tools. */
function includeOwnHidden(record, originals, area, controlId = null) {
  const result = { ...(record ?? {}) };
  if (!canUserHide() || !originals) return result;
  const hidden = getVisibility();
  for (const [id, original] of Object.entries(originals)) {
    if (!Object.hasOwn(result, id) && original?.visible !== false &&
      isHidden(hidden, area, id, controlId)) result[id] = original;
  }
  return result;
}

export function getLeftControls() {
  const live = currentControlRecord();
  const source = includeOwnHidden(live, observedControls, "left");
  return showableEntries(source, "left");
}

export function getToolsFor(controlId) {
  const live = currentControlRecord();
  const nativeTools = live[controlId]?.tools ?? observedControls?.[controlId]?.tools;
  const originals = observedControls?.[controlId]?.tools;
  const source = includeOwnHidden(nativeTools, originals, "tools", controlId);
  return showableEntries(source, "tools", controlId);
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
    try { applySceneDomVisibility(); } catch (error) { warn("Could not apply scene icon visibility", error); }
    const controls = ui.controls;
    if (controls?.render) {
      Promise.resolve().then(() => controls.render({ reset: true }))
        .catch(error => warn("Could not refresh scene controls", error))
        .finally(() => {
          try { applySceneDomVisibility(); } catch (error) { warn("Could not sync scene icon visibility", error); }
        });
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
  // Keep both the unmodified early baseline (for restoring our hidden entries)
  // and the live hook record (which later hook subscribers can extend).
  lastHookControls = controls;
  observedControls = {};
  rememberNewControls(controls);
  applySceneOrders(controls, currentLayout);
  applySceneVisibility(controls, getVisibility(), canUserHide());
}

/** Reconcile a *completed* v14 control record with our per-user settings.
 * This catches modules which add controls after our getSceneControlButtons
 * callback. Existing action callbacks are never changed or replaced. */
export function reconcilePreparedControls(controls = currentControlRecord()) {
  if (!controls || typeof controls !== "object") return false;
  rememberNewControls(controls);
  const previous = new Map();
  for (const [id, control] of Object.entries(controls)) {
    if (!control || typeof control !== "object") continue;
    previous.set(`control:${id}`, { order: control.order, visible: control.visible });
    for (const [toolId, tool] of Object.entries(control.tools ?? {})) {
      if (tool && typeof tool === "object") {
        previous.set(`tool:${id}:${toolId}`, { order: tool.order, visible: tool.visible });
      }
    }
  }
  applySceneOrders(controls, currentLayout);
  applySceneVisibility(controls, getVisibility(), canUserHide());
  for (const [id, control] of Object.entries(controls)) {
    if (!control || typeof control !== "object") continue;
    const before = previous.get(`control:${id}`);
    if (before && (before.order !== control.order || before.visible !== control.visible)) return true;
    for (const [toolId, tool] of Object.entries(control.tools ?? {})) {
      if (!tool || typeof tool !== "object") continue;
      const oldTool = previous.get(`tool:${id}:${toolId}`);
      if (oldTool && (oldTool.order !== tool.order || oldTool.visible !== tool.visible)) return true;
    }
  }
  return false;
}

/** Register this second hook during ready, after module-added tool callbacks
 * registered during init. It reapplies visibility before v14 prepares the
 * rendered controls, while the original hook keeps the recovery baseline. */
export function finalizeSceneControlButtons(controls) {
  if (!controls || typeof controls !== "object") return;
  rememberNewControls(controls);
  applySceneOrders(controls, currentLayout);
  applySceneVisibility(controls, getVisibility(), canUserHide());
}

/** Re-render prepared controls *without* resetting the native control record.
 * This preserves additions from hooks that ran after ours. Guard the second
 * render to avoid a recursive render loop. */
export function attachSceneControlEvents() {
  const controls = ui.controls;
  if (!controls?.addEventListener) return;
  controls.addEventListener("render", () => {
    try { applySceneDomVisibility(); } catch (error) { warn("Scene DOM visibility failed", error); }
    if (sceneRefreshPending) return;
    queueMicrotask(() => {
      if (sceneRefreshPending || controls !== ui.controls) return;
      try {
        if (!reconcilePreparedControls(controls.controls)) return;
      } catch (error) { warn("Could not reconcile added scene tools", error); return; }
      if (!controls.render) return;
      sceneRefreshPending = true;
      Promise.resolve().then(() => controls.render({ reset: false }))
        .catch(error => warn("Could not refresh additional scene tools", error))
        .finally(() => {
          sceneRefreshPending = false;
          try { applySceneDomVisibility(); } catch (error) { warn("Could not sync late scene DOM", error); }
        });
    });
  });
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
