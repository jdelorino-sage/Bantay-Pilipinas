import { SUBMARINE_CABLES, MAJOR_PORTS } from "../config/infrastructure";

export class InfrastructurePanel {
  render(): HTMLElement {
    const el = document.createElement("section");
    el.className = "panel panel-infra";

    const cableHTML = SUBMARINE_CABLES.map(
      (c) =>
        `<div class="infra-item">
          <span class="infra-name">${c.name}</span>
          <span class="infra-detail">${c.landingPoints.map((lp) => lp.name).join(", ")}</span>
        </div>`
    ).join("");

    const portHTML = MAJOR_PORTS.slice(0, 6)
      .map(
        (p) =>
          `<div class="infra-item">
          <span class="infra-name">${p.name}</span>
        </div>`
      )
      .join("");

    el.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">Infrastructure</h2>
        <span class="panel-badge infra">INFRA</span>
      </div>
      <div class="panel-body">
        <div class="infra-section">
          <span class="infra-label">Submarine Cables (${SUBMARINE_CABLES.length})</span>
          ${cableHTML}
        </div>
        <div class="infra-section">
          <span class="infra-label">Major Ports (${MAJOR_PORTS.length})</span>
          ${portHTML}
        </div>
      </div>
    `;
    return el;
  }

  refresh(): void {
    // static data, no refresh needed
  }
}
