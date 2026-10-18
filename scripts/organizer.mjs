import { escapeHtml, orderedIds, safeIconClasses } from "./layout.mjs";
import { getAppearance, saveAppearance, resetAppearance } from "./appearance.mjs";
import {
  canUserHide, getVisibility, isHidden, toggleHidden,
  saveVisibility, resetVisibility
} from "./visibility.mjs";
import {
  getLayout, getLeftControls, getRightTabs, getToolsFor,
  localizedLabel, saveLayout, resetLayout
} from "./runtime.mjs";

const COLOR_FIELDS = [
  { id: "background", label: "Background", suggested: "#243448" },
  { id: "icons", label: "Icons", suggested: "#e8eef5" },
  { id: "active", label: "Active icon highlight", suggested: "#286dc2" }
];

function appearanceFieldsHtml(side, appearance) {
  return COLOR_FIELDS.map(field => {
    const saved = appearance[side][field.id];
    const name = `${side} ${field.label.toLowerCase()}`;
    const value = saved ?? field.suggested;
    return `<div class="fno-color-field">
      <label class="fno-color-toggle-label">
        <input type="checkbox" class="fno-theme-toggle" data-side="${side}" data-field="${field.id}" ${saved ? "checked" : ""}>
        ${escapeHtml(field.label)}
      </label>
      <input type="color" class="fno-theme-picker" data-side="${side}" data-field="${field.id}"
             value="${value}" aria-label="Choose ${escapeHtml(name)} color" ${saved ? "" : "disabled"}>
    </div>`;
  }).join("");
}

const ApplicationV2 = foundry.applications.api.ApplicationV2;

function orderedRows(entries, saved) {
  const lookup = new Map(entries.map(entry => [entry.id, entry]));
  return orderedIds(saved, entries.map(entry => entry.id)).map(id => lookup.get(id)).filter(Boolean);
}

function rowsHtml(entries, saved, area, hidden, allowHide, controlId = null) {
  const items = orderedRows(entries, saved);
  if (!items.length) return '<li class="fno-empty">No available controls in this area.</li>';
  return items.map(entry => {
    const text = localizedLabel(entry.title, entry.id);
    const icon = safeIconClasses(entry.icon || "fa-solid fa-cube");
    const concealed = allowHide && isHidden(hidden, area, entry.id, controlId);
    const protectedTab = area === "right" && entry.id === "settings";
    const action = concealed ? "show" : "hide";
    const actionText = concealed ? "Show" : "Hide";
    const toggleButton = allowHide && !protectedTab ?
      `<button type="button" class="fno-hide-button" data-visibility="${action}"
         aria-label="${actionText} ${escapeHtml(text)}" title="${actionText} icon"><i class="fa-solid ${concealed ? "fa-eye" : "fa-eye-slash"}" aria-hidden="true"></i></button>` :
      (allowHide && protectedTab ? '<span class="fno-locked" title="Settings stays visible" aria-label="Settings stays visible"><i class="fa-solid fa-lock" aria-hidden="true"></i></span>' : "");
    return `<li class="fno-row ${concealed ? "fno-row-hidden" : ""}" draggable="true" data-id="${escapeHtml(entry.id)}">
      <span class="fno-grip" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
      <i class="fno-icon ${escapeHtml(icon)}" aria-hidden="true"></i>
      <span class="fno-name" title="${escapeHtml(text)}">${escapeHtml(text)}<span class="fno-hidden-status" ${concealed ? "" : "hidden"}> (Hidden)</span></span>
      <span class="fno-moves">
        <button type="button" data-move="up" aria-label="Move ${escapeHtml(text)} up" title="Move up"><i class="fa-solid fa-chevron-up"></i></button>
        <button type="button" data-move="down" aria-label="Move ${escapeHtml(text)} down" title="Move down"><i class="fa-solid fa-chevron-down"></i></button>
        ${toggleButton}
      </span>
    </li>`;
  }).join("");
}

function selectOptions(controls, selected) {
  return controls.map(c => `<option value="${escapeHtml(c.id)}" ${c.id === selected ? "selected" : ""}>${escapeHtml(localizedLabel(c.title, c.id))}</option>`).join("");
}

