import { DeckGLMap } from "./DeckGLMap";

export class MapContainer {
  private deckMap: DeckGLMap;

  constructor(container: HTMLElement) {
    this.deckMap = new DeckGLMap(container);
    this.deckMap.init().catch((err) => {
      console.warn("[map] Failed to initialize:", err);
      container.innerHTML = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#0a1020;color:#4fc3f7;font-size:14px;">
          <p>Map failed to load. Check console for details.</p>
        </div>
      `;
    });
  }
}
