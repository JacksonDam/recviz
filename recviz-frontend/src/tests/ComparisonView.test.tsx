import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ComparisonView from "../ComparisonView";

const mockSetK = vi.fn();
vi.mock("../TopKVisualiser", () => ({
  default: vi.fn(({ setK }) => {
    mockSetK.mockImplementation(setK);
    return (
      <div data-testid="topk-visualiser">
        TopKVisualiser Mock
        <button
          data-testid="change-k-button"
          onClick={() => setK && setK(20)}
        >
          Change K
        </button>
      </div>
    );
  }),
}));

describe("ComparisonView Component", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("updates K value and refetches data when K changes", async () => {
    global.fetch = vi
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockSimilarityMetrics) })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockGraphSimilarityMetrics) })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockSimilarityMetrics) })
      )
      .mockImplementationOnce(() =>
        Promise.resolve({ ok: true, json: () => Promise.resolve(mockGraphSimilarityMetrics) })
      );

    render(<ComparisonView {...defaultProps} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    global.fetch.mockClear();

    const changeKButton = screen.getByTestId("change-k-button");
    await userEvent.click(changeKButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/20/"));
    });
  });
});

const mockSimilarityMetrics = {
  overlap_recs: 0.75,
  sorenson_recs: 0.652,
  jaccard_recs: 0.48,
  cosine_recs: 0.812,
  overlap_hist: 0.63,
  sorenson_hist: 0.524,
  jaccard_hist: 0.356,
  cosine_hist: 0.732,
  overlap_rh1: 0.45,
  sorenson_rh1: 0.375,
  jaccard_rh1: 0.231,
  cosine_rh1: 0.568,
  overlap_rh2: 0.52,
  sorenson_rh2: 0.421,
  jaccard_rh2: 0.268,
  cosine_rh2: 0.631,
};

const mockGraphSimilarityMetrics = {
  panther_similarity: 0.68,
};

const defaultProps = {
  dataset: "movies",
  model1: "model1",
  model2: "model2",
  user1: "user123",
  user2: "user456",
  onClose: vi.fn(),
};
