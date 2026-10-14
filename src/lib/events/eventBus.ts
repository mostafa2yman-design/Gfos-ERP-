import { BusinessEvent, EventType } from './eventTypes';

type EventHandler = (event: BusinessEvent<any>) => void;

class EventBus {
  private subscribers: Map<string, EventHandler[]> = new Map();
  private processedEventIds: Set<string> = new Set();

  publish<T>(event: BusinessEvent<T>) {
    if (this.processedEventIds.has(event.id)) {
      console.warn(`[EventBus] Event ${event.id} already processed. Skipping.`);
      return;
    }
    this.processedEventIds.add(event.id);


    
    // Simple in-memory log
    try {
      const logs = JSON.parse(localStorage.getItem('gfos_event_log') || '[]');
      logs.push(event);
      localStorage.setItem('gfos_event_log', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log event', e);
    }

    const handlers = this.subscribers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in handler for ${event.type}:`, err);
      }
    });
  }

  subscribe(type: EventType, handler: EventHandler) {
    const handlers = this.subscribers.get(type) || [];
    handlers.push(handler);
    this.subscribers.set(type, handlers);
    return () => this.unsubscribe(type, handler);
  }

  unsubscribe(type: EventType, handler: EventHandler) {
    const handlers = this.subscribers.get(type) || [];
    this.subscribers.set(type, handlers.filter(h => h !== handler));
  }
}

export const eventBus = new EventBus();
