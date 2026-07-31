import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import Pools from './Pools';

describe('Pools Page', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the Liquidity Pools heading', async () => {
      render(<Pools />);

      // Fast-forward past the setTimeout in the useEffect
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Liquidity Pools');
    });

    it('renders the description subtitle', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(
        screen.getByText(/Transparency and historical stats for all active round pools/i),
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner initially', () => {
      render(<Pools />);

      // Before the timer fires, we should see a loading indicator
      // The component renders a div with animate-spin class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('hides the loading spinner after data loads', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeNull();
    });
  });

  describe('pool cards', () => {
    it('renders pool cards for BTC, ETH, and XLM', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText('BTC Pool')).toBeInTheDocument();
      expect(screen.getByText('ETH Pool')).toBeInTheDocument();
      expect(screen.getByText('XLM Pool')).toBeInTheDocument();
    });

    it('displays total volume for each pool', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      // Check that vXLM labels appear (volume currency)
      const vxlmLabels = screen.getAllByText('vXLM');
      expect(vxlmLabels.length).toBeGreaterThanOrEqual(3);
    });

    it('renders UP/DOWN pool sections', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const upDownHeaders = screen.getAllByText('UP/DOWN Pool');
      expect(upDownHeaders).toHaveLength(3);
    });

    it('renders Precision Pool sections', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const precisionHeaders = screen.getAllByText('Precision Pool');
      expect(precisionHeaders).toHaveLength(3);
    });

    it('renders Historical Yield sections', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const yieldHeaders = screen.getAllByText('Historical Yield');
      expect(yieldHeaders).toHaveLength(3);
    });
  });

  describe('loaded state', () => {
    it('renders pool data after loading completes', async () => {
      render(<Pools />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      // Should render pools data for all three assets
      expect(screen.getByText('BTC Pool')).toBeInTheDocument();
      expect(screen.getByText('ETH Pool')).toBeInTheDocument();
      expect(screen.getByText('XLM Pool')).toBeInTheDocument();
    });
  });

  describe('no network calls', () => {
    it('does not make real fetch calls', () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      render(<Pools />);

      // Pools uses mock data with setTimeout, no fetch
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });
});
