import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OpenTelemetryModule } from '@nestjs/otel';
import { LoggerModule } from './logger.module';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      serviceName: 'vinmaps-backend',
      traceAutoInjectors: [],
      metricExporter: new PrometheusExporter({
        startServer: true,
        port: Number(process.env.METRICS_PORT) || 9464,
        endpoint: '/metrics',
      }),
    }),
    LoggerModule,
  ],
  controllers: [MetricsController],
})
export class ObservabilityModule {}
