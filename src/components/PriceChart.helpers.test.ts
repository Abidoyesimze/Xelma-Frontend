import { describe, it, expect } from 'vitest';
import { mergePricePoints, toCandlestickData, type CandlestickData } from './PriceChart.helpers';
import type { PricePoint } from '../lib/api-client';
import type { UTCTimestamp } from 'lightweight-charts';

const p = (time: number, value: number): PricePoint => ({ time, value });

describe('mergePricePoints', () => {
  it('returns the existing reference when the incoming batch is empty', () => {
    const existing = [p(1, 10)];
    expect(mergePricePoints(existing, [])).toBe(existing);
  });

  it('returns the existing reference when every incoming point is a duplicate', () => {
    const existing = [p(1, 10), p(2, 11)];
    const result = mergePricePoints(existing, [p(2, 11)]);
    expect(result).toBe(existing);
  });

  it('returns a new array when a new timestamp arrives', () => {
    const existing = [p(1, 10)];
    const result = mergePricePoints(existing, [p(2, 11)]);
    expect(result).not.toBe(existing);
    expect(result).toEqual([p(1, 10), p(2, 11)]);
  });

  it('returns a new array when an existing timestamp changes value', () => {
    const existing = [p(1, 10)];
    const result = mergePricePoints(existing, [p(1, 12)]);
    expect(result).not.toBe(existing);
    expect(result).toEqual([p(1, 12)]);
  });

  it('keeps points sorted and capped at the most recent 500', () => {
    const existing = Array.from({ length: 500 }, (_, i) => p(i, i));
    const result = mergePricePoints(existing, [p(500, 500)]);
    expect(result).toHaveLength(500);
    expect(result[0]).toEqual(p(1, 1));
    expect(result[result.length - 1]).toEqual(p(500, 500));
  });
});

describe('toCandlestickData', () => {
  it('returns an empty array when given an empty array', () => {
    const result = toCandlestickData([]);
    expect(result).toEqual([]);
  });

  it('converts a single price point to a flat candlestick (OHLC = value)', () => {
    const input = [p(1000, 42.5)];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<CandlestickData>({
      time: 1000 as UTCTimestamp,
      open: 42.5,
      high: 42.5,
      low: 42.5,
      close: 42.5,
    });
  });

  it('converts multiple price points, preserving time order and setting OHLC = value', () => {
    const input = [
      p(1000, 10),
      p(2000, 20),
      p(3000, 15),
    ];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual<CandlestickData>({
      time: 1000 as UTCTimestamp,
      open: 10, high: 10, low: 10, close: 10,
    });
    expect(result[1]).toEqual<CandlestickData>({
      time: 2000 as UTCTimestamp,
      open: 20, high: 20, low: 20, close: 20,
    });
    expect(result[2]).toEqual<CandlestickData>({
      time: 3000 as UTCTimestamp,
      open: 15, high: 15, low: 15, close: 15,
    });
  });

  it('handles zero values correctly', () => {
    const input = [p(100, 0)];
    const result = toCandlestickData(input);

    expect(result[0]).toEqual<CandlestickData>({
      time: 100 as UTCTimestamp,
      open: 0, high: 0, low: 0, close: 0,
    });
  });

  it('handles negative values correctly', () => {
    const input = [p(500, -5.75)];
    const result = toCandlestickData(input);

    expect(result[0]).toEqual<CandlestickData>({
      time: 500 as UTCTimestamp,
      open: -5.75, high: -5.75, low: -5.75, close: -5.75,
    });
  });

  it('handles large decimal precision correctly', () => {
    const input = [p(1, 0.12345678)];
    const result = toCandlestickData(input);

    expect(result[0].open).toBeCloseTo(0.12345678);
    expect(result[0].high).toBeCloseTo(0.12345678);
    expect(result[0].low).toBeCloseTo(0.12345678);
    expect(result[0].close).toBeCloseTo(0.12345678);
  });

  it('does not mutate the input array', () => {
    const input = [p(1, 10), p(2, 20)];
    const copy = [...input];
    toCandlestickData(input);
    expect(input).toEqual(copy);
  });
});
