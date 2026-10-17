/** Pure ordering helpers shared by Foundry runtime and Node mock tests. */
export const EMPTY_LAYOUT = Object.freeze({ version: 1, left: [], tools: {}, right: [] });

function validId(id) {
  return typeof id === "string" && id.length > 0 && id.length <= 128 &&
    !["__proto__", "prototype", "constructor"].includes(id);
}

function uniqueIds(items) {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.filter(validId))].slice(0, 256);
}

export function normalizeLayout(value) {
  const result = { version: 1, left: [], tools: {}, right: [] };
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  result.left = uniqueIds(value.left);
  result.right = uniqueIds(value.right);
  if (value.tools && typeof value.tools === "object" && !Array.isArray(value.tools)) {
    for (const [key, items] of Object.entries(value.tools).slice(0, 128)) {
      if (validId(key)) result.tools[key] = uniqueIds(items);
    }
  }
  return result;
}

export function orderedIds(saved, available) {
  const ids = uniqueIds(available);
  const included = new Set(ids);
  const first = uniqueIds(saved).filter(id => included.has(id));
  const pinned = new Set(first);
  return [...first, ...ids.filter(id => !pinned.has(id))];
}

export function sortedEntries(record, { visibleOnly = true } = {}) {
  if (!record || typeof record !== "object") return [];
  return Object.entries(record)
    .filter(([key, value]) => validId(key) && value && typeof value === "object" &&
      (!visibleOnly || value.visible !== false))
    .map(([key, value], index) => ({
      id: key,
      name: key,
      title: typeof value.title === "string" ? value.title : key,
      icon: typeof value.icon === "string" ? value.icon : "",
      order: Number.isFinite(value.order) ? value.order : index,
      index
    }))
    .sort((a, b) => a.order - b.order || a.index - b.index);
}

/**
 * Only changes documented `order` values of controls/tools. Unknown controls and
 * tools keep their original order and remain after user-pinned entries.
 */
export function applySceneOrders(controls, layoutValue) {
  if (!controls || typeof controls !== "object") return;
  const layout = normalizeLayout(layoutValue);
  const prioritize = (record, saved) => {
    if (!record || typeof record !== "object" || !saved.length) return;
    let index = 0;
    for (const id of saved) {
      if (!Object.hasOwn(record, id)) continue;
      const entry = record[id];
      if (!entry || typeof entry !== "object") continue;
      entry.order = -100000 + index++;
    }
  };
  prioritize(controls, layout.left);
  for (const [control, tools] of Object.entries(layout.tools)) {
    prioritize(controls[control]?.tools, tools);
  }
}

/**
 * Put tabs in a specified visual + keyboard order using only existing DOM nodes.
 * Returns false if already ordered; non-tab siblings are never deleted or cloned.
 * Entries are [{id,element}], where element is a direct child of container.
 */
export function reorderTabElements(container, entries, ids) {
  if (!container || !Array.isArray(entries) || entries.length < 2) return false;
  const nodes = new Map(entries.map(({ id, element }) => [id, element]));
  const target = orderedIds(ids, entries.map(entry => entry.id));
  const current = entries.map(entry => entry.id);
  if (current.every((id, i) => id === target[i])) return false;
  const orderedElements = target.map(id => nodes.get(id)).filter(Boolean);
  const firstExistingTab = entries[0].element;
  if (firstExistingTab !== orderedElements[0]) container.insertBefore(orderedElements[0], firstExistingTab);
  for (let i = 1; i < orderedElements.length; i++) {
    const prior = orderedElements[i - 1];
    const element = orderedElements[i];
    if (prior.nextElementSibling !== element) container.insertBefore(element, prior.nextElementSibling);
  }
  return true;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[ch]);
}

/** Render known-good class tokens only. */
export function safeIconClasses(value) {
  return String(value ?? "").split(/\s+/).filter(s => /^[a-z][a-z0-9-]*$/i.test(s)).slice(0, 5).join(" ");
}
