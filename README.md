# Sternbergs Vermächtnis – 3D Escape Room

First-Person-Escape-Room im Browser mit drei Räumen und acht verketteten Rätseln.

## Stack

| Teil      | Technik                                                        |
|-----------|----------------------------------------------------------------|
| Frontend  | Vite, Three.js (PointerLockControls, prozedurale Canvas-Texturen) |
| Backend   | Express 5, validiert alle Antworten serverseitig               |
| Datenbank | SQLite über das eingebaute `node:sqlite` (Durchläufe, Hinweise, Bestenliste) |
| Shared    | `shared/lightsout.js` – dieselbe Logik prüft Client und Server |

Die Lösungen stehen nur in `server/puzzles.js` und landen nie im Client-Bundle.

## Starten

```bash
npm install
npm run dev        # API :3001 + Vite :5173  → http://localhost:5173
```

Produktion:

```bash
npm run build
npm start          # liefert dist/ und API auf :3001
```

Tests (prüfen u. a., dass das Logikrätsel genau eine Lösung hat): `npm test`

## Steuerung

WASD bewegen · Maus umsehen · Linksklick untersuchen · Shift rennen · N Notizbuch · Esc Pause

Hinweise gibt es in jedem Rätsel-Dialog, sie kosten jeweils 60 s Strafzeit.
Der Fortschritt wird im Browser gespeichert („Fortsetzen“ auf dem Startbildschirm).

## Struktur

```
client/src/
  main.js       Screens, HUD, Raumwechsel
  engine.js     Renderer, Bewegung, Kollision, Raycast-Interaktion
  builders.js   Raum-Hülle, Türen, Texturen, Mondphasen
  ui.js         Dialoge: Zahlenschloss, Wortschloss, Farbschloss, Lights Out, Notizbuch
  game.js       Spielstand, Inventar, API-Aufrufe
  rooms/        room1 (Arbeitszimmer), room2 (Labor), room3 (Sternwarte)
server/         Express-API, Rätseldefinitionen, SQLite
shared/         Lights-Out-Logik, Hinweise
test/           Lösbarkeits- und Eindeutigkeitstests
```

Spoiler: Lösungen in `server/puzzles.js`, Lösungswege in `shared/hints.js`.

## GitHub Pages

Bei jedem Push auf `main` baut `.github/workflows/pages.yml` eine statische Version (`VITE_STATIC=1`).
Da Pages keinen Server ausführen kann, prüft diese Variante die Antworten im Browser gegen gesalzene SHA-256-Hashes
(`client/src/offline.js`), und die Bestenliste gilt nur für das jeweilige Gerät. Die volle Version mit Server-Validierung
und gemeinsamer Bestenliste läuft mit `npm start` auf einem beliebigen Node-Host (Node ≥ 22.5).
