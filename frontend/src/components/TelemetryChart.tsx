import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { Telemetry } from '@/types';

interface TelemetryChartProps {
  data: Telemetry[];
  metrics?: Array<'speed' | 'soc' | 'temperature'>;
}

export default function TelemetryChart({ data, metrics = ['speed', 'soc'] }: TelemetryChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      timestamp: new Date(item.timestamp).getTime(),
      time: format(new Date(item.timestamp), 'HH:mm:ss'),
      speed: item.speed,
      soc: item.soc,
      temperature: item.temperature || 0,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">No telemetry data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Telemetry Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => `Time: ${value}`}
            formatter={(value: number, name: string) => {
              if (name === 'speed') return [`${value.toFixed(1)} km/h`, 'Speed'];
              if (name === 'soc') return [`${value.toFixed(1)}%`, 'Battery'];
              if (name === 'temperature') return [`${value.toFixed(1)}°C`, 'Temperature'];
              return [value, name];
            }}
          />
          <Legend />
          {metrics.includes('speed') && (
            <Line
              type="monotone"
              dataKey="speed"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Speed"
            />
          )}
          {metrics.includes('soc') && (
            <Line
              type="monotone"
              dataKey="soc"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Battery"
            />
          )}
          {metrics.includes('temperature') && (
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name="Temperature"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
