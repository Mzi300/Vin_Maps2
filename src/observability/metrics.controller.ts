import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

@Controller()
export class MetricsController {
  private exporter: PrometheusExporter;

  constructor() {
    // The exporter is also instantiated in ObservabilityModule; we recreate here for simplicity.
    this.exporter = new PrometheusExporter({
      startServer: false, // we handle the endpoint via Nest controller
    });
  }

  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const metrics = await this.exporter.getMetricsAsString();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  }
}
