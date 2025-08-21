FROM rust:1.79 as builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV RUST_LOG=info
COPY --from=builder /app/target/release/icn-event-store /usr/local/bin/icn-event-store
EXPOSE 8081
CMD ["/usr/local/bin/icn-event-store"]
