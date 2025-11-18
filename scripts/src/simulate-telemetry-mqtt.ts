#!/usr/bin/env node
import mqtt from 'mqtt';
import { program } from 'commander';
import chalk from 'chalk';
import { TelemetryPacket } from '@telemetry/shared';

// Sample VINs
const SAMPLE_VINS = [
  '1HGBH41JXMN109186',
  '2HGBH41JXMN109187',
  '3HGBH41JXMN109188',
  '4HGBH41JXMN109189',
  '5HGBH41JXMN109190',
];

const GPS_ROUTE = [
  { lat: 37.7749, lon: -122.4194 },
  { lat: 37.7549, lon: -122.3994 },
  { lat: 37.7349, lon: -122.3794 },
  { lat: 37.3382, lon: -121.8863 },
];

interface VehicleState {
  vin: string;
  routeIndex: number;
  speed: number;
  soc: number;
  odometer: number;
  temperature: number;
}

class MqttSimulator {
  private client: mqtt.MqttClient | null = null;
  private vehicles: Map<string, VehicleState> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private messageCount: number = 0;

  constructor(private brokerUrl: string, vehicleCount: number) {
    this.initializeVehicles(vehicleCount);
  }

  private initializeVehicles(count: number): void {
    const vins = count <= SAMPLE_VINS.length 
      ? SAMPLE_VINS.slice(0, count)
      : [...SAMPLE_VINS, ...Array(count - SAMPLE_VINS.length).fill(0).map((_, i) => 
          `Y${String(i).padStart(16, '0')}`
        )];

    vins.forEach((vin) => {
      this.vehicles.set(vin, {
        vin,
        routeIndex: 0,
        speed: 60 + Math.random() * 40,
        soc: 80 + Math.random() * 20,
        odometer: Math.random() * 50000,
        temperature: 25 + Math.random() * 10,
      });
    });

    console.log(chalk.green(`✓ Initialized ${count} vehicles`));
  }

  private generateTelemetry(state: VehicleState): TelemetryPacket {
    state.speed += (Math.random() - 0.5) * 15;
    state.speed = Math.max(0, Math.min(120, state.speed));
    state.soc = Math.max(0, state.soc - 0.01);
    state.temperature = 25 + (state.speed / 10) + (Math.random() - 0.5) * 3;

    if (state.speed > 5) {
      state.routeIndex = (state.routeIndex + 1) % GPS_ROUTE.length;
      state.odometer += state.speed / 3600;
    }

    const location = GPS_ROUTE[state.routeIndex];

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
      voltage: 400 + Math.random() * 20,
      current: Math.random() * 100,
      heading: Math.random() * 360,
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: `simulator-${Date.now()}`,
        clean: true,
        reconnectPeriod: 5000,
      });

      this.client.on('connect', () => {
        console.log(chalk.green('✓ Connected to MQTT broker'));
        resolve();
      });

      this.client.on('error', (err) => {
        console.error(chalk.red(`MQTT error: ${err.message}`));
        reject(err);
      });
    });
  }

  start(intervalMs: number): void {
    console.log(chalk.blue(`\n🚀 Starting MQTT simulator...`));
    console.log(chalk.gray(`   Broker: ${this.brokerUrl}`));
    console.log(chalk.gray(`   Vehicles: ${this.vehicles.size}`));
    console.log(chalk.gray(`   Interval: ${intervalMs}ms\n`));

    this.intervalId = setInterval(() => {
      for (const [vin, state] of this.vehicles) {
        const telemetry = this.generateTelemetry(state);
        const topic = `vehicle/${vin}/telemetry`;
        
        this.client!.publish(topic, JSON.stringify(telemetry), { qos: 1 }, (err) => {
          if (err) {
            console.error(chalk.red(`✗ Failed to publish for ${vin}`));
          } else {
            this.messageCount++;
          }
        });
      }

      if (this.messageCount % (this.vehicles.size * 10) === 0) {
        console.log(chalk.green(`📊 Published: ${this.messageCount} messages`));
      }
    }, intervalMs);

    console.log(chalk.green('✓ Simulator running. Press Ctrl+C to stop.\n'));
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.client) {
      this.client.end();
    }
    console.log(chalk.yellow(`\n📊 Total messages: ${this.messageCount}\n`));
  }
}

program
  .name('simulate-telemetry-mqtt')
  .description('Simulate vehicle telemetry via MQTT')
  .option('-b, --broker <url>', 'MQTT broker URL', 'mqtt://localhost:1883')
  .option('-v, --vehicles <number>', 'Number of vehicles', '10')
  .option('-i, --interval <ms>', 'Update interval', '3000')
  .parse();

const options = program.opts();
const simulator = new MqttSimulator(options.broker, parseInt(options.vehicles, 10));

simulator.connect().then(() => {
  simulator.start(parseInt(options.interval, 10));
}).catch((error) => {
  console.error(chalk.red(`Failed to start: ${error.message}`));
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('\n⏸ Stopping...'));
  simulator.stop();
  process.exit(0);
});
