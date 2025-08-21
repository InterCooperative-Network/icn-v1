use axum::{routing::{get, post}, Router, Json};
use std::net::SocketAddr;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct Health { ok: bool }

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/health", get(|| async { Json(Health { ok: true }) }))
        .route("/events", post(|| async { Json(Health { ok: true }) }))
        .route("/events", get(|| async { Json(Health { ok: true }) }));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8001));
    println!("listening on {}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await.unwrap();
}
