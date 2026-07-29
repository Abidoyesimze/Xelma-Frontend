import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PredictionControls from './PredictionControls';

describe('PredictionControls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders successfully with default props', () => {
    render(<PredictionControls />);

    expect(screen.getByRole('heading', { name: /Guess price prediction/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /Stake Amount/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /UP/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /DOWN/i })).toBeInTheDocument();
  });

  it('selects bullish/up direction and updates active selection', () => {
    const onPrediction = vi.fn();

    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="100.00 XLM"
        onPrediction={onPrediction}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '10' },
    });

    const upButton = screen.getByRole('button', { name: /UP/i });
    fireEvent.click(upButton);

    expect(onPrediction).toHaveBeenCalledWith({
      direction: 'UP',
      stake: '10',
      exactPrice: undefined,
      isLegend: false,
    });
    expect(upButton).toHaveClass('prediction-card__button--active');
  });

  it('selects bearish/down direction and updates active selection', () => {
    const onPrediction = vi.fn();

    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="100.00 XLM"
        onPrediction={onPrediction}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '5' },
    });

    const downButton = screen.getByRole('button', { name: /DOWN/i });
    fireEvent.click(downButton);

    expect(onPrediction).toHaveBeenCalledWith({
      direction: 'DOWN',
      stake: '5',
      exactPrice: undefined,
      isLegend: false,
    });
    expect(downButton).toHaveClass('prediction-card__button--active');
  });

  it('accepts a valid stake and submits prediction', () => {
    const onPrediction = vi.fn();

    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="50.00 XLM"
        onPrediction={onPrediction}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '50' },
    });

    fireEvent.click(screen.getByRole('button', { name: /UP/i }));

    expect(onPrediction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rejects invalid stake values and displays validation messages', () => {
    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="20.00 XLM"
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '0' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/Stake must be greater than 0/i);
    expect(screen.getByRole('button', { name: /UP/i })).toBeDisabled();
  });

  it('rejects stakes that exceed wallet balance with an error alert', () => {
    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="20.00 XLM"
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '50' },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(/Stake exceeds available balance/i);
    expect(screen.getByRole('button', { name: /UP/i })).toBeDisabled();
  });

  it('shows exact price validation message for legend prediction bounds', () => {
    const onPrediction = vi.fn();

    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="100.00 XLM"
        onPrediction={onPrediction}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '10' },
    });

    fireEvent.click(screen.getByRole('checkbox', { name: /I am a legend/i }));

    const exactPriceInput = screen.getByRole('spinbutton', { name: /Exact Price Prediction/i });
    fireEvent.change(exactPriceInput, { target: { value: '0.0000' } });
    fireEvent.blur(exactPriceInput);

    expect(screen.getByRole('alert')).toHaveTextContent(/Must be between 0.0001 and 10/i);
    expect(onPrediction).not.toHaveBeenCalled();
  });

  it('handles boundary stake values correctly with exact price legend prediction', () => {
    const onPrediction = vi.fn();
    render(
      <PredictionControls
        isWalletConnected={true}
        isRoundActive={true}
        walletBalance="100.00 XLM"
        onPrediction={onPrediction}
      />
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: /Stake Amount/i }), {
      target: { value: '100' },
    });

    const legendCheckbox = screen.getByRole('checkbox', { name: /I am a legend/i });
    fireEvent.click(legendCheckbox);

    const exactPriceInput = screen.getByRole('spinbutton', { name: /Exact Price Prediction/i });
    fireEvent.change(exactPriceInput, { target: { value: '0.0001' } });
    fireEvent.blur(exactPriceInput);

    fireEvent.click(screen.getByRole('button', { name: /DOWN/i }));

    expect(onPrediction).toHaveBeenCalledWith({
      direction: 'DOWN',
      stake: '100',
      exactPrice: '0.0001',
      isLegend: true,
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables controls and prevents submission when wallet is disconnected', () => {
    const onPrediction = vi.fn();

    render(
      <PredictionControls
        isWalletConnected={false}
        isRoundActive={true}
        walletBalance="100.00 XLM"
        onPrediction={onPrediction}
      />
    );

    expect(screen.getByRole('spinbutton', { name: /Stake Amount/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /UP/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /DOWN/i })).toBeDisabled();
    expect(screen.getByText(/Connect your wallet to make predictions/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /UP/i }));
    expect(onPrediction).not.toHaveBeenCalled();
  });
});