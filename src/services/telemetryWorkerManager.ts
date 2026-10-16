// Telemetry Worker Manager for WHOOP 4.0
// Manages unthrottled Web Worker heartbeat and silent audio keep-alive

type TickListener = (timestamp: number) => void;

class TelemetryWorkerManager {
  private worker: Worker | null = null;
  private listeners: Set<TickListener> = new Set();
  private fallbackInterval: number | null = null;
  private isRunning = false;
  private audioKeepAliveCtx: AudioContext | null = null;
  private audioKeepAliveNode: AudioBufferSourceNode | null = null;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined') return;

    try {
      // Load Vite module worker
      this.worker = new Worker(
        new URL('../workers/telemetryWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (data && data.type === 'TICK') {
          this.emitTick(data.timestamp || Date.now());
        }
      };

      this.worker.onerror = (err) => {
        console.warn('Telemetry Web Worker error, falling back to interval:', err);
        this.fallbackToInterval();
      };
    } catch (e) {
      console.warn('Could not initialize Telemetry Web Worker, falling back to window timer:', e);
      this.fallbackToInterval();
    }
  }

  private fallbackToInterval(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
    if (this.isRunning && this.fallbackInterval === null) {
      this.fallbackInterval = window.setInterval(() => {
        this.emitTick(Date.now());
      }, 1000);
    }
  }

  private emitTick(timestamp: number): void {
    this.listeners.forEach((listener) => {
      try {
        listener(timestamp);
      } catch (e) {
        console.error('Error in tick listener:', e);
      }
    });
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    if (this.worker) {
      this.worker.postMessage({ command: 'START' });
    } else {
      this.fallbackToInterval();
    }
  }

  public stop(): void {
    this.isRunning = false;

    if (this.worker) {
      this.worker.postMessage({ command: 'STOP' });
    }
    if (this.fallbackInterval !== null) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  public subscribe(listener: TickListener): () => void {
    this.listeners.add(listener);
    if (!this.isRunning && this.listeners.size > 0) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  // Mobile background audio keep-alive (keeps Web Bluetooth connection alive on iOS/Android)
  public enableBackgroundKeepAlive(): void {
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioKeepAliveCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.audioKeepAliveCtx = new AudioCtx();
      }

      if (this.audioKeepAliveCtx.state === 'suspended') {
        this.audioKeepAliveCtx.resume().catch(() => {});
      }

      // Generate a tiny 1-second silent buffer looping continuously
      const buffer = this.audioKeepAliveCtx.createBuffer(1, this.audioKeepAliveCtx.sampleRate, this.audioKeepAliveCtx.sampleRate);
      const source = this.audioKeepAliveCtx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      // Keep gain extremely low to avoid any inadvertent hiss
      const gainNode = this.audioKeepAliveCtx.createGain();
      gainNode.gain.value = 0.00001;

      source.connect(gainNode);
      gainNode.connect(this.audioKeepAliveCtx.destination);
      source.start(0);

      this.audioKeepAliveNode = source;
    } catch (e) {
      console.warn('Could not start background audio keep-alive:', e);
    }
  }

  public disableBackgroundKeepAlive(): void {
    if (this.audioKeepAliveNode) {
      try {
        this.audioKeepAliveNode.stop();
        this.audioKeepAliveNode.disconnect();
      } catch {}
      this.audioKeepAliveNode = null;
    }
    if (this.audioKeepAliveCtx) {
      try {
        this.audioKeepAliveCtx.close().catch(() => {});
      } catch {}
      this.audioKeepAliveCtx = null;
    }
  }
}

export const telemetryWorkerManager = new TelemetryWorkerManager();
