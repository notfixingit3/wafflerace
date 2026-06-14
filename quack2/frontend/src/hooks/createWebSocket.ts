// Wrapper around the WebSocket constructor so tests can mock it via vi.mock
export function createWebSocket(url: string): WebSocket {
  return new WebSocket(url);
}
