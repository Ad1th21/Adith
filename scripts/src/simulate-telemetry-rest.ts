#!/usr/bin/env node
import axios from 'axios';
import { program } from 'commander';
import chalk from 'chalk';
import { TelemetryPacket } from '@telemetry/shared';

// Sample VINs for testing
const SAMPLE_VINS = [
  '1HGBH41JXMN109186',
  '2HGBH41JXMN109187',
  '3HGBH41JXMN109188',
  '4HGBH41JXMN109189',
  '5HGBH41JXMN109190',
  '6HGBH41JXMN109191',
  '7HGBH41JXMN109192',
  '8HGBH41JXMN109193',
  '9HGBH41JXMN109194',
  'AHGBH41JXMN109195',
];

// GPS route for realistic simulation (San Francisco to San Jose)
const GPS_ROUTE = [
  { lat: 37.7749, lon: -122.4194 },
  { lat: 37.7549, lon: -122.3994 },
  { lat: 37.7349, lon: -122.3794 },
  { lat: 37.7149, lon: -122.3594 },
  { lat: 37.6949, lon: -122.3394 },
  { lat: 37.6749, lon: -122.3194 },
  { lat: 37.6549, lon: -122.2994 },
  { lat: 37.6349, lon: -122.2794 },
  { lat: 37.6149, lon: -122.2594 },
  { lat: 37.5949, lon: -122.2394 },
  { lat: 37.5749, lon: -122.2194 },
  { lat: 37.5549, lon: -122.1994 },
  { lat: 37.5349, lon: -122.1794 },
  { lat: 37.3382, lon: -121.8863 }, // San Jose
];

interface VehicleState {
  vin: string;
  routeIndex: number;
  speed: number;
  soc: number;
  odometer: number;
  temperature: number;
  voltage: number;
  isCharging: boolean;
}

class TelemetrySimulator {
  private apiUrl: string;
  private vehicles: Map<string, VehicleState> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private messageCount: number = 0;
  private errorCount: number = 0;

  constructor(apiUrl: string, vehicleCount: number) {
    this.apiUrl = apiUrl;
    this.initializeVehicles(vehicleCount);
  }

  private initializeVehicles(count: number): void {
    const vins = count <= SAMPLE_VINS.length 
      ? SAMPLE_VINS.slice(0, count)
      : [...SAMPLE_VINS, ...Array(count - SAMPLE_VINS.length).fill(0).map((_, i) => 
          `X${String(i).padStart(16, '0')}`
        )];

    vins.forEach((vin) => {
      this.vehicles.set(vin, {
        vin,
        routeIndex: Math.floor(Math.random() * GPS_ROUTE.length),
        speed: Math.random() * 60 + 20, // 20-80 km/h
        soc: Math.random() * 40 + 60, // 60-100%
        odometer: Math.random() * 50000 + 10000, // 10k-60k km
        temperature: Math.random() * 20 + 20, // 20-40°C
        voltage: 400 + Math.random() * 20, // 400-420V
        isCharging: false,
      });
    });

    console.log(chalk.green(`✓ Initialized ${count} vehicles`));
  }

  private generateTelemetry(state: VehicleState): TelemetryPacket {
    // Update vehicle state with realistic behavior
    if (state.isCharging) {
      // Charging behavior
      state.soc = Math.min(100, state.soc + 0.5);
      state.speed = 0;
      state.temperature = Math.min(45, state.temperature + 0.2);
      
      if (state.soc >= 95) {
        state.isCharging = false;
      }
    } else {
      // Driving behavior
      state.speed += (Math.random() - 0.5) * 10;
      state.speed = Math.max(0, Math.min(130, state.speed));

      // Battery drain based on speed
      const drainRate = 0.01 + (state.speed / 1000);
      state.soc = Math.max(0, state.soc - drainRate);

      // Start charging if battery is low
      if (state.soc < 20 && Math.random() < 0.3) {
        state.isCharging = true;
      }

      // Temperature varies with speed
      state.temperature = 25 + (state.speed / 10) + (Math.random() - 0.5) * 5;
      state.temperature = Math.max(15, Math.min(60, state.temperature));

      // Move along route
      if (state.speed > 5) {
        state.routeIndex = (state.routeIndex + 1) % GPS_ROUTE.length;
        state.odometer += state.speed / 3600; // km per second
      }
    }

    // Voltage varies slightly
    state.voltage += (Math.random() - 0.5) * 2;
    state.voltage = Math.max(380, Math.min(420, state.voltage));

    const location = GPS_ROUTE[state.routeIndex];
    const current = state.isCharging ? -50 - Math.random() * 50 : Math.random() * 100;

    return {
      vin: state.vin,
      timestamp: new Date().toISOString(),
      speed: Math.round(state.speed * 10) / 10,
      soc: Math.round(state.soc * 10) / 10,
      location: {
        latitude: location.lat + (Math.random() - 0.5) * 0.001,
        longitude: location.lon + (Math.random() - 0.5) * 0.001,
      },
      odometer: Math.round(state.odometer * 10) / 10,
      temperature: Math.round(state.temperature * 10) / 10,
      voltage: Math.round(state.voltage * 10) / 10,
      current: Math.round(current * 10) / 10,
      heading: Math.random() * 360,
    };
  }

