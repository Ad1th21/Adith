# Quick Start - Standalone Version (No npm/pnpm required)

This version uses Docker to run everything without needing local Node.js/npm/pnpm installation.

## Prerequisites

- **Docker Desktop** for Windows (https://www.docker.com/products/docker-desktop/)
- A web browser (Chrome, Edge, Firefox)

## Setup Steps

### 1. Start All Services

Open PowerShell in the project directory and run:

```powershell
docker-compose -f docker-compose-standalone.yml up -d
```

This will:
- Start PostgreSQL (TimescaleDB) with the vehicle database
- Start Redis for event streaming
- Start MQTT broker for IoT telemetry
- Start Ingestion Service (receives telemetry)
- Start Stream Processor (processes and stores data)
- Start API Service (provides REST API and WebSocket)
- Start Telemetry Simulator (generates fake vehicle data)

### 2. Wait for Services to Initialize

Check service status:
```powershell
docker-compose -f docker-compose-standalone.yml ps
```

All services should show "Up" status. Wait 30-60 seconds for complete initialization.

### 3. Open the Live Dashboard

Simply open the file in your browser:

**Option A: Double-click**
- Navigate to `c:\01_Adith\project\standalone-dashboard.html`
- Double-click to open in your default browser

**Option B: Direct URL**
```
file:///c:/01_Adith/project/standalone-dashboard.html
```

**Option C: Serve with Python (if available)**
```powershell
cd c:\01_Adith\project
python -m http.server 8080
```
Then visit: http://localhost:8080/standalone-dashboard.html

### 4. View Real-Time Data

The dashboard will automatically:
- Connect to the API at `http://localhost:3001`
- Show 10 simulated vehicles with live telemetry
- Update speed, battery, and GPS location every 2 seconds
- Display vehicles on an interactive map
- Show real-time alerts

## What You'll See

### Dashboard Features

1. **Stats Cards** (Top)
   - Total Vehicles
   - Online Count
   - Average Battery Level
   - Active Alerts

2. **Live Fleet Map** (Middle)
   - All vehicles shown as colored markers
   - Click markers for detailed popup info
   - Colors indicate vehicle status:
     - 🟢 Green: Online/Driving
     - 🔵 Blue: Driving
     - 🟡 Yellow: Charging
     - ⚫ Gray: Idle
     - 🔴 Red: Offline

3. **Vehicle Cards** (Bottom)
   - Each vehicle shows:
     - Battery level (%) with color coding
     - Current speed (km/h)
     - GPS coordinates (latitude, longitude)
     - Temperature (°C)
     - Last update timestamp
     - Status badge

### Real-Time Updates

- Data refreshes automatically via WebSocket
- Green "Connected" indicator shows live connection
- Battery changes as vehicles drive (drains) and charge
- Speed fluctuates realistically (0-120 km/h)
- GPS positions follow predefined routes
- Alerts appear as toast notifications

## Controlling the System

### View Logs

**All services:**
```powershell
docker-compose -f docker-compose-standalone.yml logs -f
```

**Specific service:**
```powershell
docker-compose -f docker-compose-standalone.yml logs -f api-service
docker-compose -f docker-compose-standalone.yml logs -f simulator
```

### Stop Services

```powershell
docker-compose -f docker-compose-standalone.yml stop
```

### Start Again

```powershell
docker-compose -f docker-compose-standalone.yml start
```

### Complete Shutdown (removes containers)

```powershell
docker-compose -f docker-compose-standalone.yml down
```

### Shutdown + Delete All Data

```powershell
docker-compose -f docker-compose-standalone.yml down -v
```

## Troubleshooting

### Dashboard Shows "No Vehicles Connected"

**Possible Causes:**
1. Services still starting up (wait 60 seconds)
2. Docker containers not running
3. Port conflicts (3001 already in use)

**Solutions:**
```powershell
# Check if services are running
docker-compose -f docker-compose-standalone.yml ps

# Check API service logs
docker-compose -f docker-compose-standalone.yml logs api-service

# Restart all services
docker-compose -f docker-compose-standalone.yml restart
```

### "Connection Failed" in Dashboard

**Possible Causes:**
1. API service not started
2. CORS issues (if dashboard opened via file://)
3. Firewall blocking localhost:3001

**Solutions:**
1. Verify API is running: `curl http://localhost:3001/api/v1/vehicles`
2. Use a local web server instead of file:// protocol
3. Check Windows Firewall settings

### Simulator Not Generating Data

**Check simulator logs:**
```powershell
docker-compose -f docker-compose-standalone.yml logs simulator
```

**Restart simulator:**
```powershell
docker-compose -f docker-compose-standalone.yml restart simulator
```

### Port Already in Use

**Error:** "port is already allocated"

**Solution - Change ports in docker-compose-standalone.yml:**
```yaml
api-service:
  ports:
    - "3002:3001"  # Change 3001 to 3002
```

Then update dashboard config:
```javascript
const API_URL = 'http://localhost:3002/api/v1';
const WS_URL = 'http://localhost:3002';
```

## Testing the API Manually

### Get All Vehicles
```powershell
curl http://localhost:3001/api/v1/vehicles
```

### Get Latest Telemetry for a Vehicle
```powershell
curl http://localhost:3001/api/v1/telemetry/1HGBH41JXMN109186/latest
```

### Get Historical Data
```powershell
curl "http://localhost:3001/api/v1/telemetry/1HGBH41JXMN109186?limit=100"
```

### Get All Alerts
```powershell
curl http://localhost:3001/api/v1/alerts
```

## Customizing the Simulator

Change the number of vehicles or update frequency:

Edit `docker-compose-standalone.yml`:
```yaml
simulator:
  command: sh -c "npm install && node simulate-telemetry-rest.js --vehicles 20 --interval 1000"
```

- `--vehicles 20`: Simulate 20 vehicles (default: 10)
- `--interval 1000`: Update every 1 second (default: 2000ms)

Then restart:
```powershell
docker-compose -f docker-compose-standalone.yml restart simulator
```

## Database Access

Connect to PostgreSQL to query raw data:

```powershell
docker exec -it telemetry-postgres psql -U telemetry_user -d telemetry
```

### Useful Queries

**Count total telemetry records:**
```sql
SELECT COUNT(*) FROM telemetry;
```

**Get latest data for all vehicles:**
```sql
SELECT * FROM vehicle_latest_telemetry;
```

**View hourly aggregates:**
```sql
SELECT * FROM telemetry_hourly ORDER BY bucket DESC LIMIT 10;
```

**See all alerts:**
```sql
SELECT * FROM alerts ORDER BY timestamp DESC;
```

## System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB
- **Disk**: 2GB free space
- **CPU**: 2 cores minimum
- **Docker**: Version 20.10 or higher

## Performance Tips

1. **Reduce vehicle count** if system is slow:
   - Edit simulator command to use `--vehicles 5`

2. **Increase update interval**:
   - Change `--interval 2000` to `--interval 5000` (5 seconds)

3. **Limit browser tabs**:
   - Keep only one dashboard tab open

4. **Monitor Docker resource usage**:
   - Open Docker Desktop → Settings → Resources
   - Increase CPU/Memory if needed

## Next Steps

### Add More Vehicles
Modify the simulator command in docker-compose-standalone.yml

### View Monitoring Dashboards
Access Grafana (if enabled): http://localhost:3000
- Username: admin
- Password: admin

### Explore the API
Full API documentation: http://localhost:3001/api/v1/docs (if Swagger enabled)

### Query Historical Data
Use the PostgreSQL database to analyze trends over time

## Support

If you encounter issues:
1. Check Docker Desktop is running
2. Verify ports 3000, 3001, 5432, 6379, 1883 are available
3. Review logs: `docker-compose -f docker-compose-standalone.yml logs`
4. Restart services: `docker-compose -f docker-compose-standalone.yml restart`

Enjoy your real-time vehicle telemetry dashboard! 🚗📊
