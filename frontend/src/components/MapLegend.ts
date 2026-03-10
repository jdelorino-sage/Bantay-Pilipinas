const LEGEND_ITEMS = [
  { color: "#ef5350", shape: "circle", label: "High Alert" },
  { color: "#ffa726", shape: "circle", label: "Elevated" },
  { color: "#ffa726", shape: "circle", label: "Monitoring" },
  { color: "#4fc3f7", shape: "triangle", label: "Base" },
  { color: "#ef5350", shape: "triangle", label: "Volcano" },
  { color: "#4fc3f7", shape: "square", label: "Port" },
  { color: "#4fc3f7", shape: "line", label: "Cable" },
  { color: "#90caf9", shape: "circle", label: "Aircraft" },
];

export class MapLegend {
  render(): HTMLElement {
    const el = document.createElement("div");
    el.className = "map-legend";

    const items = LEGEND_ITEMS.map((item) => {
      let shapeHtml: string;
      switch (item.shape) {
        case "triangle":
          shapeHtml = `<span class="legend-shape legend-triangle" style="border-bottom-color:${item.color}"></span>`;
          break;
        case "square":
          shapeHtml = `<span class="legend-shape legend-square" style="background:${item.color}"></span>`;
          break;
        case "line":
          shapeHtml = `<span class="legend-shape legend-line" style="background:${item.color}"></span>`;
          break;
        default:
          shapeHtml = `<span class="legend-dot" style="background:${item.color}"></span>`;
      }
      return `<span class="legend-item">${shapeHtml}<span class="legend-label">${item.label}</span></span>`;
    }).join("");

    el.innerHTML = `
      <div class="legend-content">
        <span class="legend-title">LEGEND</span>
        ${items}
      </div>
      <span class="legend-attribution">&copy; Protomaps &copy; OpenStreetMap</span>
    `;

    return el;
  }
}
