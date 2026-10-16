// WHOOP 4.0 Telemetry Web Worker
// Runs in an unthrottled separate thread to prevent background tab freezing

let intervalId: number | null = null;
const TICK_INTERVAL_MS = 1000;

self.onmessage = (event: MessageEvent) => {
  const { command } = event.data || {};

  if (command === 'START') {
    if (intervalId !== null) {
      clearInterval(intervalId);
    }
    intervalId = self.setInterval(() => {
      self.postMessage({
        type: 'TICK',
        timestamp: Date.now(),
      });
    }, TICK_INTERVAL_MS);

    self.postMessage({ type: 'STATUS', status: 'RUNNING' });
  } else if (command === 'STOP') {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    self.postMessage({ type: 'STATUS', status: 'STOPPED' });
  } else if (command === 'PING') {
    self.postMessage({ type: 'PONG', timestamp: Date.now() });
  }
};
