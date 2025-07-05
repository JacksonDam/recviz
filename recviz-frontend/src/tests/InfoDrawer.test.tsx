import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InfoDrawer from '../InfoDrawer';

describe('InfoDrawer Component', () => {
  let toggleDrawer: vi.Mock;

  beforeEach(() => {
    toggleDrawer = vi.fn();
  });

  it('renders the Drawer when open is true', () => {
    render(<InfoDrawer open={true} toggleDrawer={toggleDrawer} />);
    const drawer = screen.getByRole('presentation');
    expect(within(drawer).getByText('Help')).toBeTruthy();
    expect(within(drawer).getByText('About this app')).toBeTruthy();
  });

  it('calls toggleDrawer(false) and opens Help dialog when Help is clicked', async () => {
    render(<InfoDrawer open={true} toggleDrawer={toggleDrawer} />);
    const drawer = screen.getByRole('presentation');
    const helpButton = within(drawer).getByRole('button', { name: /^Help$/i });
    fireEvent.click(helpButton);

    expect(toggleDrawer).toHaveBeenCalledWith(false);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Help')).toBeTruthy();
    expect(within(dialog).getByText(/placeholder help contents/i)).toBeTruthy();
  });

  it('calls toggleDrawer(false) and opens About dialog when About is clicked', async () => {
    render(<InfoDrawer open={true} toggleDrawer={toggleDrawer} />);
    const drawer = screen.getByRole('presentation');
    const aboutButton = within(drawer).getByRole('button', { name: /^About this app$/i });
    fireEvent.click(aboutButton);

    expect(toggleDrawer).toHaveBeenCalledWith(false);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('About this app')).toBeTruthy();
    expect(within(dialog).getByText(/this app was developed/i)).toBeTruthy();
  });

  it('closes Help dialog when the Close button is clicked', async () => {
    render(<InfoDrawer open={true} toggleDrawer={toggleDrawer} />);
    const drawer = screen.getByRole('presentation');
    const helpButton = within(drawer).getByRole('button', { name: /^Help$/i });
    fireEvent.click(helpButton);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Help')).toBeTruthy();

    const closeHelpButton = within(dialog).getByRole('button', { name: /^Close$/i });
    fireEvent.click(closeHelpButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('closes About dialog when the Close button is clicked', async () => {
    render(<InfoDrawer open={true} toggleDrawer={toggleDrawer} />);
    const drawer = screen.getByRole('presentation');
    const aboutButton = within(drawer).getByRole('button', { name: /^About this app$/i });
    fireEvent.click(aboutButton);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('About this app')).toBeTruthy();

    const closeAboutButton = within(dialog).getByRole('button', { name: /^Close$/i });
    fireEvent.click(closeAboutButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  it('calls toggleDrawer(false) when the Drawer is closed (e.g., via Escape key)', () => {
    render(<InfoDrawer open={true} toggleDrawer={toggleDrawer} />);
    const drawer = screen.getByRole('presentation');
    fireEvent.keyDown(drawer, { key: 'Escape', code: 'Escape' });

    expect(toggleDrawer).toHaveBeenCalledWith(false);
  });
});
