interface BoundedPanel {
  render(): HTMLElement;
  refresh(): void;
}

function setupCollapse(el: HTMLElement, panelName: string): void {
  const header = el.querySelector(".panel-header");
  if (!header) return;
  const storageKey = `panel-collapsed-${panelName}`;
  if (localStorage.getItem(storageKey) === "1") {
    el.classList.add("collapsed");
  }
  header.addEventListener("click", (e) => {
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    el.classList.toggle("collapsed");
    localStorage.setItem(storageKey, el.classList.contains("collapsed") ? "1" : "0");
  });
}

export function withErrorBoundary(panel: BoundedPanel, panelName: string): BoundedPanel {
  let container: HTMLElement | null = null;
  let hasRendered = false;

  return {
    render(): HTMLElement {
      try {
        container = panel.render();
        hasRendered = true;
        setupCollapse(container, panelName);
        return container;
      } catch (err) {
        console.error(`[${panelName}] render failed:`, err);
        const fallback = document.createElement("div");
        fallback.className = "panel error-panel";
        fallback.innerHTML = `
          <div class="panel-header">${panelName}</div>
          <div class="error-panel-body">
            <span class="error-panel-icon">!</span>
            <span>Panel failed to load</span>
            <button class="error-panel-retry">Retry</button>
          </div>
        `;
        fallback.querySelector(".error-panel-retry")?.addEventListener("click", () => {
          try {
            const newEl = panel.render();
            hasRendered = true;
            fallback.replaceWith(newEl);
            container = newEl;
          } catch (retryErr) {
            console.error(`[${panelName}] retry failed:`, retryErr);
          }
        });
        container = fallback;
        return fallback;
      }
    },
    refresh(): void {
      if (!hasRendered) return;
      try {
        panel.refresh();
      } catch (err) {
        console.error(`[${panelName}] refresh failed:`, err);
      }
    },
  };
}
