import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces'
})

export const sdk = new NodeSDK({
  traceExporter: exporter,
  // Keep minimal for PoC; add instrumentations later when versions are aligned
})


