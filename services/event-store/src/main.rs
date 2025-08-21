use axum::{routing::post, Router, Json};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
struct EconomicEvent {
    event_id: Uuid,
    event_type: String,
    aggregate_id: Uuid,
    timestamp: DateTime<Utc>,
    participants: Vec<String>,
    amount_cents: i64,
    currency: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new("info"))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new().route("/events/append", post(append_event));
    let listener = tokio::net::TcpListener::bind(("0.0.0.0", 8081)).await.unwrap();
    tracing::info!("event-store listening on 8081");
    axum::serve(listener, app).await.unwrap();
}

async fn append_event(Json(evt): Json<EconomicEvent>) -> Json<serde_json::Value> {
    // TODO: persist, idempotency, governance proof validation
    Json(serde_json::json!({ "ok": true, "event_id": evt.event_id }))
}
