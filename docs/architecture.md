# Zije!Se - Architecture Documentation

## Overview
This repository is a modern Next.js (App Router) rewrite of the legacy "Zije-Se" MapLibre application.
The original standalone Python backend (`server.py`) and vanilla JS logic have been migrated into fully native React components and Next.js internal API Routes.

## Project Structure
- `src/app/api/files`: Next.js Route Handler replacing python's `/api/files`. Scans `public/data/` for `.geojson` files.
- `src/app/api/chat`: Proxy Route Handler replacing `AILogic/ollamaHandler.py`. Forwards POST payloads to local Ollama on port `11434`.
- `src/components/map/legacy-layers.tsx`: The core React element that hooks into the MapLibre instance to load `tiles_database_final.json` and `.geojson` layers natively.
- `src/components/ai-chat-panel.tsx`: The AI sliding drawer substituting `UI/chatStyle.css` and `AILogic/chatLogic.js`.
- `src/components/questionnaire-modal.tsx`: The modal superseding `logic/questionnaire.js`.

## Map Logic & Data
The app expects the original `data` folder from the legacy repository to be manually placed in `public/data/`.
Specifically:
- `public/data/tiles_database_final.json` - Used for the Heatmap visualization across the regions.
- `public/data/*.geojson` - All relevant shape/point data for the various layers.

## AI Chat integration
The AI understands the geographical context of what the user clicks on. When a user clicks a map tile, the `legacy-layers` component dispatches a `tileContextUpdated` event, which the `ai-chat-panel` listens to. The subsequent user prompt sent to `/api/chat` is automatically enriched with the JSON representations of `CurrentTileContext`.
