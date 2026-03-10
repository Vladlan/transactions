type PendingRequest = {
  resolve: (data: unknown) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
};

type ConnectionListener = (connected: boolean) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private listeners = new Set<ConnectionListener>();
  private url: string;
  private reconnectDelay = 1000;
  private shouldReconnect = true;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.notifyListeners(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        const id = msg.id as string | undefined;
        if (id && this.pending.has(id)) {
          const req = this.pending.get(id)!;
          this.pending.delete(id);
          clearTimeout(req.timer);
          if (msg.error) {
            req.reject(msg.error);
          } else {
            req.resolve(msg.data);
          }
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.notifyListeners(false);
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  request<T = unknown>(action: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error("Request timeout"));
      }, 10000);

      this.pending.set(id, {
        resolve: resolve as (data: unknown) => void,
        reject,
        timer,
      });

      this.ws.send(JSON.stringify({ id, action, params }));
    });
  }

  onConnectionChange(listener: ConnectionListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(connected: boolean) {
    this.listeners.forEach((fn) => fn(connected));
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  destroy() {
    this.shouldReconnect = false;
    this.ws?.close();
    for (const [, req] of this.pending) {
      clearTimeout(req.timer);
      req.reject(new Error("Client destroyed"));
    }
    this.pending.clear();
  }
}
