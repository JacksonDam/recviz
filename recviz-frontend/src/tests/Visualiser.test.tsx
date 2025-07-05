import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Visualiser } from '../Visualiser';

vi.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children }) => <div data-testid="sigma-container">{children}</div>,
  useLoadGraph: () => vi.fn(),
  useRegisterEvents: () => vi.fn(),
  useSetSettings: vi.fn(),
  useSigma: () => ({
    getGraph: vi.fn(() => new (require('graphology'))()), // Ensure graph is returned
  }),
  SearchControl: () => <div data-testid="search-control" />,
}));


vi.mock('@sigma/node-square', () => ({
  NodeSquareProgram: 'mocked-node-square-program',
}));

vi.mock('graphology', () => {
  const MockGraph = function() {
    return {
      order: 0,
      forEachNode: vi.fn(),
      forEachEdge: vi.fn(),
      source: vi.fn(),
      target: vi.fn(),
      setEdgeAttribute: vi.fn(),
      setNodeAttribute: vi.fn(),
      getNodeAttribute: vi.fn(),
    };
  };

  return {
    default: MockGraph
  };
});

vi.mock('graphology-gexf/browser', () => ({
  parse: vi.fn(() => {
    return {
      order: 10,
      forEachNode: vi.fn((callback) => {
        callback('node1');
        callback('node2');
      }),
      forEachEdge: vi.fn((callback) => {
        callback('edge1');
        callback('edge2');
      }),
      source: vi.fn(() => 'source1'),
      target: vi.fn(() => 'target1'),
      setEdgeAttribute: vi.fn(),
      setNodeAttribute: vi.fn(),
      getNodeAttribute: vi.fn((node, attr) => {
        if (attr === 'type' && node === 'node1') return 'circle';
        if (attr === 'filter_feature' && node === 'node1') return 'category';
        if (attr === 'filter_query' && node === 'node1') return 'query';
        return null;
      }),
    };
  }),
}));

vi.mock('./EventHandler', () => ({
  default: ({ setSelectedNode, setInteractionHistory, setNodeAttributes }) => (
    <div
      data-testid="event-handler"
      data-set-selected-node={!!setSelectedNode}
      data-set-interaction-history={!!setInteractionHistory}
      data-set-node-attributes={!!setNodeAttributes}
    />
  ),
}));

vi.mock('./AttributeList', () => ({
  default: ({ attributes }) => (
    <div data-testid="attribute-list" data-attributes={JSON.stringify(attributes)} />
  ),
}));

vi.mock('./ColorPalette', () => ({
  default: ({ open, onColorSelect }) => (
    <div
      data-testid="color-palette"
      data-open={open}
      onClick={() => onColorSelect && onColorSelect('#ff0000')}
    />
  ),
}));

const renderVisualiser = (props = {}) => {
  const defaultProps = {
    setInteractionHistory: vi.fn(),
    onModelChange: vi.fn(),
    onSelectNode: vi.fn(),
    dataset: 'test-dataset',
  };

  return render(<Visualiser {...defaultProps} {...props} />);
};

describe('Visualiser Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn();

    vi.mocked(global.fetch).mockImplementation((url) => {
      if (url.includes('/get_user_features/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ fields: ['genre', 'year', 'rating'] }),
        } as Response);
      }
      if (url.includes('/get_dataset_models/')) {
        return Promise.resolve({
          json: () => Promise.resolve({ models: ['model1.pth', 'model2.pth'] }),
        } as Response);
      }
      if (url.includes('/get_inter_graph/')) {
        return Promise.resolve({
          text: () => Promise.resolve('<gexf>mocked gexf data</gexf>'),
        } as Response);
      }
      if (url.includes('/get_topk_all/')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            'user1': [['rank1', 'item1'], ['rank2', 'item2']],
            'user2': [['rank1', 'item3'], ['rank2', 'item4']],
          }),
        } as Response);
      }

      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders without crashing', () => {
    renderVisualiser();
    expect(screen.getAllByText(/fetch new graph/i)[0]).toBeDefined();
  });

  it('fetches features and models when dataset is provided', async () => {
    renderVisualiser();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recvizapi/get_user_features/test-dataset'
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/recvizapi/get_dataset_models/test-dataset'
      );
    });
  });

  it('opens dialog when Fetch New Graph button is clicked', async () => {
    renderVisualiser();

    const fetchButton = screen.getAllByText(/fetch new graph/i)[0];
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getAllByText(/add\/remove filters/i)[0]).toBeDefined();
    });
  });

  it('handles adding a new filter', async () => {
    renderVisualiser();

    const fetchButton = screen.getAllByText(/fetch new graph/i)[0];
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getAllByText(/add\/remove filters/i)[0]).toBeDefined();
    });

    const categorySelect = screen.getAllByText('Filter category:')[0].nextSibling;
    fireEvent.mouseDown(categorySelect);
    await waitFor(() => {
      const genreOption = screen.getAllByText('genre')[0];
      fireEvent.click(genreOption);
    });

    const queryInput = screen.getAllByLabelText(/value x or range x-y/i)[0];
    fireEvent.change(queryInput, { target: { value: 'action' } });

    const addFilterButton = screen.getAllByText('Add Filter')[0];
    fireEvent.click(addFilterButton);

    await waitFor(() => {
      expect(screen.getAllByText(/genre: action/i)[0]).toBeDefined();
    });
  });

  it('renders loading indicator when fetching graph', async () => {
    vi.mocked(global.fetch).mockImplementation((url) => {
      if (url.includes('/get_inter_graph/')) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              text: () => Promise.resolve('<gexf>mocked gexf data</gexf>'),
            } as Response);
          }, 100);
        });
      }

      return Promise.resolve({
        json: () => Promise.resolve({ fields: ['genre'], models: ['model1.pth'] }),
      } as Response);
    });

    renderVisualiser();

    const fetchButton = screen.getAllByText(/fetch new graph/i)[0];
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(screen.getAllByText(/add\/remove filters/i)[0]).toBeDefined();
    });

    const fetchGraphButton = screen.getAllByText('Fetch Graph')[0];
    fireEvent.click(fetchGraphButton);

    const loadingElement = await screen.findByRole('progressbar');
    expect(loadingElement).toBeDefined();
  });

  it('handles filter removal', async () => {
    renderVisualiser();

    const fetchButton = screen.getAllByText(/fetch new graph/i)[0];
    fireEvent.click(fetchButton);

    const categorySelect = screen.getAllByText('Filter category:')[0].nextSibling;
    fireEvent.mouseDown(categorySelect);
    await waitFor(() => {
      const genreOption = screen.getAllByText('genre')[0];
      fireEvent.click(genreOption);
    });

    const queryInput = screen.getAllByLabelText(/value x or range x-y/i)[0];
    fireEvent.change(queryInput, { target: { value: 'action' } });

    const addFilterButton = screen.getAllByText('Add Filter')[0];
    fireEvent.click(addFilterButton);

    await waitFor(() => {
      expect(screen.getAllByText(/genre: action/i)[0]).toBeDefined();
    });

    const deleteButton = screen.getAllByText(/genre: action/i)[0].parentElement?.querySelector('button:last-child');

    if (!deleteButton) {
      throw new Error('Delete button not found');
    }
    else {
      fireEvent.click(deleteButton);
    }

    await waitFor(() => {
      expect(screen.queryByText(/genre: action/i)).toBeNull();
      expect(screen.getAllByText(/no filters currently applied/i)[0]).toBeDefined();
    });
  });
});