function idsFromList(root, area) {
  const list = root.querySelector(`.fno-list[data-area="${area}"]`);
  return list ? [...list.querySelectorAll("li[data-id]")].map(item => item.dataset.id) : [];
}

export class NavOrganizerApp extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "foundry-nav-order-arranger",
    classes: ["fno-app"],
    window: { title: "AFT Navbar+ — Arrange Icons & Colors", resizable: true, minimizable: false },
    position: { width: 830, height: 730 }
  };

  constructor(options = {}) {
    super(options);
    this.selectedControl = null;
    this.draggedRow = null;
    this.dragSource = null;
    this.statusTicket = 0;
  }

  async _renderHTML(_context, _options) {
    const layout = getLayout();
    const appearance = getAppearance();
    const hidden = getVisibility();
    const canHide = canUserHide();
    const controls = getLeftControls();
    const rightTabs = getRightTabs();
    if (!controls.some(entry => entry.id === this.selectedControl)) this.selectedControl = controls[0]?.id ?? null;
    const tools = this.selectedControl ? getToolsFor(this.selectedControl) : [];
    const container = document.createElement("div");
    container.className = "fno-panel";
    container.innerHTML = `
      <p class="fno-intro">Drag rows or use the arrows to reorder. Changes are saved automatically for your user in this world. If your GM permits, use the eye button to hide or show an icon. Visibility, order and colors are saved separately.</p>
      <div class="fno-columns">
        <section class="fno-column" aria-labelledby="fno-left-title">
          <h2 id="fno-left-title"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> Left toolbar</h2>
          <p class="fno-help">Scene control categories, such as Tokens, Tiles and Drawings. Hidden icons stay in this list for recovery.</p>
          <ol class="fno-list" data-area="left" aria-label="Left toolbar controls">${rowsHtml(controls, layout.left, "left", hidden, canHide)}</ol>
          <div class="fno-subtools">
            <h3>Tools within a category</h3>
            <label for="fno-control-select">Choose category</label>
            <select id="fno-control-select" ${!controls.length ? "disabled" : ""}>${selectOptions(controls, this.selectedControl)}</select>
            <ol class="fno-list fno-tools" data-area="tools" aria-label="Tools in selected category">${rowsHtml(tools, layout.tools[this.selectedControl] ?? [], "tools", hidden, canHide, this.selectedControl)}</ol>
          </div>
        </section>
        <section class="fno-column" aria-labelledby="fno-right-title">
          <h2 id="fno-right-title"><i class="fa-solid fa-bars" aria-hidden="true"></i> Right sidebar</h2>
          <p class="fno-help">Chat, Combat, Actors, Scenes, Journals and module tabs.</p>
          <ol class="fno-list" data-area="right" aria-label="Right sidebar tabs">${rowsHtml(rightTabs, layout.right, "right", hidden, canHide)}</ol>
        </section>
      </div>
      <section class="fno-visibility-summary">
        <p>${canHide ? "Use the eye controls to hide or restore icons. The Settings tab stays visible." : "Hiding icons is restricted by your GM. You can still arrange icons and choose colors."}</p>
        ${canHide ? '<button type="button" class="fno-show-all" data-fno-action="show-all"><i class="fa-solid fa-eye" aria-hidden="true"></i> Restore All Hidden Icons</button>' : ""}
        ${game.user?.isGM ? '<p class="fno-permission-hint">GM: Set player access under Configure Settings → Module Settings → Who Can Hide Icons.</p>' : ""}
      </section>
      <section class="fno-appearance" aria-labelledby="fno-appearance-title">
        <h2 id="fno-appearance-title"><i class="fa-solid fa-palette" aria-hidden="true"></i> Appearance</h2>
        <p class="fno-appearance-help">Optional colors for each navigation bar. Unchecked options use your Foundry theme. Colors apply immediately.</p>
        <div class="fno-color-columns">
          <fieldset class="fno-color-panel"><legend>Left toolbar</legend>${appearanceFieldsHtml("left", appearance)}</fieldset>
          <fieldset class="fno-color-panel"><legend>Right sidebar tabs</legend>${appearanceFieldsHtml("right", appearance)}</fieldset>
        </div>
        <button type="button" class="fno-restore-colors" data-fno-action="restore-colors"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Restore Default Colors</button>
      </section>
      <footer class="fno-footer">
        <span class="fno-status" role="status" aria-live="polite">Ready</span>
        <div class="fno-buttons">
          <button type="button" data-fno-action="defaults" class="fno-defaults"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset Icon Order</button>
          <button type="button" data-fno-action="close"><i class="fa-solid fa-check" aria-hidden="true"></i> Done</button>
        </div>
      </footer>`;
    return container;
  }

  _replaceHTML(result, content, _options) {
    content.replaceChildren(result);
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element.querySelector(".fno-panel");
    if (!root) return;

    root.querySelector("#fno-control-select")?.addEventListener("change", event => {
      this.selectedControl = event.currentTarget.value;
      const list = root.querySelector('.fno-list[data-area="tools"]');
      const layout = getLayout();
      list.innerHTML = rowsHtml(getToolsFor(this.selectedControl), layout.tools[this.selectedControl] ?? [], "tools", getVisibility(), canUserHide(), this.selectedControl);
      this.#updateArrows(root);
    });

    root.addEventListener("click", event => {
      const button = event.target.closest?.("button");
      if (!button) return;
      if (button.dataset.fnoAction === "close") {
        this.close();
        return;
      }
      if (button.dataset.fnoAction === "defaults") {
        void this.#reset(root);
        return;
      }
      if (button.dataset.fnoAction === "show-all") {
        void this.#restoreHidden(root);
        return;
      }
      if (button.dataset.fnoAction === "restore-colors") {
        void this.#resetColors(root);
        return;
      }
      if (button.dataset.visibility === "hide" || button.dataset.visibility === "show") {
        const row = button.closest("li[data-id]");
        const list = row?.closest(".fno-list");
        const area = list?.dataset.area;
        if (row && area) void this.#commitVisibility(root, area, row.dataset.id, button.dataset.visibility === "hide", button);
        return;
      }
      const move = button.dataset.move;
      if (move !== "up" && move !== "down") return;
      const row = button.closest("li[data-id]");
      const list = row?.closest(".fno-list");
      if (!row || !list) return;
      if (move === "up" && row.previousElementSibling?.dataset?.id) {
        list.insertBefore(row, row.previousElementSibling);
      } else if (move === "down" && row.nextElementSibling?.dataset?.id) {
        list.insertBefore(row.nextElementSibling, row);
      } else return;
      this.#updateArrows(root);
      void this.#commit(root);
    });

    root.addEventListener("change", event => {
      const input = event.target;
      if (!input.matches?.(".fno-theme-toggle, .fno-theme-picker")) return;
      const side = input.dataset.side;
      const field = input.dataset.field;
      if (!["left", "right"].includes(side) || !COLOR_FIELDS.some(entry => entry.id === field)) return;
      const next = getAppearance();
      if (input.classList.contains("fno-theme-toggle")) {
        const picker = root.querySelector(`.fno-theme-picker[data-side="${side}"][data-field="${field}"]`);
        if (!picker) return;
        picker.disabled = !input.checked;
        next[side][field] = input.checked ? picker.value : null;
      } else {
        const toggle = root.querySelector(`.fno-theme-toggle[data-side="${side}"][data-field="${field}"]`);
        if (!toggle?.checked) return;
        next[side][field] = input.value;
      }
      void this.#commitAppearance(root, next);
    });

    root.addEventListener("dragstart", event => {
      const row = event.target.closest?.("li.fno-row[data-id]");
      if (!row) return;
      this.draggedRow = row;
      this.dragSource = row.closest(".fno-list");
      row.classList.add("fno-dragging");
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", row.dataset.id);
      }
    });
    root.addEventListener("dragover", event => {
      const list = event.target.closest?.(".fno-list");
      if (!list || list !== this.dragSource) return; // no cross-side movement
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    });
    root.addEventListener("drop", event => {
      const target = event.target.closest?.("li.fno-row[data-id]");
      const list = target?.closest(".fno-list");
      if (!target || !this.draggedRow || list !== this.dragSource || target === this.draggedRow) return;
      event.preventDefault();
      const bounds = target.getBoundingClientRect();
      const after = event.clientY > bounds.top + bounds.height / 2;
      list.insertBefore(this.draggedRow, after ? target.nextElementSibling : target);
      this.#cleanupDrag(root);
      this.#updateArrows(root);
      void this.#commit(root);
    });
    root.addEventListener("dragend", () => this.#cleanupDrag(root));
    this.#updateArrows(root);
  }

  #cleanupDrag(root) {
    root.querySelectorAll(".fno-dragging").forEach(row => row.classList.remove("fno-dragging"));
    this.draggedRow = null;
    this.dragSource = null;
  }

  #updateArrows(root) {
    for (const list of root.querySelectorAll(".fno-list")) {
      const rows = [...list.querySelectorAll("li[data-id]")];
      rows.forEach((row, i) => {
        const up = row.querySelector('[data-move="up"]');
        const down = row.querySelector('[data-move="down"]');
        if (up) up.disabled = i === 0;
        if (down) down.disabled = i === rows.length - 1;
      });
    }
  }

  #refreshHiddenRows(root) {
    const hidden = getVisibility();
    for (const list of root.querySelectorAll(".fno-list")) {
      const area = list.dataset.area;
      for (const row of list.querySelectorAll("li[data-id]")) {
        const concealed = isHidden(hidden, area, row.dataset.id, area === "tools" ? this.selectedControl : null);
        row.classList.toggle("fno-row-hidden", concealed);
        const status = row.querySelector(".fno-hidden-status");
        if (status) status.hidden = !concealed;
        const toggle = row.querySelector(".fno-hide-button");
        if (!toggle) continue;
        const text = row.querySelector(".fno-name")?.firstChild?.textContent?.trim() ?? row.dataset.id;
        const verb = concealed ? "Show" : "Hide";
        toggle.dataset.visibility = verb.toLowerCase();
        toggle.setAttribute("aria-label", `${verb} ${text}`);
        toggle.title = `${verb} icon`;
        const icon = toggle.querySelector("i");
        if (icon) {
          icon.classList.toggle("fa-eye", concealed);
          icon.classList.toggle("fa-eye-slash", !concealed);
        }
      }
    }
  }

  async #commitVisibility(root, area, id, shouldHide, button) {
    if (!canUserHide()) {
      ui.notifications.warn("Your GM has not enabled hiding icons for your role.");
      return;
    }
    if (area === "right" && id === "settings") return;
    button.disabled = true;
    this.#setStatus(root, shouldHide ? "Hiding icon…" : "Showing icon…");
    const ticket = ++this.statusTicket;
    try {
      const next = toggleHidden(getVisibility(), area, id, this.selectedControl, shouldHide);
      await saveVisibility(next);
      if (ticket !== this.statusTicket) return;
      this.#refreshHiddenRows(root);
      this.#setStatus(root, shouldHide ? "Icon hidden for your user" : "Icon restored for your user");
    } catch (error) {
      console.error("foundry-nav-order | Could not save hidden icons", error);
      if (ticket === this.statusTicket) {
        this.#refreshHiddenRows(root);
        this.#setStatus(root, "Could not save icon visibility");
        ui.notifications.error("AFT Navbar+ could not save your hidden icons.");
      }
    } finally { button.disabled = false; }
  }

  async #restoreHidden(root) {
    if (!canUserHide()) return;
    this.#setStatus(root, "Restoring hidden icons…");
    const ticket = ++this.statusTicket;
    try {
      await resetVisibility();
      if (ticket !== this.statusTicket) return;
      this.#refreshHiddenRows(root);
      this.#setStatus(root, "All user-hidden icons restored");
      ui.notifications.info("All your hidden icons have been restored. Order and colors were preserved.");
    } catch (error) {
      console.error("foundry-nav-order | Could not restore hidden icons", error);
      if (ticket === this.statusTicket) {
        this.#setStatus(root, "Could not restore hidden icons");
        ui.notifications.error("AFT Navbar+ could not restore hidden icons.");
      }
    }
  }

  async #commit(root) {
    const before = getLayout();
    const left = idsFromList(root, "left");
    const right = idsFromList(root, "right");
    const toolIds = idsFromList(root, "tools");
    const next = {
      ...before,
      left: left.length ? [...left, ...before.left.filter(id => !left.includes(id))] : before.left,
      right: right.length ? [...right, ...before.right.filter(id => !right.includes(id))] : before.right,
      tools: { ...before.tools }
    };
    if (this.selectedControl && toolIds.length) {
      const prior = before.tools[this.selectedControl] ?? [];
      next.tools[this.selectedControl] = [...toolIds, ...prior.filter(id => !toolIds.includes(id))];
    }
    this.#setStatus(root, "Saving…");
    const ticket = ++this.statusTicket;
    try {
      await saveLayout(next);
      if (ticket === this.statusTicket) this.#setStatus(root, "Saved for your user");
    } catch (error) {
      console.error("foundry-nav-order | Could not save user icon order", error);
      if (ticket === this.statusTicket) this.#setStatus(root, "Could not save. Reopen to retry.");
      ui.notifications.error("AFT Navbar+ could not save your layout. Check permissions or connection.");
    }
  }

  async #reset(root) {
    this.#setStatus(root, "Restoring default order…");
    const ticket = ++this.statusTicket;
    try {
      await resetLayout();
      if (ticket !== this.statusTicket) return;
      await this.render({ force: true });
      ui.notifications.info("Navigation icon order restored to Foundry defaults for your user.");
    } catch (error) {
      console.error("foundry-nav-order | Could not reset layout", error);
      this.#setStatus(root, "Reset failed. Please retry.");
      ui.notifications.error("AFT Navbar+ could not reset your layout.");
    }
  }

  #restoreAppearanceInputs(root) {
    const appearance = getAppearance();
    for (const side of ["left", "right"]) {
      for (const field of COLOR_FIELDS) {
        const toggle = root.querySelector(`.fno-theme-toggle[data-side="${side}"][data-field="${field.id}"]`);
        const picker = root.querySelector(`.fno-theme-picker[data-side="${side}"][data-field="${field.id}"]`);
        if (!toggle || !picker) continue;
        toggle.checked = !!appearance[side][field.id];
        picker.disabled = !toggle.checked;
        picker.value = appearance[side][field.id] ?? field.suggested;
      }
    }
  }

  async #commitAppearance(root, value) {
    this.#setStatus(root, "Saving colors…");
    const ticket = ++this.statusTicket;
    try {
      await saveAppearance(value);
      if (ticket === this.statusTicket) this.#setStatus(root, "Colors saved for your user");
    } catch (error) {
      console.error("foundry-nav-order | Could not save color preferences", error);
      if (ticket !== this.statusTicket) return;
      this.#restoreAppearanceInputs(root);
      this.#setStatus(root, "Color save failed. Try again.");
      ui.notifications.error("AFT Navbar+ could not save your colors.");
    }
  }

  async #resetColors(root) {
    this.#setStatus(root, "Restoring Foundry colors…");
    const ticket = ++this.statusTicket;
    try {
      await resetAppearance();
      if (ticket !== this.statusTicket) return;
      this.#restoreAppearanceInputs(root);
      this.#setStatus(root, "Foundry colors restored");
      ui.notifications.info("Default navigation colors restored. Icon order was not changed.");
    } catch (error) {
      console.error("foundry-nav-order | Could not restore default colors", error);
      if (ticket !== this.statusTicket) return;
      this.#restoreAppearanceInputs(root);
      this.#setStatus(root, "Could not restore colors. Try again.");
      ui.notifications.error("AFT Navbar+ could not restore default colors.");
    }
  }

  #setStatus(root, status) {
    const el = root.querySelector(".fno-status");
    if (el?.isConnected) el.textContent = status;
  }
}
