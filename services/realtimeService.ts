export interface RealtimeEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  senderId: string;
}

type Listener<T = unknown> = (event: RealtimeEvent<T>) => void;

class RealtimeService {
  private channel?: BroadcastChannel;
  private listeners = new Set<Listener>();
  private senderId: string;

  constructor() {
    this.senderId = crypto.randomUUID();

    // Guard for environments without BroadcastChannel (SSR / old browsers)
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
      console.warn('BroadcastChannel not supported in this environment');
      return;
    }

    this.channel = new BroadcastChannel('classtrack_sync_channel');

    this.channel.onmessage = (msg) => {
      const event = msg.data as RealtimeEvent;

      // Basic validation
      if (!event || typeof event.type !== 'string') return;

      // Ignore events emitted by this tab
      if (event.senderId === this.senderId) return;

      this.notify(event);
    };
  }

  /**
   * Emit an event to other tabs and local listeners
   */
  emit<T>(type: string, payload: T) {
    const event: RealtimeEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      senderId: this.senderId
    };

    // Notify local listeners immediately
    this.notify(event);

    // Broadcast to other tabs
    this.channel?.postMessage(event);
  }

  /**
   * Subscribe to realtime events
   */
  subscribe<T>(listener: Listener<T>) {
    this.listeners.add(listener as Listener);

    return () => {
      this.listeners.delete(listener as Listener);
    };
  }

  /**
   * Cleanup (important for HMR)
   */
  destroy() {
    this.listeners.clear();
    this.channel?.close();
  }

  private notify(event: RealtimeEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Realtime listener error:', err);
      }
    });
  }
}

export const realtime = new RealtimeService();

}

export const realtime = new RealtimeService();
