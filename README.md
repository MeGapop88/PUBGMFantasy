# PUBG Mobile Global Open (PMGO) — Tactical Fantasy & Match Predictions Platform

> A high-performance, single-page web application designed for competitive PUBG Mobile esports analysts and players. Ingests raw match spectator telemetry (Shadow Tracker JSON format), computes official tournament placement points and player MVP rates, and delivers an immersive **Tactical Protocol / Military HUD** interface modeled after the Google Stitch *"Ignite Tournament Interface"* design system.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Data Model & Telemetry Ingestion](#-data-model--telemetry-ingestion)
- [Scoring Engine & Formulas](#-scoring-engine--formulas)
- [Design System & UI Specs](#-design-system--ui-specs)
- [Project Directory Structure](#-project-directory-structure)
- [Setup & Usage Guide](#-setup--usage-guide)

---

## 🎯 Overview

The **PMGO Tactical Platform** allows users to:
1. **Track Live & Historic Game Telemetry**: View official 16-team match leaderboards with PUBG Mobile esports point breakdowns.
2. **Make Tactical Match Predictions**: Predict 1st place match winners with a reward decay curve across 1st–5th places.
3. **Build & Deploy Fantasy Squads**: Draft 4-operative rosters adhering to a **max 2 per real team** constraint, scored by aggregate player MVP rates.
4. **Inspect Player Dossiers**: Dive into individual player performance analytics, lifetime averages, best game highlights, and per-match telemetry tables.

---

## ⚡ Key Features

### 1. 🏆 Tournament Command Center (`/dashboard`)
- **Featured Telemetry Hero Banner**: Live stage indicators, 36-game telemetry overview, total kills counter, top MVP leader callout, and scanline HUD overlays.
- **Match Result Detail & Game Leaderboard**:
  - Interactive game switcher carousel (`D1 G1` through `D3 G6`).
  - **8-Column Official Match Standings**: Ranks 1 to 16 displaying Team Logos, Total Kills, Placement Points (`+10`, `+6`, `+5`, etc.), and Total Match Points (`Kill Points + Placement Points`).
  - **Top 3 Inset Glow Highlight**: Distinct `#FF6B00` Electric Orange inner glow styling for podium finishes.
  - **Match Prediction Payout Widget**: Evaluates saved user picks against actual game results with a visual 5-bar reward decay chart.
- **Match Telemetry Grid**: Full tournament grid grouped by stage (*League Phase* vs. *Finals Phase*) and days.

### 2. 🎯 Tactical Match Predictor (`/predictions`)
- **Dual-Pane Tactical Interface** (matching Stitch `Match Prediction (Desktop)`):
  - **Left Pane**: List of all 16 participating teams with official team logos, finish placement, kill counts, and potential payout values.
  - **Right Pane**: Selected team telemetry card, actual match finish, points earned callout, reward decay curve reference, and **"LOCK IN PREDICTION"** action button.

### 3. 🛡️ Fantasy Squad Dock & Roster Management (`/fantasy`)
- **Dual-View Mode** (matching Stitch `My Team - Active (Desktop)` and `Fantasy Draft (Desktop)`):
  - **Active Deployment View**: 4 vertical trading cards featuring desaturated player portraits, team logos, role badges (*In-Game Leader*, *Entry Fragger*, *Support*, *Flex*), slot badges (`01`–`04`), and 4-stat telemetry grids (*MVP Rate*, *K/D Ratio*, *Avg Kills*, *Avg Damage*).
  - **Draft Builder View**: Filterable player pool grid (`h-64` cards), team filter dropdown, search bar, MVP rate badges, 4-slot roster dock with real-time aggregate MVP counter, and strict **2-per-team cap validation**.

### 4. 🥇 Leaderboards (`/leaderboard`)
- **Fantasy Squad Rankings**: Ranks user squads by combined 4-player MVP rates, showing player roster chips and team logos.
- **Predictor Standings**: Ranks user predictors by total prediction points earned and perfect 10-point picks.

### 5. 🪪 Player Roster & Dossiers (`/players`)
- Operative search & team filter grid.
- Detailed dossier view for each player with career averages (*Avg Kills*, *Avg Damage*, *Avg MVP Rate*, *Avg Survival Time*, *Headshot Count*), best performance highlights, and a full match-by-match telemetry table.

---

## 🛠️ Architecture & Tech Stack

| Component | Technology / Library | Description |
|---|---|---|
| **Core Framework** | **Vite v8 + Vanilla JS (ES Modules)** | Fast, lightweight Single Page Application (SPA) without framework overhead. |
| **Styling & HUD** | **Tailwind CSS + Custom CSS** | Utility-first CSS combined with tactical HUD CSS tokens (`src/css/design-system.css`). |
| **Icons & Fonts** | **Google Material Symbols Outlined** <br/> **Archivo Narrow** (Headlines) <br/> **Geist** (Body/Labels/Mono-Stats) | High-contrast military/esports typography and vector icon set. |
| **Routing** | **Hash Router (`src/router.js`)** | Zero-dependency hash-based client routing (`#/dashboard`, `#/predictions`, `#/fantasy`, `#/leaderboard`, `#/players`, `#/player/:uid`). |
| **Persistence & Auth** | **HTML5 LocalStorage (`src/state.js`)** | User registration/login, saved match predictions, fantasy squad selections, and scored leaderboards. |
| **Team Logos Data** | **Logos Registry (`src/data/teamLogos.js`)** | Team logo badge generator & mapped branding for all 16 PMGO teams. |

---

## 📊 Data Model & Telemetry Ingestion

### Source Data Format
The platform ingests raw spectator JSON files exported from **PUBG Mobile Shadow Tracker**.

### File Naming Convention
Files must be placed in `public/data/` and adhere to the following naming structure:
```
public/data/
├── Finals D1 G1.json
├── Finals D1 G2.json
├── ...
├── Finals D3 G6.json
├── League D1 G1.json
├── ...
└── League D3 G6.json
```
*(Total of 36 match JSON files: 18 League matches + 18 Finals matches).*

### JSON Telemetry Schema (`allinfo.TotalPlayerList`)
Each match JSON file contains an array wrapper with an `allinfo.TotalPlayerList` array containing 64 player object entries:

```json
[{
  "allinfo": {
    "TotalPlayerList": [
      {
        "uId": 5227970312,
        "playerName": "ngxKOOPS02",
        "playerOpenId": "13697172143211816",
        "teamId": 7,
        "teamName": "Nigma Galaxy",
        "rank": 1,
        "killNum": 6,
        "damage": 998,
        "heal": 166,
        "survivalTime": 1636,
        "knockouts": 4,
        "assists": 1,
        "headShotNum": 1,
        "maxKillDistance": 158,
        "driveDistance": 8232,
        "marchDistance": 2606
      }
    ]
  }
}]
```

### Registered Teams (16 Official PMGO Teams)
- `721 ESPORTS`
- `7C ESPORTS`
- `ALULA Esports`
- `CB9 Esports`
- `DAT ALREMAL`
- `ETSH ESPORTS`
- `FOUR WIZ`
- `Geekay Esports`
- `KHK Esports`
- `MASTER TEAM`
- `Nigma Galaxy`
- `R8 ESPORTS`
- `RA'AD`
- `THE HUNTERS`
- `Team Vision`
- `iKURD ESPORTS`

---

## 🧮 Scoring Engine & Formulas

### 1. Official PUBG Mobile Match Point System
Match standings on the leaderboard compute total points using official PUBG Mobile Esports rules:

$$\text{Total Match Points} = \text{Placement Points} + \text{Kill Points}$$

#### Kill Points
$$\text{Kill Points} = 1 \text{ Point per Kill}$$

#### Official Placement Points Lookup
| Final Placement | Placement Points |
|:---:|:---:|
| **1st Place** 🥇 | **10 PTS** |
| **2nd Place** 🥈 | **6 PTS** |
| **3rd Place** 🥉 | **5 PTS** |
| **4th Place** | **4 PTS** |
| **5th Place** | **3 PTS** |
| **6th Place** | **2 PTS** |
| **7th & 8th Place** | **1 PT** |
| **9th – 16th Place** | **0 PTS** |

---

### 2. Player MVP Rate Formula
For every match, each player's MVP rate contribution is calculated relative to total match statistics:

$$\text{MVP Rate} = \left(\frac{\text{Damage}}{\text{Total Match Damage}} \times 0.3\right) + \left(\frac{\text{Survival Time}}{\text{Total Match Survival}} \times 0.2\right) + \left(\frac{\text{Eliminations}}{\text{Total Match Eliminations}} \times 0.4\right) + \left(\frac{\text{Knockdowns}}{\text{Total Match Knockdowns}} \times 0.1\right)$$

*Fantasy squad scores equal the sum of all 4 selected players' total MVP rates across all matches.*

---

### 3. Match Prediction Decay Scoring (Base 10 PTS Max)
When users predict a match winner, points are awarded based on where their selected team actually finishes:

| Pick Finish | Payout % | Points Awarded |
|:---:|:---:|:---:|
| **1st Place Finish** | **100%** | **10 PTS** |
| **2nd Place Finish** | **80%** | **8 PTS** |
| **3rd Place Finish** | **50%** | **5 PTS** |
| **4th Place Finish** | **30%** | **3 PTS** |
| **5th Place Finish** | **10%** | **1 PT** |
| **6th – 16th Finish** | **0%** | **0 PTS** |

---

## 🎨 Design System & UI Specs

Modeled after Google Stitch **"Ignite Tournament Interface"**:

- **Color Palette**:
  - **Background**: `#0A0A0B` (Dark tactical background with 40px grid texture)
  - **Primary Accent**: `#FF6B00` (Electric Orange)
  - **HUD Surface**: `#1A1A1C` (Dark container cards with `#2E2E32` borders)
  - **Status Live**: `#FF0000` (Animated pulse indicator)
  - **Status Victory**: `#4CFF72`
- **Typography Scale**:
  - **Display / Titles**: `Archivo Narrow` (Bold, Uppercase, Tracking Tight)
  - **Body / Labels**: `Geist` (Clean, Monospaced Statistics, Uppercase Letter Spacing)
- **Shape Language**:
  - 0px border radius (sharp, angular tactical edges).
  - Inset glow borders (`shadow-[inset_0_0_10px_rgba(255,107,0,0.4)]`) for podium placements.
  - Scanline CSS overlays for interactive HUD elements.

---

## 📁 Project Directory Structure

```
PUBGM Fantasy and Predict/
├── index.html                  # SPA HTML Shell with Tailwind, Fonts & Layout
├── package.json                # Dependencies & Vite scripts
├── vite.config.js              # Vite configuration (ignores watching data dir)
├── README.md                   # Project documentation
├── public/
│   └── data/                   # Directory for 36 PMGO match JSON files
└── src/
    ├── main.js                 # Entry point: Router, auth sync & data boot
    ├── router.js               # Hash SPA router
    ├── state.js                # Auth, predictions & fantasy state manager
    ├── ui.js                   # UI utilities, toasts, page loader & formatters
    ├── css/
    │   ├── design-system.css   # Custom CSS tokens & Stitch HUD animations
    │   └── app.css             # Component CSS styles & data tables
    ├── data/
    │   ├── loader.js           # Telemetry parser, MVP engine & aggregate builder
    │   └── teamLogos.js        # Mapped team logos & badge generator
    └── pages/
        ├── login.js            # Authentication page (Login / Register tabs)
        ├── dashboard.js        # Tournament Dashboard & Game Telemetry Leaderboard
        ├── predictions.js      # Dual-pane Match Predictor interface
        ├── fantasy.js          # Active Squad deployment & Draft Builder
        ├── leaderboard.js      # Combined Fantasy & Predictor standings
        └── players.js          # Operative roster grid & detailed dossiers
```

---

## 🚀 Setup & Usage Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Web Browser (Chrome, Edge, Firefox, or Safari)

### 1. Clone & Install
```bash
cd "f:\Programing projects\PUBGM Fantasy and Predict"
npm install
```

### 2. Add Match Data
Copy your 36 Shadow Tracker match JSON files into `public/data/`:
```bash
public/data/Finals D1 G1.json
public/data/Finals D1 G2.json
...
```

### 3. Run Local Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173/` (or the port displayed in your terminal).

### 4. Build for Production
```bash
npm run build
```
The output bundle will be generated in `dist/`.

---

*PMGO Tactical Platform — Tactical Protocol Spectator Engine.*
#   F a n t a s y  
 