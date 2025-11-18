# 🚀 Quick Start Guide - Vehicle Telemetry System

## Prerequisites
- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (Install: `npm install -g pnpm`)
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** (for version control)

## Step-by-Step Setup

### 1. Install Dependencies

```powershell
# Navigate to project directory
cd c:\01_Adith\project

# Install all workspace dependencies
pnpm install
```

This will install dependencies for all services:
- ✅ Shared types and schemas
- ✅ Ingestion service
- ✅ Stream processor
- ✅ API service
- ✅ Simulator scripts

### 2. Start Infrastructure Services

```powershell
# Start PostgreSQL, Redis, and MQTT broker
docker-compose up -d postgres redis mqtt
```

Verify services are running:
```powershell
docker-compose ps
```

You should see:
- ✅ `telemetry-postgres` (port 5432)
- ✅ `telemetry-redis` (port 6379)
- ✅ `telemetry-mqtt` (port 1883)

### 3. Verify Database Initialization

The database schema is automatically created on first startup via the init script.

To verify:
```powershell
docker exec -it telemetry-postgres psql -U telemetry_user -d telemetry -c "\dt"
```

You should see tables:
- `vehicles`
- `telemetry`
- `alerts`

### 4. Start Backend Services

Open **3 separate PowerShell terminals**:

**Terminal 1 - Ingestion Service:**
```powershell
cd c:\01_Adith\project\backend\ingestion-service
cp .env.example .env
pnpm run dev
```

**Terminal 2 - Stream Processor:**
```powershell
cd c:\01_Adith\project\backend\stream-processor
cp .env.example .env
pnpm run dev
```

**Terminal 3 - API Service:**
```powershell
cd c:\01_Adith\project\backend\api-service
cp .env.example .env
pnpm run dev
```

### 5. Test the System

**Check health endpoints:**
```powershell
# Ingestion Service
curl http://localhost:3000/health

# API Service
curl http://localhost:3001/health
```

**View seed vehicles:**
```powershell
curl http://localhost:3001/api/v1/vehicles
```

### 6. Run Telemetry Simulators

**Terminal 4 - REST Simulator:**
```powershell
cd c:\01_Adith\project
pnpm run simulate:rest --vehicles 10 --interval 2000
```

**Or MQTT Simulator:**
```powershell
pnpm run simulate:mqtt --vehicles 10 --interval 3000
```

### 7. Verify Data Flow

**Check latest telemetry for a vehicle:**
```powershell
curl http://localhost:3001/api/v1/telemetry/1HGBH41JXMN109186/latest
```

**View historical telemetry:**
```powershell
curl "http://localhost:3001/api/v1/telemetry/1HGBH41JXMN109186?limit=10"
```

**Check alerts:**
```powershell
curl http://localhost:3001/api/v1/alerts
```

## 🎯 Quick Test Scenarios

### Scenario 1: Low Battery Alert
The simulator will automatically trigger low battery alerts when SOC drops below 20%.

Monitor alerts:
```powershell
curl "http://localhost:3001/api/v1/alerts?acknowledged=false"
```

### Scenario 2: Real-time WebSocket Connection

Create a test HTML file or use a WebSocket client:
```javascript
const socket = io('http://localhost:3001');

// Subscribe to all fleet updates
socket.emit('subscribe:fleet', {});

// Listen for telemetry updates
socket.on('telemetry:update', (data) => {
  console.log('New telemetry:', data);
});

// Listen for alerts
socket.on('alert:new', (alert) => {
  console.log('New alert:', alert);
});
```

### Scenario 3: Database Query Performance

```powershell
# Connect to database
docker exec -it telemetry-postgres psql -U telemetry_user -d telemetry

# Check telemetry count
SELECT COUNT(*) FROM telemetry;

# Check average speed per vehicle
SELECT vin, AVG(speed) as avg_speed, COUNT(*) as records
FROM telemetry
GROUP BY vin
ORDER BY avg_speed DESC;

# View continuous aggregate (hourly metrics)
SELECT * FROM telemetry_hourly
ORDER BY bucket DESC
LIMIT 20;
```

## 🐳 Alternative: Docker Compose Full Stack

To run everything in Docker:

```powershell
docker-compose up --build
```

This starts:
- PostgreSQL + TimescaleDB
- Redis
- MQTT Broker (Mosquitto)
- Ingestion Service (port 3000)
- Stream Processor
- API Service (port 3001)
- Prometheus (port 9090)
- Grafana (port 3000)

