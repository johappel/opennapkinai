# OpenNapkinAI

Ein offener Nachbau von Napkin AI. Aus geschriebenem Text wird ein Diagramm,
das den Inhalt zeigt statt ihn zu schmücken.

Der Ablauf ist dreistufig, wie beim Vorbild: Text hinein, dann eine Reihe
gerenderter Vorschläge, dann Auswahl und Feinschliff. Die Vorschläge sind
inhaltlich begründet, nicht kosmetisch: Eine Variante ist nur dann im Angebot,
wenn sie zu der Struktur passt, die der Text tatsächlich hergibt.

## Schnellstart

Voraussetzungen: Node.js 18 oder neuer, npm.

```bash
npm install
npm run dev
```

Frontend auf `http://localhost:5173`, Backend auf `http://localhost:3001`.
Vite weicht auf 5174 aus, wenn 5173 belegt ist.

Einen Schlüssel hinterlegen: `.env` im Repo-Root anlegen, Vorlage ist
`.env.example`.

```env
BAI_API_KEY=...
```

Ohne Schlüssel startet das Backend trotzdem und antwortet mit einer lesbaren
Meldung statt mit einem generischen Fehler.

## Aufbau

```
opennapkinai/
├── apps/
│   ├── backend/          Express, AI-Endpunkte
│   └── frontend/         Vite, React 19, Tailwind 4
├── packages/
│   ├── types/            gemeinsame Typen
│   ├── eslint-config/
│   └── typescript-config/
├── scripts/              Einmalwerkzeuge, nicht Teil des Builds
└── package.json          npm workspaces, turbo
```

Die Workspaces heissen `backend` und `frontend`. Das Root-Paket heisst
`opennapkinai`.

## AI-Anbindung

Beide Endpunkte liegen in `apps/backend/src/routes/ai.ts`.

| Endpunkt | Zweck | Schema |
|---|---|---|
| `POST /api/ai/structured` | Absatz in vier Stichpunkte | `BulletPointsResponseSchema` |
| `POST /api/ai/smartart` | Text in Diagrammstruktur | `SmartArtStructureSchema` |

Provider sind `createOpenAI`-Clients mit eigenem `baseURL`, benannt nach dem
Anbieter:

- `bai` auf `https://api.b.ai/v1`, Schlüssel aus `BAI_API_KEY`, Modell
  `qwen3.8-flash` (über `BAI_MODEL` überschreibbar)
- `ollama` auf `http://localhost:11434/v1`, für den lokalen Betrieb
- `anthropic` vorhanden, aber ohne Schlüssel

Wichtig: B.AI bedient nur `/v1/chat/completions`, nicht `/v1/responses`. In
der `ai`-SDK 7 löst der direkte Aufruf `bai(id)` auf den Responses-Pfad auf,
deshalb geht jeder Aufruf über die Hilfsfunktion `baiChat()`, also
`bai.chat(id)`.

Das Frontend liest die Diagrammstruktur mit `experimental_useObject` aus
`@ai-sdk/react`. Der Endpunkt antwortet mit `res.json()`, also JSON und nicht
als Datenstrom. `useObject` liest den Body als Klartext und parst
inkrementell, das passt zusammen. Wer auf `streamText` umstellt, muss das
Frontend mitziehen.

## Diagramme

Das Rendern läuft im Browser, ohne Modellaufruf.

- `apps/frontend/src/smartart/layout/` rechnet für jeden Archetyp ein Layout:
  `process`, `cycle`, `hierarchy`, `pyramid`, `matrix`, `comparison`
- `computeLayout(archetype, nodes)` wählt das Verfahren
- `archetypeFit` entscheidet, welche Archetypen zu einer Knotenmenge passen.
  Hierarchie braucht genau eine Wurzel, Vergleich eine gerade Knotenzahl,
  Pyramide höchstens fünf, Matrix mindestens vier
- `SmartArtCanvas` zeichnet das Ergebnis als SVG, optional im Skizzenstil
  über roughjs
- Export als SVG oder PNG über `smartart/download.ts`

Darstellungsparameter wie Farbschema und Skizzenstil sind reine Anzeige. Sie
ändern nie die Struktur, das ist eine bewusste Trennung.

## Umgebung

Die `.env` liegt im Repo-Root, nicht in den Apps. Die Backend-Skripte laden
sie über `--env-file-if-exists=../../.env`.

## Lizenz

MIT, siehe `LICENSE`.
