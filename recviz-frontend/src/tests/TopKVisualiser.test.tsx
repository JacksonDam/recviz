import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TopKVisualiser from '../TopKVisualiser';

vi.mock('@react-sigma/core', () => ({
  SigmaContainer: ({}) => <div data-testid="sigma-container">{}</div>,
  useLoadGraph: () => () => {},
}));

vi.mock('graphology', () => {
  return {
    default: class MockGraph {
      addNode() {}
      addEdge() {}
    },
  };
});

describe('TopKVisualiser Component', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders slider and default UI elements', () => {
    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );
    const text = screen.getByText('k = 10');
    expect(text).toBeTruthy(); // Use "toBeTruthy" as a check
    const slider = screen.getByRole('slider');
    expect(slider).toBeTruthy();
  });

  it('updates k value when slider is moved', () => {
    const setK = vi.fn();
    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={setK}
        user1="user1"
        user2="user2"
      />
    );

    const slider = screen.getAllByRole('slider')[1];
    fireEvent.input(slider, { target: { value: '20' } });

    expect(setK).toHaveBeenCalledWith(20);
  });

  it('fetches recommendations and updates the graph', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ user1: [{ itemName: 'Item1', itemId: '1', score: 4.5 }] }),
    });
    global.fetch = mockFetch;

    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  });

  it('logs an error if fetching fails', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Fetch failed'));
    global.fetch = mockFetch;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        'Error fetching recommendations or interaction history:',
        expect.any(Error)
      )
    );
  });

  it('does not fetch data if required props are missing', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    render(
      <TopKVisualiser
        dataset=""
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );

    await waitFor(() => expect(mockFetch).not.toHaveBeenCalled());
  });

  it('displays empty graph when no recommendations are available', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ user1: [], user2: [] }),
    });
    global.fetch = mockFetch;

    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    const graphContainers = screen.queryAllByTestId('sigma-container');

    const graphContainer = graphContainers[0];
    expect(graphContainer).toBeTruthy();

    const nodes = screen.queryAllByTestId('graph-node');
    expect(nodes).toHaveLength(0);

    const edges = screen.queryAllByTestId('graph-edge');
    expect(edges).toHaveLength(0);
  });

  it('handles missing interaction history gracefully', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ user1: [{ itemName: 'Item1', itemId: '1', score: 4.5 }] }),
    });
    global.fetch = mockFetch;

    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const graphContainer = screen.getAllByTestId('sigma-container')[0];
    expect(graphContainer).toBeTruthy();
  });

  it('properly handles invalid data formats', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ user1: 'invalidData' }),
    });
    global.fetch = mockFetch;

    render(
      <TopKVisualiser
        dataset="ml-100k"
        model1="model1"
        model2="model2"
        k={10}
        setK={() => {}}
        user1="user1"
        user2="user2"
      />
    );

    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const graphContainer = screen.getAllByTestId('sigma-container')[0];
    expect(graphContainer).toBeTruthy();
  });
});
