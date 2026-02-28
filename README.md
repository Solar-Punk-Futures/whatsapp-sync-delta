# WhatsApp Sync Delta

A local-first tool for comparing WhatsApp chat exports and isolating only the messages/attachments that are new since your last sync.

## Web app

```bash
pnpm install
pnpm dev
```

## Desktop app (Tauri)

This project is now scaffolded for Tauri so it can run as a desktop app.

### Prerequisites

- Node + pnpm
- Rust toolchain (`rustup`)
- Tauri system dependencies for your OS: <https://tauri.app/start/prerequisites/>

### Run desktop app in development

```bash
pnpm tauri:dev
```

### Build desktop installer/bundles

```bash
pnpm tauri:build
```

Tauri config lives in `src-tauri/tauri.conf.json`.
