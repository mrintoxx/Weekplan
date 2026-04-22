import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCurrentTime } from '@/hooks/useCurrentTime';

describe('useCurrentTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne une instance de Date', () => {
    // Arrange & Act
    const { result } = renderHook(() => useCurrentTime());

    // Assert
    expect(result.current).toBeInstanceOf(Date);
  });

  it('met à jour la valeur retournée après exactement 60 000 ms', () => {
    // Arrange
    const { result } = renderHook(() => useCurrentTime());
    const dateBefore = result.current;

    // Act
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Assert
    expect(result.current).toBeInstanceOf(Date);
    expect(result.current.getTime()).toBeGreaterThan(dateBefore.getTime());
  });

  it('ne met pas à jour la valeur retournée après seulement 30 000 ms', () => {
    // Arrange
    const { result } = renderHook(() => useCurrentTime());
    const dateBefore = result.current;

    // Act
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    // Assert
    expect(result.current).toBe(dateBefore);
  });

  it('appelle clearInterval au démontage — plus aucun tick après unmount', () => {
    // Arrange
    const { result, unmount } = renderHook(() => useCurrentTime());
    const dateAtMount = result.current;

    // Act — avancer de 60s pour obtenir une première mise à jour, puis démonter
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const dateAfterFirstTick = result.current;
    expect(dateAfterFirstTick.getTime()).toBeGreaterThan(dateAtMount.getTime());

    unmount();

    // Act — avancer encore de 60s après le démontage
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Assert — la valeur figée au moment du unmount n'a pas changé
    expect(result.current).toBe(dateAfterFirstTick);
  });

  it("n'utilise pas setInterval avec un délai différent de 60 000 ms", () => {
    // Arrange
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    // Act
    renderHook(() => useCurrentTime());

    // Assert — le hook enregistre exactement un intervalle de 60 000 ms
    const calls = setIntervalSpy.mock.calls;
    expect(calls.length).toBe(1);
    expect(calls[0]?.[1]).toBe(60_000);

    setIntervalSpy.mockRestore();
  });

  it('appelle clearInterval exactement une fois au démontage', () => {
    // Arrange
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    // Act
    const { unmount } = renderHook(() => useCurrentTime());

    expect(clearIntervalSpy).not.toHaveBeenCalled();

    unmount();

    // Assert
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

    clearIntervalSpy.mockRestore();
  });
});
