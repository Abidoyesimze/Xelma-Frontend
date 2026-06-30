import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useRoundCountdown } from '../../hooks/useRoundCountdown';

describe('useRoundCountdown Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00Z'));
  });

  afterEach(() => {
import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, beforeAll, afterAll, vi } from "vitest";
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

  it('Expired context returns isExpired true and 00:00', () => {
    const past = new Date('2026-06-27T11:00:00Z');
    const { result } = renderHook(() => useRoundCountdown(past));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
    expect(result.current.timeLeftMs).toBe(0);
  });

  it('Sub‑minute context shows mm:ss format', () => {
    const future = new Date(Date.now() + 30 * 1000);
    const { result } = renderHook(() => useRoundCountdown(future));
    expect(result.current.isExpired).toBe(false);
    expect(result.current.formattedTime).toBe('0:30');

    act(() => {
      vi.advanceTimersByTime(10 * 1000);
    });
    expect(result.current.formattedTime).toBe('0:20');
  });

  it('Multi‑hour context formats HH:MM:SS', () => {
    const future = new Date(Date.now() + (1 * 3600 + 2 * 60 + 3) * 1000);
    const { result } = renderHook(() => useRoundCountdown(future));
    expect(result.current.formattedTime).toBe('01:02:03');

    act(() => {
      vi.advanceTimersByTime(62 * 1000);
    });
    expect(result.current.formattedTime).toBe('01:01:01');
  });
});
