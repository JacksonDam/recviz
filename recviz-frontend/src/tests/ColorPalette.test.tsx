import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import ColorPalette from "../ColorPalette";

describe("ColorPalette Component", () => {
  const mockOnClose = vi.fn();
  const mockOnColorSelect = vi.fn();
  let anchorEl: HTMLElement;

  beforeEach(() => {
    mockOnClose.mockReset();
    mockOnColorSelect.mockReset();

    anchorEl = document.createElement("button");
    document.body.appendChild(anchorEl);

    cleanup();
  });

  it("renders correctly when open", () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={true}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const colorButtons = screen.getAllByRole("button");
    expect(colorButtons.length).toBe(7);

    const customButton = screen.getByRole("button", { name: "Custom" });
    expect(customButton).toBeTruthy();
  });

  it("doesn't render when closed", () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={false}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const popoverContent = document.querySelector('.MuiPopover-paper');
    expect(popoverContent).toBeNull();
  });

  it("calls onColorSelect with the correct color when a predefined color is clicked", async () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={true}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const buttons = screen.getAllByRole("button");

    const redButton = buttons.find(button =>
      window.getComputedStyle(button).backgroundColor === 'rgb(255, 0, 0)' ||
      button.style.backgroundColor === '#FF0000'
    );

    fireEvent.click(redButton || buttons[0]);

    expect(mockOnColorSelect).toHaveBeenCalledWith("#FF0000", true);
  });

  it("shows custom color controls when Custom button is clicked", async () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={true}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const customButton = screen.getByRole("button", { name: "Custom" });

    fireEvent.click(customButton);

    await waitFor(() => {
      const hexInput = screen.getByLabelText(/hex/i);
      expect(hexInput).toBeTruthy();

      const slider = screen.getByRole("slider");
      expect(slider).toBeTruthy();
    });

    expect(mockOnColorSelect).toHaveBeenCalledWith("#FF0000", false);
  });

  it("updates color when hex input changes", async () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={true}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const customButton = screen.getByRole("button", { name: "Custom" });
    fireEvent.click(customButton);

    const hexInput = screen.getByLabelText(/hex/i);

    fireEvent.change(hexInput, { target: { value: "#00FF00" } });

    expect(mockOnColorSelect).toHaveBeenCalledWith("#00FF00", false);
  });

  it("updates color when slider changes", async () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={true}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const customButton = screen.getByRole("button", { name: "Custom" });
    fireEvent.click(customButton);

    mockOnColorSelect.mockReset();

    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "120" } });

    expect(mockOnColorSelect).toHaveBeenCalled();
    const calledColor = mockOnColorSelect.mock.calls[0][0];
    expect(calledColor.toLowerCase()).toBe("#00ff00");
  });

  it("doesn't update color for invalid hex values", async () => {
    render(
      <ColorPalette
        anchorEl={anchorEl}
        open={true}
        onClose={mockOnClose}
        onColorSelect={mockOnColorSelect}
      />
    );

    const customButton = screen.getByRole("button", { name: "Custom" });
    fireEvent.click(customButton);
    mockOnColorSelect.mockReset();
    const hexInput = screen.getByLabelText(/hex/i);
    fireEvent.change(hexInput, { target: { value: "#GGGGGG" } });
    expect(mockOnColorSelect).not.toHaveBeenCalled();
  });
});