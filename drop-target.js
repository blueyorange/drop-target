const template = document.createElement("template");
template.innerHTML = `
<style>
:host {
    display: inline-block;
    width: 500px;
    height: 200px;
    background-color: #EEEEEE;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
}

:host([draggedover]) {
    background-color: #DDDDDD;
}
</style>
<slot></slot>
`;

class DropTarget extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute("role")) this.setAttribute("role", "input");
    this._upgradeProperty("disabled");
    this._upgradeProperty("acceptsfiles");
    this._upgradeProperty("accepts");

    // need document event listeners to detect which html element is being dragged
    this._onDragStart = this._onDragStart.bind(this);
    document.addEventListener("dragstart", this._onDragStart);
    this._onDragEnd = this._onDragEnd.bind(this);
    document.addEventListener("dragend", this._onDragEnd);
    this.addEventListener("dragenter", this._onDragEnter);
    this.addEventListener("dragleave", this._onDragLeave);
    this.addEventListener("drop", this._onDrop);
  }

  disconnectedCallback() {

    document.removeEventListener("dragstart", this._onDragStart);
    document.removeEventListener("dragend", this._onDragEnd);
    this.removeEventListener("dragenter", this._onDragEnter);
    this.removeEventListener("dragleave", this._onDragLeave);
    this.removeEventListener("drop", this._onDrop);
  }

  _onDragStart(e) {
    this["draggedElement"] = e.target;
  }

  _onDragEnd() {
    this["draggedElement"] = null;
  }

  _acceptsThat(types) {
    let containsFiles = Boolean(types.filter((type) => type === "Files").length);
    if (this["acceptsFiles"] && containsFiles) {
      return true;
    }
    let acceptsDraggedElement = this["draggedElement"].matches(this["accepts"]);
    if (this["accepts"] && acceptsDraggedElement) {
      return true;
    }
    return false;
  }

  _onDragEnter(e) {
    if (this._acceptsThat(e.dataTransfer.types)) {
      this.setAttribute("draggedover", "");
    }
  }

  _onDragLeave() {
    this.removeAttribute("draggedover");
  }

  _onDrop(e) {
    e.preventDefaults();
    this['draggedElement'] = null;
    // do nothing if drop not accepted
    if (!this._acceptsThat(e.dataTransfer.types)) return;
    // drop is accepted: dispatch event
    this.dispatchEvent(new Event('drop-accepted'), {
      bubbles: true,
      composed: true
    })
  }

  _upgradeProperty(prop) {
    if (this.hasOwnProperty(prop)) {
      let value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  set acceptsFiles(value) {
    const acceptsFiles = Boolean(value);
    if (acceptsFiles) this.setAttribute("acceptsFiles", "");
    else this.removeAttribute("accceptsFiles");
  }

  get acceptsFiles() {
    return this.hasAttribute("acceptsFiles");
  }

  set accepts(value) {
    this.setAttribute("accepts", value);
  }

  get accepts() {
    return this.getAttribute("accepts");
  }
}

window.customElements.define("drop-target", DropTarget);
