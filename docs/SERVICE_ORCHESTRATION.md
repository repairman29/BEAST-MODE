# Service Orchestration Guide
## Starting All ML Services Together

**Last Updated**: 2025-12-31

---

## 🚀 Quick Start

### Start All Services
```bash
# From BEAST-MODE-PRODUCT root
npm run services:start

# Or from website directory
cd website && npm run services:start
```

### Start Service Manager (REST API)
```bash
npm run services:manager
```

### Start Everything (Services + BEAST MODE)
```bash
npm run work
```

---

## 📋 Services Managed

| Service | Port | Health Check | Description |
|---------|------|--------------|-------------|
| **Code Roach** | 3007 | `/health` | Code quality predictions (90%+ accuracy) |
| **Oracle** | 3006 | `/health` | Knowledge search & relevance (85% accuracy) |
| **Daisy Chain** | 3008 | `/health` | Workflow quality predictions |
| **AI GM** | 4001 | `/health` | Narrative quality predictions |
| **BEAST MODE** | 3000 | `/api/health` | Main platform (started separately) |

---

## 🎯 Features

### Automatic Service Discovery
- Checks if services are already running
- Verifies health before starting
- Skips services if directories don't exist
- Handles port conflicts gracefully

### Health Monitoring
- Health checks every 30 seconds (via service discovery)
- Automatic restart on failure (future feature)
- Response time tracking
- Availability metrics

### Unified Logging
- All service logs in `BEAST-MODE-PRODUCT/logs/`
- Individual log files per service
- Timestamped entries
- Easy debugging

### Graceful Shutdown
- Ctrl+C stops all services
- SIGTERM handling
- Clean process termination
- Log file cleanup

---

## 📊 Service Manager API

The Service Manager provides a REST API for controlling services:

### Endpoints

**GET `/health`**
- Service manager health check

**GET `/api/services`**
- Get status of all services
- Returns availability, response times, last checked

**GET `/api/statistics`**
- Get service statistics
- Availability rates
- Average response times
- Service counts

**POST `/api/services/start-all`**
- Start all services
- Returns results for each service

**POST `/api/services/stop-all`**
- Stop all services
- Graceful shutdown

**POST `/api/services/:serviceId/start`**
- Start specific service
- Service IDs: `code-roach`, `oracle`, `daisy-chain`, `ai-gm`

**POST `/api/services/:serviceId/stop`**
- Stop specific service

---

## 🔧 Configuration

### Environment Variables

```bash
# Service URLs (defaults to localhost)
export CODE_ROACH_URL=http://localhost:3007
export ORACLE_URL=http://localhost:3006
export DAISY_CHAIN_URL=http://localhost:3008
export AI_GM_URL=http://localhost:4001

# Service Manager Port
export SERVICE_MANAGER_PORT=3010

# AI GM Port (must be set)
export PORT=4001  # For AI GM service
```

### Service Paths

Services are expected at:
- `../smuggler-code-roach/`
- `../smuggler-oracle/`
- `../smuggler-daisy-chain/`
- `../smuggler-ai-gm/`

(Relative to `BEAST-MODE-PRODUCT/scripts/`)

---

## 📝 Usage Examples

### Start All Services
```bash
npm run services:start
```

Output:
```
🚀 Starting all ML services...

[Code Roach] Starting on port 3007...
[Code Roach] ✅ Healthy!

[Oracle] Starting on port 3006...
[Oracle] ✅ Healthy!

📊 Service Status:
[Code Roach] ✅ Running
[Oracle] ✅ Running

✅ 2 services running, 0 skipped, 0 failed
📝 Logs: /path/to/BEAST-MODE-PRODUCT/logs
```

### Check Service Status
```bash
curl http://localhost:3010/api/services
```

### Start Specific Service
```bash
curl -X POST http://localhost:3010/api/services/code-roach/start
```

### Stop All Services
```bash
curl -X POST http://localhost:3010/api/services/stop-all
```

---

## 🐛 Troubleshooting

### Port Already in Use
If a port is already in use, the orchestrator will:
1. Check if the service is healthy
2. If healthy, use the existing service
3. If unhealthy, report an error

**Solution**: Kill the process using the port:
```bash
lsof -ti:3007 | xargs kill -9  # For Code Roach
```

### Service Directory Not Found
If a service directory doesn't exist, it will be skipped.

**Solution**: Ensure services are cloned/available at expected paths.

### Service Fails to Start
Check the log file:
```bash
cat BEAST-MODE-PRODUCT/logs/code-roach.log
```

### Health Check Fails
Services may start but fail health checks if:
- Service takes longer than 30 seconds to start
- Health endpoint is different
- Service has errors

**Solution**: Check service logs and verify health endpoint.

---

## 🔄 Integration with BEAST MODE

When services are running, BEAST MODE automatically:
1. **Discovers** available services (via service discovery)
2. **Routes** predictions to specialized services
3. **Falls back** to BEAST MODE ML if services unavailable
4. **Tracks** metrics for all predictions

No configuration needed - it just works! 🎉

---

## 📈 Monitoring

### Service Discovery
Service discovery automatically:
- Checks health every 30 seconds
- Updates availability status
- Tracks response times
- Provides statistics

### Metrics
Unified metrics track:
- Prediction counts by service
- Accuracy comparisons
- Response times
- Success/failure rates

Access via BEAST MODE dashboard or API.

---

## 🚀 Next Steps

1. **Start services**: `npm run services:start`
2. **Start BEAST MODE**: `npm run dev`
3. **Monitor**: Check service manager API
4. **Use**: BEAST MODE automatically routes to services

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-12-31

