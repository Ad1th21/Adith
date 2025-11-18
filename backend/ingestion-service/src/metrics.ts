import { register, Counter, Histogram, Gauge } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// Register default metrics
register.clear();

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const telemetryIngestedTotal = new Counter({
  name: 'telemetry_ingested_total',
  help: 'Total number of telemetry packets ingested',
  labelNames: ['source'],
});

export const telemetryValidationErrors = new Counter({
  name: 'telemetry_validation_errors_total',
  help: 'Total number of telemetry validation errors',
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
});

// Middleware to track HTTP metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      duration
    );
  });

  next();
}

export { register };
