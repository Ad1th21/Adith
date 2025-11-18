import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { WS_EVENTS } from '@telemetry/shared';
import { config } from './config';
import { logger } from './logger';
import { redis } from './redis';

export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: Map<string, Set<string>> = new Map(); // socketId -> Set of VINs

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
      },
      pingInterval: config.websocket.pingInterval,
      pingTimeout: config.websocket.pingTimeout,
    });

    this.setupEventHandlers();
    this.subscribeToRedis();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`WebSocket client connected: ${socket.id}`);
      this.connectedClients.set(socket.id, new Set());

      // Handle vehicle subscription
      socket.on(WS_EVENTS.SUBSCRIBE_VEHICLE, (data: { vin: string }) => {
        const { vin } = data;
        logger.debug(`Client ${socket.id} subscribing to vehicle ${vin}`);

        socket.join(`vehicle:${vin}`);
        this.connectedClients.get(socket.id)?.add(vin);

        socket.emit('subscribed', { vin });
      });

      // Handle fleet subscription
      socket.on(WS_EVENTS.SUBSCRIBE_FLEET, (data: { fleetId?: string }) => {
        const room = data.fleetId ? `fleet:${data.fleetId}` : 'fleet:all';
        logger.debug(`Client ${socket.id} subscribing to ${room}`);

        socket.join(room);
        socket.emit('subscribed', { fleet: data.fleetId || 'all' });
      });

      // Handle alerts subscription
      socket.on(WS_EVENTS.SUBSCRIBE_ALERTS, () => {
        logger.debug(`Client ${socket.id} subscribing to alerts`);
        socket.join('alerts');
        socket.emit('subscribed', { alerts: true });
      });

      // Handle unsubscribe
      socket.on(WS_EVENTS.UNSUBSCRIBE_VEHICLE, (data: { vin: string }) => {
        const { vin } = data;
        logger.debug(`Client ${socket.id} unsubscribing from vehicle ${vin}`);

        socket.leave(`vehicle:${vin}`);
        this.connectedClients.get(socket.id)?.delete(vin);

        socket.emit('unsubscribed', { vin });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`WebSocket client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`WebSocket error for client ${socket.id}:`, error);
      });
    });
  }

  private subscribeToRedis(): void {
    const subscriber = redis.getSubscriber();

    // Subscribe to WebSocket events channel
    subscriber.subscribe('websocket:events', (err) => {
      if (err) {
        logger.error('Failed to subscribe to Redis channel:', err);
      } else {
        logger.info('Subscribed to Redis websocket:events channel');
      }
    });

    subscriber.on('message', (channel, message) => {
      try {
        const event = JSON.parse(message);
        this.handleRedisEvent(event);
      } catch (error) {
        logger.error('Failed to parse Redis message:', error);
      }
    });
  }

  private handleRedisEvent(event: { event: string; data: any }): void {
    const { event: eventName, data } = event;

    switch (eventName) {
      case WS_EVENTS.TELEMETRY_UPDATE:
        // Broadcast to vehicle-specific room
        this.io.to(`vehicle:${data.vin}`).emit(WS_EVENTS.TELEMETRY_UPDATE, data);
        // Also broadcast to fleet room
        this.io.to('fleet:all').emit(WS_EVENTS.TELEMETRY_UPDATE, data);
        break;

      case WS_EVENTS.ALERT_NEW:
        // Broadcast to vehicle-specific room
        this.io.to(`vehicle:${data.vin}`).emit(WS_EVENTS.ALERT_NEW, data);
        // Also broadcast to alerts room
        this.io.to('alerts').emit(WS_EVENTS.ALERT_NEW, data);
        break;

      case WS_EVENTS.VEHICLE_ONLINE:
      case WS_EVENTS.VEHICLE_OFFLINE:
      case WS_EVENTS.VEHICLE_STATUS:
        this.io.to(`vehicle:${data.vin}`).emit(eventName, data);
        this.io.to('fleet:all').emit(eventName, data);
        break;

      default:
        logger.warn(`Unknown event type: ${eventName}`);
    }
  }

  getConnectedClientCount(): number {
    return this.connectedClients.size;
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}
