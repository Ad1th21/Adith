# Vehicle Telemetry Visualization System

A production-grade, cloud-native vehicle telemetry platform for fleet operators. Real-time ingestion, processing, storage, and visualization of vehicle data (speed, battery, GPS, and extensible parameters).

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Vehicles   │────────▶│  Ingestion   │────────▶│    Redis    │
│ MQTT/REST   │         │   Service    │         │   Streams   │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │◀────────│ API Service  │◀────────│   Stream    │
│  Dashboard  │         │  + WebSocket │         │  Processor  │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │ TimescaleDB │
                                                  │ (Postgres)  │
                                                  └─────────────┘
```

### Technology Stack

**Backend:**
- **Runtime:** Node.js 20+ with TypeScript
- **Ingestion:** Express.js (REST) + EMQX/Mosquitto (MQTT)
- **Streaming:** Redis Streams for event processing
- **Database:** TimescaleDB (PostgreSQL extension) for time-series data
- **WebSocket:** Socket.IO for real-time client updates
- **Validation:** Zod schemas for type-safe data validation

**Frontend:**
- **Framework:** React 18 with TypeScript + Vite
- **State Management:** Zustand for lightweight state
- **Charts:** Recharts for time-series visualization
- **Maps:** Leaflet with OpenStreetMap for GPS tracking
- **UI Components:** Tailwind CSS + Headless UI
- **Real-time:** Socket.IO client

**Infrastructure:**
- **Containerization:** Docker + Docker Compose
- **Monitoring:** Prometheus + Grafana
- **Logging:** Winston (structured JSON logs)
- **Cloud-Ready:** Azure/AWS/GCP deployment configurations

## 📁 Project Structure

```
vehicle-telemetry-system/
├── backend/
│   ├── ingestion-service/       # MQTT & REST telemetry ingestion
│   ├── stream-processor/        # Redis consumer, alert detection, persistence
│   ├── api-service/             # REST API + WebSocket server
│   └── shared/                  # Common utilities, DB clients
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks (WebSocket, data fetching)
│   │   ├── stores/              # Zustand state stores
│   │   ├── services/            # API client, WebSocket manager
│   │   └── types/               # TypeScript types
│   └── public/
├── shared/
│   ├── types/                   # Shared TypeScript interfaces
│   └── schemas/                 # Zod validation schemas
├── infrastructure/
│   ├── docker/                  # Dockerfiles
│   ├── postgres/                # Database migrations & seeds
│   ├── redis/                   # Redis configuration
│   ├── monitoring/              # Prometheus & Grafana configs
│   └── mqtt/                    # MQTT broker configuration
├── scripts/
│   ├── simulate-telemetry-rest.ts    # REST simulator
│   ├── simulate-telemetry-mqtt.ts    # MQTT simulator
│   └── seed-vehicles.ts              # Vehicle data seeder
├── docker-compose.yml
├── docker-compose.prod.yml
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

### Installation

```bash
# Clone repository
cd c:\01_Adith\project

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, MQTT)
docker-compose up -d postgres redis mqtt

# Run database migrations
cd backend/api-service
pnpm run migrate

# Start all services (development mode)
pnpm run dev
```

### Start Individual Services

```bash
# Terminal 1: Ingestion Service
cd backend/ingestion-service
pnpm run dev

# Terminal 2: Stream Processor
cd backend/stream-processor
pnpm run dev

# Terminal 3: API Service
cd backend/api-service
pnpm run dev

# Terminal 4: Frontend
cd frontend
pnpm run dev
```

### Simulate Telemetry

```bash
# REST simulator (10 vehicles, 1 second interval)
pnpm run simulate:rest --vehicles 10 --interval 1000

# MQTT simulator (50 vehicles, realistic patterns)
pnpm run simulate:mqtt --vehicles 50 --interval 2000
```

## 📊 Data Models

### Telemetry Packet Schema

```typescript
{
  vin: string;              // Vehicle Identification Number
  timestamp: string;        // ISO 8601 timestamp
  speed: number;            // km/h
  soc: number;              // State of Charge (0-100%)
  location: {
    latitude: number;
    longitude: number;
  };
  odometer?: number;        // Total distance in km
  temperature?: number;     // Battery temperature in °C
  voltage?: number;         // Battery voltage
  current?: number;         // Battery current (A)
  [key: string]: any;       // Extensible parameters
}
```

### Database Schema

**vehicles** table:
- `vin` (PK): Vehicle identification
- `fleet_id`: Fleet operator ID (multi-tenancy)
- `model`, `manufacturer`: Vehicle details
- `created_at`, `updated_at`: Timestamps

