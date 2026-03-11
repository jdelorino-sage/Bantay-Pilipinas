interface BoundedPanel {
  render(): HTMLElement;
  refresh(): void;
}

export function withErrorBoundary(panel: BoundedPanel, panelName: string): BoundedPanel {
  let container: HTMLElement | null = null;
  let hasRendered = false;

  return {
    render(): HTMLElement {
      try {
        container = panel.render();
        hasRendered = true;
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
