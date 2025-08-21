use axum::{http::HeaderMap, routing::get, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tracing_opentelemetry::OpenTelemetryLayer;
use opentelemetry::global;
use opentelemetry_otlp::WithExportConfig;
use uuid::Uuid;
use once_cell::sync::Lazy;
use std::collections::HashSet;
use std::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct EconomicEvent {
    event_id: Uuid,
    event_type: String,
    aggregate_id: Uuid,
    timestamp: DateTime<Utc>,
    participants: Vec<String>,
    amount_cents: i64,
    currency: String,
}

#[derive(Debug, Serialize)]
struct Health { ok: bool }

static IDEMPOTENCY_KEYS: Lazy<Mutex<HashSet<String>>> = Lazy::new(|| Mutex::new(HashSet::new()));

fn validate_event(event: &EconomicEvent) -> Result<(), String> {
    if event.participants.is_empty() {
        return Err("participants must not be empty".to_string());
    }
    if event.amount_cents < 0 {
        return Err("amount_cents must be non-negative".to_string());
    }
    let now = Utc::now();
    let delta = now - event.timestamp;
    let delta_abs = if delta.num_seconds() < 0 { -(delta.num_seconds()) } else { delta.num_seconds() };
    if delta_abs > 30 * 24 * 60 * 60 {
        return Err("timestamp must be within ±30 days".to_string());
    }
    Ok(())
}

#[tokio::main]
async fn main() {
    // Tracing + OTel
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(
            opentelemetry_otlp::new_exporter().http().with_endpoint(
                std::env::var("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT")
                    .unwrap_or_else(|_| "http://localhost:4318/v1/traces".to_string()),
            ),
        )
        .install_batch(opentelemetry::runtime::Tokio)
        .ok();

    let otel = tracer.map(|t| OpenTelemetryLayer::new(t));
    let registry = tracing_subscriber::registry().with(tracing_subscriber::EnvFilter::new("info"));
    if let Some(otel_layer) = otel {
        registry.with(otel_layer).with(tracing_subscriber::fmt::layer()).init();
    } else {
        registry.with(tracing_subscriber::fmt::layer()).init();
    }

    let app = Router::new()
        .route("/health", get(health))
        .route("/events/append", post(append_event));
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", 8081)).await.unwrap();
    tracing::info!("event-store listening on 8081");
    axum::serve(listener, app).await.unwrap();
    let _ = global::shutdown_tracer_provider();
}

async fn append_event(headers: HeaderMap, Json(evt): Json<EconomicEvent>) -> (axum::http::StatusCode, Json<serde_json::Value>) {
    // Idempotency handling (in-memory PoC)
    if let Some(key) = headers.get("Idempotency-Key").and_then(|v| v.to_str().ok()) {
        let mut set = IDEMPOTENCY_KEYS.lock().unwrap();
        if set.contains(key) {
            return (axum::http::StatusCode::OK, Json(serde_json::json!({ "ok": true, "event_id": evt.event_id, "idempotent": true })));
        }
        set.insert(key.to_string());
    }

    if let Err(msg) = validate_event(&evt) {
        tracing::warn!(error = %msg, "event validation failed");
        return (axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({ "ok": false, "error": msg })));
    }

    tracing::info!(event_id = %evt.event_id, event_type = %evt.event_type, aggregate_id = %evt.aggregate_id, amount_cents = evt.amount_cents, currency = %evt.currency, participants = ?evt.participants, "append event");
    (axum::http::StatusCode::OK, Json(serde_json::json!({ "ok": true, "event_id": evt.event_id })))
}

async fn health() -> Json<Health> { Json(Health { ok: true }) }
