type AnyFunction = (...args: any[]) => any;

interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function debounce<T extends AnyFunction>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let lastArgs: any[];
  let lastThis: any;
  let result: any;

  const { leading = false, trailing = true, maxWait } = options;

  function invokeFunc(time: number): any {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time: number): any {
    lastInvokeTime = time;
    timeoutId = setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number): number {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait === undefined
      ? timeWaiting
      : Math.min(timeWaiting, maxWait - timeSinceLastInvoke);
  }

  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - (lastCallTime || 0);
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired(): void {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number): any {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = undefined;
  }

  function flush(): any {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: any[]): any {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxWait !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timeoutId === undefined) {
      timeoutId = setTimeout(timerExpired, wait);
    }
    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced as T & { cancel: () => void };
}

export function throttle<T extends AnyFunction>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): T & { cancel: () => void } {
  return debounce(func, wait, {
    leading: options.leading,
    trailing: options.trailing,
    maxWait: wait
  }) as T & { cancel: () => void };
}

// Example usage:
/*
// Debounce example
const debouncedSearch = debounce((query: string) => {
  // API call or expensive operation
  console.log('Searching for:', query);
}, 300);

// With leading and trailing options
const debouncedSave = debounce(
  () => {
    // Save operation
  },
  1000,
  { leading: true, trailing: true }
);

// Throttle example
const throttledScroll = throttle(() => {
  // Handle scroll event
  console.log('Scroll event');
}, 100);

// Cleanup
debouncedSearch.cancel();
throttledScroll.cancel();
*/