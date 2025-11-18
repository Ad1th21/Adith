# Frontend Dashboard

Modern React-based dashboard for real-time vehicle telemetry visualization.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS 3
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (React Query v5)
- **Real-time**: Socket.IO Client
- **Charts**: Recharts
- **Maps**: Leaflet + React Leaflet
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Features

### 1. Dashboard Overview
- **Stats Cards**: Total vehicles, online count, active alerts, average battery
- **Vehicle Grid**: Live vehicle cards with real-time telemetry
- **Alert Panel**: Recent alerts with acknowledge functionality

### 2. Vehicle Detail Page
- Real-time telemetry display (speed, battery, temperature)
- 24-hour statistics (avg/max speed, min battery, data points)
- Time-range selector (1h, 6h, 12h, 24h, 48h)
- Interactive charts (speed, battery, temperature trends)
- GPS route visualization on map
- Live data updates via WebSocket

### 3. Alerts Management
- Filter by acknowledged/unacknowledged status
- Filter by severity (info, warning, critical)
- Acknowledge alerts with one click
- Real-time alert notifications

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # App layout with header/footer
│   │   ├── VehicleList.tsx  # Vehicle grid display
│   │   ├── TelemetryChart.tsx   # Line charts for telemetry
│   │   ├── MapView.tsx      # Leaflet map with routes
│   │   ├── AlertPanel.tsx   # Alert notifications
│   │   └── StatsCards.tsx   # Dashboard statistics
│   ├── pages/              # Route pages
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── VehicleDetail.tsx    # Individual vehicle view
│   │   └── AlertsPage.tsx   # Alert management
│   ├── services/           # API and WebSocket services
│   │   ├── api.ts          # Axios HTTP client
│   │   └── websocket.ts    # Socket.IO client
│   ├── hooks/              # Custom React hooks
│   │   ├── useWebSocket.ts # WebSocket connection hook
│   │   └── useQueries.ts   # React Query hooks
│   ├── stores/             # Zustand state stores
│   │   └── vehicleStore.ts # Global vehicle state
│   ├── utils/              # Utility functions
│   │   └── helpers.ts      # Formatting and styling helpers
│   ├── types.ts            # TypeScript type definitions
│   ├── config.ts           # Environment configuration
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind styles
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## Getting Started

### Prerequisites
- Node.js 20+ and pnpm
- Backend services running (API on port 3001)

### Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   pnpm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` if needed:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_WS_URL=ws://localhost:3001
   ```

3. **Start Development Server**
   ```bash
   pnpm run dev
   ```
   
   Application will be available at http://localhost:5173

### Production Build

```bash
# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

Build artifacts will be in the `dist/` folder.

## Development

### Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production (TypeScript compile + Vite build)
- `pnpm run preview` - Preview production build locally
- `pnpm run lint` - Run ESLint
- `pnpm run typecheck` - Run TypeScript type checking

### Code Structure Guidelines

**Components**: Functional components with TypeScript props
```typescript
interface ComponentProps {
  prop: string;
}

export default function Component({ prop }: ComponentProps) {
  // Component logic
}
```

**State Management**: Zustand for global state
```typescript
const vehicles = useVehicleStore((state) => state.vehicles);
```

**Data Fetching**: React Query for server state
```typescript
const { data, isLoading } = useVehicles();
```

**Real-time Updates**: WebSocket hook for live data
```typescript
const { isConnected, subscribeToVehicle } = useWebSocket();
```

## Key Features Explained

### Real-time Updates

The dashboard uses Socket.IO for real-time data streaming:

1. **Connection Management**: `useWebSocket` hook establishes WebSocket connection on app load
2. **Subscriptions**: Automatically subscribes to fleet-wide and alert updates
3. **Store Updates**: Incoming events update Zustand store, triggering React re-renders
4. **Optimistic UI**: Local state updates immediately, with server sync in background

### Data Caching

React Query provides intelligent caching:

- **Stale Time**: 5 seconds - data is considered fresh for 5s
- **Refetch Interval**: 10 seconds for vehicle list, 5 seconds for telemetry
- **Cache Invalidation**: Manual refetch available via refresh buttons
- **Background Refetch**: Automatically refetches when window regains focus

### Responsive Design

TailwindCSS utility classes ensure responsive layout:

- **Mobile**: Single column, stacked cards
- **Tablet** (md): 2-column grid for vehicles
- **Desktop** (lg): 3-column grid, side-by-side charts

## Customization

### Styling

Update `tailwind.config.js` to change theme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
      },
    },
  },
}
```

### API Configuration

Modify `src/config.ts` for different backend URL:

```typescript
export const config = {
  apiUrl: process.env.VITE_API_URL || 'http://your-api-server:3001',
  wsUrl: process.env.VITE_WS_URL || 'ws://your-ws-server:3001',
};
```

### Chart Metrics

Customize displayed metrics in `TelemetryChart.tsx`:

```typescript
<TelemetryChart 
  data={telemetry} 
  metrics={['speed', 'soc', 'temperature']} // Add/remove metrics
/>
```

## Troubleshooting

### WebSocket Connection Issues

**Symptom**: "Disconnected" indicator in header

**Solutions**:
- Verify API service is running on port 3001
- Check `VITE_WS_URL` in `.env` matches your backend
- Open browser console for WebSocket errors
- Ensure CORS is configured in backend

### Map Not Loading

**Symptom**: Blank map or marker icons missing

**Solutions**:
- Check Leaflet CSS is imported: `import 'leaflet/dist/leaflet.css'`
- Verify marker icon paths in `MapView.tsx`
- Check browser console for 404 errors on marker images

### Build Errors

**Symptom**: TypeScript compilation errors during build

**Solutions**:
- Run `pnpm run typecheck` to identify type errors
- Ensure all dependencies are installed: `pnpm install`
- Clear node_modules and reinstall: `rm -rf node_modules && pnpm install`

### Performance Issues

**Symptom**: Slow rendering with many vehicles

**Optimizations**:
- Reduce refetch intervals in `src/hooks/useQueries.ts`
- Limit vehicle count in grid view
- Implement virtualization for long lists (react-window)
- Reduce chart data points with downsampling

## Production Deployment

### Docker

The `infrastructure/docker/frontend.Dockerfile` includes production build:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY infrastructure/nginx/nginx.conf /etc/nginx/conf.d/default.conf
```

### Environment Variables

Set production URLs:

```env
VITE_API_URL=https://api.yourcompany.com
VITE_WS_URL=wss://api.yourcompany.com
```

**Note**: Vite environment variables are embedded at build time. Rebuild when changing URLs.

### NGINX Configuration

The included `nginx.conf` provides:
- Gzip compression for static assets
- Cache headers for optimal performance
- API proxy to avoid CORS issues
- WebSocket upgrade support
- SPA fallback (all routes serve index.html)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Required Features**:
- ES2020 support
- WebSocket API
- CSS Grid and Flexbox
- SVG rendering (for charts and icons)

## License

MIT - See root LICENSE file

## Contributing

1. Follow existing code style (ESLint rules)
2. Add TypeScript types for all props and functions
3. Test on multiple screen sizes
4. Ensure WebSocket connection cleanup in useEffect hooks
5. Update this README when adding new features
