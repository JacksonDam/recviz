import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import AttributeList from "../AttributeList";

const mockAttributes = {
  Name: "TestNode",
  Age: 25,
  Active: true,
  Description: "This is a sample node description."
};

describe("AttributeList Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not render when attributes are empty", () => {
    render(<AttributeList attributes={{}} />);
    expect(screen.queryByText(/Node Attributes/i)).toBeNull();
  });

  it("renders attributes correctly", () => {
    render(<AttributeList attributes={mockAttributes} />);
    expect(screen.getByText(/Node Attributes \(4\)/i)).toBeTruthy();

    const listItems = screen.getAllByRole("button");
    expect(listItems.length).toBeGreaterThan(1);

    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Age")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
  });

  it("toggles attribute details on click", async () => {
    render(<AttributeList attributes={mockAttributes} />);

    const nameItems = screen.getAllByRole("button").filter(
      item => item.textContent?.includes("Name")
    );
    const nameItem = nameItems[0];
    expect(nameItem).toBeTruthy();

    fireEvent.click(nameItem);

    await waitFor(() => {
      expect(screen.getByText("TestNode")).toBeTruthy();
    });

    fireEvent.click(nameItem);

    await waitFor(() => {
      expect(screen.queryByText("TestNode")).toBeNull();
    });
  });

  it("toggles the attribute list visibility", async () => {
    const { container } = render(<AttributeList attributes={mockAttributes} />);

    const headerButton = screen.getByRole("button", {
      name: ""
    });
    expect(headerButton).toBeTruthy();

    expect(container.querySelector(".MuiCollapse-entered")).toBeTruthy();

    fireEvent.click(headerButton);

    await waitFor(() => {
      expect(screen.queryByText("Name")).toBeNull();
    });

    fireEvent.click(headerButton);

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeTruthy();
    });
  });
});