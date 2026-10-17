import { escapeHtml, orderedIds, safeIconClasses } from "./layout.mjs";
import {
  getLayout, getLeftControls, getRightTabs, getToolsFor,
  localizedLabel, saveLayout, resetLayout
} from "./runtime.mjs";

const ApplicationV2 = foundry.applications.api.ApplicationV2;

function orderedRows(entries, saved) {
  const lookup = new Map(entries.map(entry => [entry.id, entry]));
  return orderedIds(saved, entries.map(entry => entry.id)).map(id => lookup.get(id)).filter(Boolean);
}

function rowsHtml(entries, saved) {
  const items = orderedRows(entries, saved);
  if (!items.length) return '<li class="fno-empty">No available controls in this area.</li>';
  return items.map(entry => {
    const text = localizedLabel(entry.title, entry.id);
    const icon = safeIconClasses(entry.icon || "fa-solid fa-cube");
    return `<li class="fno-row" draggable="true" data-id="${escapeHtml(entry.id)}">
      <span class="fno-grip" aria-hidden="true"><i class="fa-solid fa-grip-vertical"></i></span>
      <i class="fno-icon ${escapeHtml(icon)}" aria-hidden="true"></i>
      <span class="fno-name" title="${escapeHtml(text)}">${escapeHtml(text)}</span>
      <span class="fno-moves">
        <button type="button" data-move="up" aria-label="Move ${escapeHtml(text)} up" title="Move up"><i class="fa-solid fa-chevron-up"></i></button>
        <button type="button" data-move="down" aria-label="Move ${escapeHtml(text)} down" title="Move down"><i class="fa-solid fa-chevron-down"></i></button>
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
    window: { title: "Arrange Navigation Icons", resizable: true, minimizable: false },
    position: { width: 830, height: 650 }
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
    const controls = getLeftControls();
    const rightTabs = getRightTabs();
    if (!controls.some(entry => entry.id === this.selectedControl)) this.selectedControl = controls[0]?.id ?? null;
    const tools = this.selectedControl ? getToolsFor(this.selectedControl) : [];
    const container = document.createElement("div");
    container.className = "fno-panel";
    container.innerHTML = `
      <p class="fno-intro">Drag rows or use the arrow buttons. Changes are saved automatically for your user in this world. Only the icon order changes.</p>
      <div class="fno-columns">
        <section class="fno-column" aria-labelledby="fno-left-title">
          <h2 id="fno-left-title"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> Left toolbar</h2>
          <p class="fno-help">Scene control categories, such as Tokens, Tiles and Drawings.</p>
          <ol class="fno-list" data-area="left" aria-label="Left toolbar controls">${rowsHtml(controls, layout.left)}</ol>
          <div class="fno-subtools">
            <h3>Tools within a category</h3>
            <label for="fno-control-select">Choose category</label>
            <select id="fno-control-select" ${!controls.length ? "disabled" : ""}>${selectOptions(controls, this.selectedControl)}</select>
            <ol class="fno-list fno-tools" data-area="tools" aria-label="Tools in selected category">${rowsHtml(tools, layout.tools[this.selectedControl] ?? [])}</ol>
          </div>
        </section>
        <section class="fno-column" aria-labelledby="fno-right-title">
          <h2 id="fno-right-title"><i class="fa-solid fa-bars" aria-hidden="true"></i> Right sidebar</h2>
          <p class="fno-help">Chat, Combat, Actors, Scenes, Journals and module tabs.</p>
          <ol class="fno-list" data-area="right" aria-label="Right sidebar tabs">${rowsHtml(rightTabs, layout.right)}</ol>
        </section>
      </div>
      <footer class="fno-footer">
        <span class="fno-status" role="status" aria-live="polite">Ready</span>
        <div class="fno-buttons">
          <button type="button" data-fno-action="defaults" class="fno-defaults"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i> Reset to Defaults</button>
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
      list.innerHTML = rowsHtml(getToolsFor(this.selectedControl), layout.tools[this.selectedControl] ?? []);
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
      ui.notifications.error("Navigation Organizer could not save your layout. Check permissions or connection.");
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
      ui.notifications.error("Navigation Organizer could not reset your layout.");
    }
  }

  #setStatus(root, status) {
    const el = root.querySelector(".fno-status");
    if (el?.isConnected) el.textContent = status;
  }
}