**telemetry** hypertable (partitioned by time):
- `id` (PK): Auto-increment
- `vin` (FK): Reference to vehicles
- `timestamp`: Event time (partitioning key)
- `speed`, `soc`, `latitude`, `longitude`: Core metrics
- `raw_data`: JSONB for extensible parameters
- Indexes: `(vin, timestamp DESC)`, `(timestamp)`

**alerts** table:
- Alert history for low battery, overspeed, offline vehicles

## 🔌 API Endpoints

### REST API (`http://localhost:3001`)

```
POST   /api/v1/telemetry              # Ingest telemetry (internal/testing)
GET    /api/v1/vehicles                # List all vehicles
GET    /api/v1/vehicles/:vin           # Get vehicle details
GET    /api/v1/vehicles/:vin/telemetry # Historical telemetry
GET    /api/v1/vehicles/:vin/latest    # Latest telemetry point
GET    /api/v1/alerts                  # Active alerts
GET    /api/v1/health                  # Service health check
```

### WebSocket Events (`ws://localhost:3001`)

**Client → Server:**
- `subscribe:vehicle` - Subscribe to specific VIN updates
- `subscribe:fleet` - Subscribe to all fleet updates
- `unsubscribe:vehicle` - Unsubscribe from VIN

**Server → Client:**
- `telemetry:update` - Real-time telemetry data
- `alert:new` - New alert triggered
- `vehicle:offline` - Vehicle connection lost

## 🐳 Docker Deployment

### Development

```bash
docker-compose up
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Create `.env` files for each service:

```bash
# Backend services
DATABASE_URL=postgresql://user:password@postgres:5432/telemetry
REDIS_URL=redis://redis:6379
MQTT_BROKER_URL=mqtt://mqtt:1883

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## 📈 Monitoring

Access monitoring dashboards:
- **Grafana:** http://localhost:3000 (admin/admin)
- **Prometheus:** http://localhost:9090

### Key Metrics

- Telemetry ingestion rate (messages/sec)
- Stream processing latency
- WebSocket active connections
- Database query performance
- Alert trigger frequency

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# Load testing
pnpm run load-test --vehicles 1000 --duration 300
```

## 🔒 Security Considerations

- JWT-based authentication (future enhancement)
- Fleet-level access control (multi-tenancy ready)
- Rate limiting on ingestion endpoints
- Input validation with Zod schemas
- Prepared statements for SQL injection prevention
- WebSocket connection authentication

## 📦 Scalability Features

1. **Horizontal Scaling:**
   - Stateless services (multiple instances behind load balancer)
   - Redis Streams consumer groups for parallel processing
   - TimescaleDB read replicas

2. **Data Partitioning:**
   - Time-based partitioning (daily/weekly chunks)
   - VIN-based sharding for Redis Streams

3. **Caching:**
   - Redis for latest telemetry (sub-second reads)
   - Aggregated metrics caching (5-minute TTL)

4. **Compression & Retention:**
   - TimescaleDB automatic compression (>7 days)
   - Data retention policies (hot: 30d, warm: 90d, cold: archive)

## 🚢 Cloud Deployment

### AWS

- ECS/Fargate for container orchestration
- RDS PostgreSQL with TimescaleDB extension
- ElastiCache Redis
- Application Load Balancer
- CloudWatch for monitoring

### Azure

- Azure Container Apps
- Azure Database for PostgreSQL (Flexible Server)
- Azure Cache for Redis
- Azure Monitor + Application Insights

### GCP

- Cloud Run for containers
- Cloud SQL for PostgreSQL
- Memorystore for Redis
- Cloud Monitoring

## 📝 Development Roadmap

### Phase 1 (Current) - Core Platform
- ✅ Real-time telemetry ingestion
- ✅ Time-series storage
- ✅ Live dashboard visualization
- ✅ Basic alerting

### Phase 2 - Advanced Features
- [ ] Custom alert rule engine
- [ ] Geofencing capabilities
- [ ] Predictive maintenance ML models
- [ ] Mobile app (React Native)

### Phase 3 - Enterprise
- [ ] Multi-tenant with RBAC
- [ ] Advanced analytics & reporting
- [ ] Integration APIs (Salesforce, SAP)
- [ ] OTA firmware update management

## 🤝 Contributing

This is a prototype system. For production deployment:
1. Implement authentication & authorization
2. Add comprehensive test coverage (>80%)
3. Configure TLS/SSL for all communications
4. Set up CI/CD pipelines
5. Implement backup & disaster recovery
6. Add APM (Application Performance Monitoring)

## 📄 License

MIT License - See LICENSE file for details

## 👤 Author

Built for automotive engineering prototype by Adith

## 📞 Support

For issues or questions about implementation, consult:
- Architecture decisions in `docs/architecture.md`
- API documentation in `docs/api.md`
- Deployment guide in `docs/deployment.md`
