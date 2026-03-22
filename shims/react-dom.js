// Shim for react-dom in React Native.
// @react-aria/utils uses flushSync for web animation batching — on native we
// can safely call the callback directly since React Native handles batching itself.
export function flushSync(fn) {
  return fn();
}
