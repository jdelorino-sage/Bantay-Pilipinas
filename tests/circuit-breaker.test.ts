import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreaker } from "../server/src/services/circuit-breaker";

describe("CircuitBreaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("allows execution by default", () => {
    const cb = new CircuitBreaker("test", 3, 60_000);
    expect(cb.canExecute()).toBe(true);
  });

  it("allows execution after fewer failures than threshold", () => {
    const cb = new CircuitBreaker("test", 3, 60_000);
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.canExecute()).toBe(true);
  });

  it("trips after reaching failure threshold", () => {
    const cb = new CircuitBreaker("test", 3, 60_000);
    cb.recordFailure();
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.canExecute()).toBe(false);
  });

  it("recovers after cooldown expires", () => {
    const cb = new CircuitBreaker("test", 2, 10_000);
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.canExecute()).toBe(false);

    vi.advanceTimersByTime(10_001);
    expect(cb.canExecute()).toBe(true);
  });

  it("resets failure count on success", () => {
    const cb = new CircuitBreaker("test", 3, 60_000);
    cb.recordFailure();
    cb.recordFailure();
    cb.recordSuccess();

    cb.recordFailure();
    cb.recordFailure();
    expect(cb.canExecute()).toBe(true);
  });

  it("reports correct status", () => {
    const cb = new CircuitBreaker("myservice", 2, 5_000);
    expect(cb.getStatus()).toEqual({ id: "myservice", failures: 0, isOpen: false });

    cb.recordFailure();
    expect(cb.getStatus()).toEqual({ id: "myservice", failures: 1, isOpen: false });

    cb.recordFailure();
    expect(cb.getStatus().isOpen).toBe(true);
    expect(cb.getStatus().failures).toBe(2);
  });

  it("stays blocked during cooldown window", () => {
    const cb = new CircuitBreaker("test", 1, 30_000);
    cb.recordFailure();

    vi.advanceTimersByTime(15_000);
    expect(cb.canExecute()).toBe(false);

    vi.advanceTimersByTime(15_001);
    expect(cb.canExecute()).toBe(true);
  });
});
