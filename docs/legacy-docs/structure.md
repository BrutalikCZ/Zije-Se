src/components/
├── logo.tsx                  # Logo component
├── mode-toggle.tsx           # Dark/light theme toggle
├── map/                      # 🗺️ Map-related
│   ├── map.tsx              # MapLibre wrapper (was ui/map.tsx)
│   └── legacy-layers.tsx    # Deck.GL GeoJSON layers
├── providers/               # 🔌 Context providers
│   ├── auth-provider.tsx
│   ├── language-provider.tsx
│   └── theme-provider.tsx
├── sidebar/                 # 📋 Sidebar panel system (NEW)
│   ├── index.ts             # Barrel export
│   ├── sidebar-layout.tsx   # Shared sidebar shell (NEW)
│   ├── ai-chat-panel.tsx    # AI Chat (deduplicated)
│   ├── ai-settings-panel.tsx# AI Settings (deduplicated)
│   ├── settings-panel.tsx   # Map Settings (deduplicated)
│   └── questionnaire-panel.tsx # Questionnaire (deduplicated)
└── ui/                      # 🎨 Generic UI primitives
    ├── click-spark.tsx      # (was ClickSpark.tsx)
    ├── container-scroll-animation.tsx
    ├── stepper.jsx          # (was Stepper.jsx)
    └── stepper.css          # (was Stepper.css)
