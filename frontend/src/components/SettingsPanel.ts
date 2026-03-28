export class SettingsPanel {
  private el: HTMLElement | null = null;
  private isOpen = false;

  render(): HTMLElement {
    const el = document.createElement("div");
    el.className = "settings-panel hidden";
    el.innerHTML = `
      <div class="settings-backdrop"></div>
      <div class="settings-dialog">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="settings-close">&times;</button>
        </div>
        <div class="settings-body">
          <div class="settings-group">
            <label class="settings-label">Refresh Interval</label>
            <select class="settings-select" id="setting-refresh">
              <option value="30000">30 seconds</option>
              <option value="60000" selected>1 minute</option>
              <option value="120000">2 minutes</option>
              <option value="300000">5 minutes</option>
            </select>
          </div>
          <div class="settings-group">
            <label class="settings-label">
              <input type="checkbox" id="setting-sound" /> Sound notifications
            </label>
          </div>
          <div class="settings-group">
            <label class="settings-label">
              <input type="checkbox" id="setting-compact" /> Compact mode
            </label>
          </div>
        </div>
      </div>
    `;
    this.el = el;

    el.querySelector(".settings-backdrop")?.addEventListener("click", () => this.close());
    el.querySelector(".settings-close")?.addEventListener("click", () => this.close());

    el.querySelector("#setting-refresh")?.addEventListener("change", (e) => {
      const val = (e.target as HTMLSelectElement).value;
      document.dispatchEvent(new CustomEvent("settings-change", { detail: { key: "refreshInterval", value: parseInt(val, 10) } }));
    });

    el.querySelector("#setting-compact")?.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      document.body.classList.toggle("compact-mode", checked);
    });

    return el;
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  open(): void {
    if (!this.el) return;
    this.isOpen = true;
    this.el.classList.remove("hidden");
  }

  close(): void {
    if (!this.el) return;
    this.isOpen = false;
    this.el.classList.add("hidden");
  }
}
