export interface RealtimeEvent {
  type: string;
  payload: any;
  timestamp: number;
}

type Listener = (event: RealtimeEvent) => void;

class RealtimeService {
  private channel: BroadcastChannel;
  private listeners: Set<Listener>;

  constructor() {
    // BroadcastChannel allows communication between different tabs/windows
    // This simulates a WebSocket connection sharing state across clients
    this.channel = new BroadcastChannel('classtrack_sync_channel');
    this.listeners = new Set();
    
    this.channel.onmessage = (msg) => {
      this.notifyLocal(msg.data);
    };
  }

  // Publish an event to all listeners (local and other tabs)
  emit(type: string, payload: any) {
    const event: RealtimeEvent = {
      type,
      payload,
      timestamp: Date.now()
    };
    this.channel.postMessage(event);
    this.notifyLocal(event);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyLocal(event: RealtimeEvent) {
    this.listeners.forEach(l => l(event));
  }
}

export const realtime = new RealtimeService();