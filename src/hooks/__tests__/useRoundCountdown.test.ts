import { renderHook, act } from '@testing-library/react';
import { useRoundCountdown } from '../../hooks/useRoundCountdown';

// Helper to advance timers safely
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useRoundCountdown Hook', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00Z')); // fixed now
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  test('Expired context returns isExpired true and 00:00', () => {
    const past = new Date('2026-06-27T11:00:00Z'); // 1 hour ago
    const { result } = renderHook(() => useRoundCountdown(past));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
    expect(result.current.timeLeftMs).toBe(0);
  });

  test('Sub‑minute context shows 00:30 format', () => {
    const future = new Date(Date.now() + 30 * 1000); // 30 seconds ahead
    const { result } = renderHook(() => useRoundCountdown(future));
    // initial state
    expect(result.current.isExpired).toBe(false);
    expect(result.current.formattedTime).toBe('00:30');
    // advance 10 seconds
    advance(10 * 1000);
    expect(result.current.formattedTime).toBe('00:20');
  });

  test('Multi‑hour context formats HH:MM:SS', () => {
    const future = new Date(Date.now() + (1 * 3600 + 2 * 60 + 3) * 1000); // 1h 2m 3s ahead
    const { result } = renderHook(() => useRoundCountdown(future));
    expect(result.current.formattedTime).toBe('01:02:03');
    // advance 62 seconds (1m 2s) -> should become 01:01:01
    advance(62 * 1000);
    expect(result.current.formattedTime).toBe('01:01:01');
  });
});