**Note:** Frontend is not yet built. Only backend services and infrastructure.

## 📊 Monitoring

### Prometheus Metrics
Visit: http://localhost:9090

Query examples:
- `http_requests_total` - Total HTTP requests
- `telemetry_ingested_total` - Telemetry messages ingested
- `telemetry_validation_errors_total` - Validation failures

### Grafana Dashboards
Visit: http://localhost:3000
- Username: `admin`
- Password: `admin`

## 🛠️ Troubleshooting

### Issue: "Cannot connect to Redis"
**Solution:**
```powershell
# Check Redis is running
docker ps | findstr redis

# Restart Redis
docker-compose restart redis

# Check logs
docker-compose logs redis
```

### Issue: "Database connection failed"
**Solution:**
```powershell
# Check Postgres is running
docker ps | findstr postgres

# Restart Postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue: "MQTT connection error"
**Solution:**
```powershell
# Check MQTT broker
docker ps | findstr mqtt

# Restart MQTT
docker-compose restart mqtt

# Test MQTT connectivity
docker exec -it telemetry-mqtt mosquitto_sub -t test -v
```

### Issue: TypeScript compilation errors
**Solution:**
```powershell
# Clean and rebuild
cd c:\01_Adith\project
pnpm clean
pnpm install
pnpm build
```

### Issue: Port already in use
**Solution:**
```powershell
# Check what's using the port (e.g., 3000)
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or change port in .env file
```

## 📈 Performance Testing

### Load Test with Multiple Vehicles
```powershell
# Simulate 100 vehicles with 1-second intervals
pnpm run simulate:rest --vehicles 100 --interval 1000
```

### Monitor System Performance
```powershell
# Watch Docker stats
docker stats

# Check database connections
docker exec -it telemetry-postgres psql -U telemetry_user -d telemetry -c "SELECT count(*) FROM pg_stat_activity;"

# Redis memory usage
docker exec -it telemetry-redis redis-cli INFO memory
```

## 🎨 Next Steps

### Build Frontend Dashboard
The frontend React application is not yet created. To implement:
1. Initialize Vite React app in `frontend/`
2. Install dependencies (React, TailwindCSS, Recharts, Leaflet, Socket.IO)
3. Create components for vehicle list, charts, maps, and alerts
4. Connect to WebSocket and REST APIs

### Deploy to Cloud
1. Push Docker images to container registry (Docker Hub, ACR, ECR)
2. Deploy to Kubernetes (AKS, EKS, GKE)
3. Or use managed container services (Azure Container Apps, AWS Fargate)
4. Configure environment variables and secrets
5. Set up load balancer and auto-scaling

### Add Authentication
1. Implement JWT-based authentication in API service
2. Add user management (register, login, logout)
3. Secure WebSocket connections
4. Add role-based access control (fleet operators, admins)

## 📝 Useful Commands

```powershell
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ingestion-service

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v

# Rebuild specific service
docker-compose up --build ingestion-service

# Execute commands in containers
docker exec -it telemetry-postgres bash
docker exec -it telemetry-redis redis-cli

# Check Redis stream length
docker exec -it telemetry-redis redis-cli XLEN telemetry:stream

# Monitor Redis streams
docker exec -it telemetry-redis redis-cli XINFO STREAM telemetry:stream
```

## ✅ Verification Checklist

- [ ] Dependencies installed (`pnpm install` successful)
- [ ] Docker services running (postgres, redis, mqtt)
- [ ] Database initialized (tables created)
- [ ] Ingestion service started (port 3000)
- [ ] Stream processor started
- [ ] API service started (port 3001)
- [ ] Health checks passing
- [ ] Simulator running and sending data
- [ ] Telemetry visible in database
- [ ] Alerts being generated
- [ ] WebSocket events working

## 🆘 Support

For issues:
1. Check service logs: `docker-compose logs [service-name]`
2. Verify environment variables in `.env` files
3. Ensure all ports are available (3000, 3001, 5432, 6379, 1883)
4. Review `IMPLEMENTATION_STATUS.md` for current progress

## 📚 Additional Resources

- **Architecture**: See `README.md` for system architecture
- **Database Schema**: `infrastructure/postgres/init/01-schema.sql`
- **API Documentation**: Check route files in `backend/api-service/src/routes/`
- **Type Definitions**: `shared/src/types.ts`
- **Constants**: `shared/src/constants.ts`

---

**Ready to build!** 🚀
