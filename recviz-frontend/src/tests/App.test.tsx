import { createRoot } from "react-dom/client";
import { act } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import App from "../App";

vi.mock("../Visualiser", () => ({
  Visualiser: () => <div data-testid="visualiser" />,
}));

vi.mock("../ComparisonView", () => ({
  default: () => <div data-testid="comparison-view" />,
}));

vi.mock("../InfoDrawer", () => ({
  default: ({ open, toggleDrawer }: { open: boolean; toggleDrawer: (open: boolean) => void }) => (
    <div data-testid="info-drawer" onClick={() => toggleDrawer(false)}>
      {open ? "open" : "closed"}
    </div>
  ),
}));

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ datasets: [] }),
});

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  (global.fetch as vi.Mock).mockReset();
  (global.fetch as vi.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ datasets: [] }),
  });
});

afterEach(() => {
  root.unmount();
  document.body.removeChild(container);
});

describe("App Component", () => {
  it("renders the app bar with the title", () => {
    act(() => {
      root.render(<App />);
    });
    const appBar = container.querySelector(".MuiAppBar-root");
    expect(appBar).toBeTruthy();
    expect(appBar?.textContent).toMatch(/RecViz/i);
  });

  it("opens the drawer when the menu button is clicked", () => {
    act(() => {
      root.render(<App />);
    });
    const menuButton = container.querySelector("button[aria-label='menu']");
    expect(menuButton).toBeTruthy();
    act(() => {
      menuButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    const drawer = container.querySelector("[data-testid='info-drawer']");
    expect(drawer).toBeTruthy();
  });

  it("opens and closes the dataset selection dialog", async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ datasets: [] }),
    });

    await act(async () => {
      root.render(<App />);
    });

    const buttons = Array.from(container.querySelectorAll("button"));
    const changeButton = buttons.find((btn) =>
      btn.textContent?.includes("Change dataset")
    );
    expect(changeButton).toBeTruthy();
    act(() => {
      changeButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    let dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    const closeButton = dialog?.querySelector("button");
    expect(closeButton).toBeTruthy();

    act(() => {
      closeButton!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).toBeFalsy();
  });

  it("disables User Comparison button when no nodes are selected", () => {
    act(() => {
      root.render(<App />);
    });
    const buttons = Array.from(container.querySelectorAll("button"));
    const compButton = buttons.find((btn) =>
      btn.textContent?.includes("User comparison view")
    ) as HTMLButtonElement | undefined;
    expect(compButton).toBeTruthy();
    expect(compButton!.disabled).toBe(true);
  });
});