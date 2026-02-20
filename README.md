<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/MapLibre_GL-5-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?style=for-the-badge&logo=tailwindcss" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" />
</p>

# 🏠 ZIJE!SE

**Najděte si bydlení na míru** — Interaktivní mapová aplikace pro Královéhradecký kraj, která kombinuje GeoJSON datové vrstvy, personalizovaný dotazník a AI chat pro nalezení ideálního bydlení.

> Modern Next.js rewrite of the legacy "Zije-Se" MapLibre application. The original standalone Python backend and vanilla JS logic have been migrated into fully native React components and Next.js API Routes.

---

## ✨ Funkce

- 🗺️ **Interaktivní mapa** — MapLibre GL s Deck.gl vrstvami, podporou světlého/tmavého režimu, satelitního zobrazení a OpenStreetMap
- 📋 **Dotazník preferencí** — 50 otázek o životním stylu, které personalizují výsledky mapy
- 🤖 **AI Chat** — Kontextový AI asistent napojený na lokální Ollama server, rozumí geografickému kontextu kliknutých oblastí
- 🌐 **Dvojjazyčné rozhraní** — Čeština / Angličtina s přepínáním jedním kliknutím
- 🌙 **Tmavý / Světlý mód** — Plná podpora obou režimů včetně mapových stylů
- 👤 **Uživatelské účty** — Registrace, přihlášení, kreditový systém a ukládání dat dotazníku
- ⚙️ **Nastavení mapy** — Mód pro barvoslepé, průhlednost vrstev, zapnutí/vypnutí výplní

---

## 📁 Struktura projektu

```
zijese/
├── public/
│   └── data/                 # GeoJSON + tiles_database_final.json (NENÍ v Gitu)
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page (hero + scroll animace)
│   │   ├── app/page.tsx      # Hlavní aplikace (mapa + sidebar)
│   │   ├── login/page.tsx    # Přihlášení / Registrace
│   │   ├── layout.tsx        # Root layout (fonty, providers)
│   │   ├── globals.css       # Globální styly + Tailwind konfigurace
│   │   └── api/
│   │       ├── auth/route.ts # Autentizace (register/login/update)
│   │       ├── chat/route.ts # AI Chat proxy → Ollama API
│   │       └── files/route.ts# Seznam GeoJSON souborů
│   ├── components/
│   │   ├── logo.tsx          # SVG logo s Easter egg animací
│   │   ├── mode-toggle.tsx   # Přepínač tmavý/světlý mód
│   │   ├── map/              # 🗺️ Mapové komponenty
│   │   │   ├── map.tsx       # MapLibre wrapper + kontext
│   │   │   └── legacy-layers.tsx  # Deck.gl GeoJSON vrstvy
│   │   ├── providers/        # 🔌 React kontextové providery
│   │   │   ├── auth-provider.tsx
│   │   │   ├── language-provider.tsx
│   │   │   └── theme-provider.tsx
│   │   ├── sidebar/          # 📋 Systém postranních panelů
│   │   │   ├── sidebar-layout.tsx  # Sdílený shell (logo, profil, ovládání)
│   │   │   ├── ai-chat-panel.tsx
│   │   │   ├── ai-settings-panel.tsx
│   │   │   ├── settings-panel.tsx
│   │   │   ├── questionnaire-panel.tsx
│   │   │   └── index.ts      # Barrel export
│   │   └── ui/               # 🎨 Generické UI primitiva
│   │       ├── click-spark.tsx
│   │       ├── container-scroll-animation.tsx
│   │       ├── stepper.jsx
│   │       └── stepper.css
│   └── lib/
│       └── utils.ts
├── docs/                     # Dokumentace
└── package.json
```

---

## 🚀 Jak stáhnout a spustit

### Požadavky

| Nástroj | Verze | Poznámka |
|---------|-------|----------|
| **Node.js** | 18+ (doporučeno 20+) | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Součást Node.js |
| **Git** | Libovolná | [git-scm.com](https://git-scm.com/) |
| **Ollama** | *(volitelné)* | Pouze pro AI Chat — [ollama.com](https://ollama.com/) |

### 1. Naklonování repozitáře

```bash
git clone https://github.com/<tvuj-username>/zijese.git
cd zijese
```

### 2. Instalace závislostí

```bash
npm install
```

### 3. Přidání dat (GeoJSON)

Data nejsou součástí Gitu kvůli velikosti (~1.2 GB). Stáhni složku `data/` externě a vlož ji do:

```
public/data/
```

Složka musí obsahovat:
- `tiles_database_final.json` — databáze dlaždic pro heatmapu
- `*.geojson` — všechny datové vrstvy (povodně, nemocnice, školy, ...)

> 💡 Aplikace se spustí i bez dat — mapa bude fungovat, jen nebudou dostupné datové vrstvy.

### 4. Spuštění vývojového serveru

```bash
npm run dev
```

Aplikace poběží na **[http://localhost:3000](http://localhost:3000)**.

### 5. *(Volitelné)* Spuštění AI chatu

AI chat vyžaduje lokální [Ollama](https://ollama.com/) server:

```bash
# Nainstaluj Ollama z https://ollama.com/download
# Stáhni model:
ollama pull gpt-oss:latest

# Ollama automaticky běží na portu 11434
```

Po spuštění Ollamy bude AI chat funkční na adrese `http://localhost:11434`.

---

## 🔧 Dostupné skripty

| Příkaz | Popis |
|--------|-------|
| `npm run dev` | Spustí vývojový server (Turbopack) |
| `npm run build` | Sestaví produkční balíček |
| `npm run start` | Spustí produkční server |
| `npm run lint` | Spustí ESLint kontrolu |

---

## 🛠️ Technologie

| Kategorie | Technologie |
|-----------|-------------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **UI** | React 19, Tailwind CSS 4, Lucide Icons |
| **Mapy** | MapLibre GL JS 5, Deck.gl 9 |
| **Animace** | Framer Motion 12 |
| **Téma** | next-themes |
| **AI** | Ollama (lokální LLM proxy) |
| **Jazyk** | TypeScript 5 |

---

## 📸 Stránky aplikace

| Stránka | URL | Popis |
|---------|-----|-------|
| Landing | `/` | Úvodní stránka s hero sekcí a scroll animací |
| Aplikace | `/app` | Hlavní mapa s postranním panelem |
| Přihlášení | `/login` | Formulář pro přihlášení a registraci |

---

## 📄 Licence

Tento projekt je soukromý. Všechna práva vyhrazena.
