import { io, Socket } from 'socket.io-client';
import { config } from '@/config';
import type { Telemetry, Alert } from '@/types';

type EventCallback<T = any> = (data: T) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(config.wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToVehicle(vin: string): void {
    this.socket?.emit('subscribe:vehicle', { vin });
  }

  subscribeToFleet(): void {
    this.socket?.emit('subscribe:fleet', {});
  }

  subscribeToAlerts(): void {
    this.socket?.emit('subscribe:alerts');
  }

  unsubscribeFromVehicle(vin: string): void {
    this.socket?.emit('unsubscribe:vehicle', { vin });
  }

  onTelemetryUpdate(callback: EventCallback<Telemetry>): void {
    this.socket?.on('telemetry:update', callback);
  }

  onAlertNew(callback: EventCallback<Alert>): void {
    this.socket?.on('alert:new', callback);
  }

  onVehicleStatus(callback: EventCallback<any>): void {
    this.socket?.on('vehicle:status', callback);
  }

  offTelemetryUpdate(callback: EventCallback<Telemetry>): void {
    this.socket?.off('telemetry:update', callback);
  }

  offAlertNew(callback: EventCallback<Alert>): void {
    this.socket?.off('alert:new', callback);
  }

  offVehicleStatus(callback: EventCallback<any>): void {
    this.socket?.off('vehicle:status', callback);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = new WebSocketService();
