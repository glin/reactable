// react-test-renderer requires setTimeout and clearTimeout, but doesn't need them to be functional
export function setTimeout() {
  // no-op
}

export function clearTimeout() {
  // no-op
}
