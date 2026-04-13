/**
 * Creates a debounced version of a function that delays invoking
 * until after wait milliseconds have elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param wait - Milliseconds to wait before invoking
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a debounced async version of a function.
 *
 * @param fn - The async function to debounce
 * @param wait - Milliseconds to wait before invoking
 * @returns Debounced async function
 */
export function debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => Promise<void> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<void> | null = null;
  let resolvePending: (() => void) | null = null;

  return async function (this: unknown, ...args: Parameters<T>) {
    // Wait for any pending debounce to complete
    if (pendingPromise) {
      await pendingPromise;
      return;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    pendingPromise = new Promise<void>((resolve) => {
      resolvePending = resolve;
    });

    timeoutId = setTimeout(async () => {
      try {
        await fn.apply(this, args);
      } finally {
        pendingPromise = null;
        resolvePending?.();
        timeoutId = null;
      }
    }, wait);
  };
}