  private async sendTelemetry(telemetry: TelemetryPacket): Promise<void> {
    try {
      await axios.post(`${this.apiUrl}/api/v1/telemetry`, telemetry, {
        timeout: 5000,
      });
      this.messageCount++;
    } catch (error: any) {
      this.errorCount++;
      if (this.errorCount <= 5) {
        console.error(chalk.red(`✗ Error sending telemetry: ${error.message}`));
      }
    }
  }

  async start(intervalMs: number): Promise<void> {
    console.log(chalk.blue(`\n🚀 Starting REST simulator...`));
    console.log(chalk.gray(`   API URL: ${this.apiUrl}`));
    console.log(chalk.gray(`   Vehicles: ${this.vehicles.size}`));
    console.log(chalk.gray(`   Interval: ${intervalMs}ms\n`));

    this.intervalId = setInterval(async () => {
      const promises: Promise<void>[] = [];

      for (const [vin, state] of this.vehicles) {
        const telemetry = this.generateTelemetry(state);
        promises.push(this.sendTelemetry(telemetry));
      }

      await Promise.allSettled(promises);

      if (this.messageCount % (this.vehicles.size * 10) === 0) {
        console.log(
          chalk.green(`📊 Sent: ${this.messageCount} | `) +
          chalk.red(`Errors: ${this.errorCount} | `) +
          chalk.yellow(`Rate: ${(this.messageCount / this.vehicles.size).toFixed(1)} msgs/vehicle`)
        );
      }
    }, intervalMs);

    console.log(chalk.green('✓ Simulator running. Press Ctrl+C to stop.\n'));
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log(chalk.yellow(`\n📊 Final Stats:`));
    console.log(chalk.gray(`   Total messages: ${this.messageCount}`));
    console.log(chalk.gray(`   Total errors: ${this.errorCount}`));
    console.log(chalk.gray(`   Success rate: ${((this.messageCount / (this.messageCount + this.errorCount)) * 100).toFixed(2)}%\n`));
  }
}

// CLI setup
program
  .name('simulate-telemetry-rest')
  .description('Simulate vehicle telemetry data via REST API')
  .option('-u, --url <url>', 'API URL', 'http://localhost:3000')
  .option('-v, --vehicles <number>', 'Number of vehicles', '10')
  .option('-i, --interval <ms>', 'Update interval in milliseconds', '2000')
  .parse();

const options = program.opts();
const apiUrl = options.url;
const vehicleCount = parseInt(options.vehicles, 10);
const intervalMs = parseInt(options.interval, 10);

// Validate inputs
if (vehicleCount < 1 || vehicleCount > 1000) {
  console.error(chalk.red('Error: Vehicle count must be between 1 and 1000'));
  process.exit(1);
}

if (intervalMs < 100) {
  console.error(chalk.red('Error: Interval must be at least 100ms'));
  process.exit(1);
}

// Start simulator
const simulator = new TelemetrySimulator(apiUrl, vehicleCount);

simulator.start(intervalMs).catch((error) => {
  console.error(chalk.red(`Failed to start simulator: ${error.message}`));
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n⏸ Stopping simulator...'));
  simulator.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  simulator.stop();
  process.exit(0);
});
