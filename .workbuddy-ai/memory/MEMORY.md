# Projekt opennapkinai: dauerhafte Notizen

## Struktur und Konventionen

- Monorepo mit npm workspaces und turbo. Apps: `apps/backend` (Express, tsx),
  `apps/frontend` (Vite, React 19, Tailwind 4). Packages: `@repo/types`,
  `@repo/eslint-config`, `@repo/typescript-config`.
- **Noch kein einziger Git-Commit vorhanden.** `HEAD` existiert nicht.
  Vor Git-Operationen pruefen, die HEAD voraussetzen. Fuer Vergleiche
  Dateikopien anlegen statt `git show HEAD:` oder `git stash`.
- Arbeiten in `apps/frontend` heissen im Manifest `opennapkinai`, das Backend
  heisst `backend`. Zwei verschiedene Namen, nicht verwechseln.
- `.env` liegt im Repo-Root, nicht in den Apps. Die Backend-Skripte laden sie
  mit `--env-file-if-exists=../../.env`. `.env.example` ist die Vorlage.
  `.env` ist in `.gitignore`, `.env.example` bewusst nicht.

## AI-Provider

- Konvention: jeder Provider ist ein `createOpenAI`-Client mit eigenem
  `baseURL`, benannt nach dem Anbieter. Kein neues Paket pro Anbieter.
  - `ollama`: lokal, `http://localhost:11434/v1`, ApiKey "ollama" (kein Geheimnis)
  - `bai`: B.AI, `https://api.b.ai/v1`, ApiKey aus `BAI_API_KEY`
  - `anthropic`: vorhanden, aber mit leerem ApiKey, offenbar Altlast
- **Wichtig bei OpenAI-kompatiblen Anbietern**: `provider(modelId)` löst in
  `ai` v7 auf den Responses-Pfad (`/v1/responses`) auf. Nicht jeder Anbieter
  bedient den. B.AI lehnt ihn fuer `qwen3.8-flash` ausdruecklich ab. Immer
  `provider.chat(modelId)` verwenden, wenn der Anbieter nur
  `/v1/chat/completions` spricht. Dafuer gibt es die Hilfsfunktion `baiChat()`.
- Modellauswahl laeuft ueber Konstanten im Modul (z.B. `BAI_MODEL`, Default
  `qwen3.8-flash`, ueberschreibbar per Env).
- Deaktivierte Provider stehen als Kommentar unter dem aktiven Aufruf.
  Umschalten ist damit ein Kommentarwechsel, kein Umbau.
- Endpunkte:
  - `/api/ai/structured`: `generateObject` mit `BulletPointsResponseSchema`
  - `/api/ai/smartart`: `generateObject` mit `SmartArtStructureSchema`,
    2 Versuche, danach `normalizeSmartArtStructure` als Aufraeumer
- Das Frontend nutzt `experimental_useObject` aus `@ai-sdk/react` gegen
  `/api/ai/smartart`. Achtung: dieser Endpunkt antwortet mit `res.json()`,
  also JSON, nicht als Datenstrom. `useObject` liest den Body als Klartext
  und parst inkrementell JSON, das passt zusammen. Nicht auf
  `streamText`/`toTextStreamResponse` umstellen, ohne das Frontend mitzuziehen.

## Testen in dieser Umgebung (Windows, MSYS-Bash)

Zwei Fallen, die schon einmal mehrere Stunden gekostet haben:

- **Immer `curl --noproxy '*'` verwenden.** Die Umgebung setzt
  `HTTP_PROXY`/`HTTPS_PROXY` auf `http://127.0.0.1:40420`. Ohne die Option
  laufen Aufrufe gegen `localhost` durch den Proxy und liefern dessen
  Antworten statt die des Dev-Servers.
- **`pkill -f tsx` beendet keine Windows-Prozesse.** Verwaiste Server bleiben
  auf ihrem Port liegen, neue Instanzen kommen nicht hoch, und Tests laufen
  gegen den alten Stand. Prozesse ueber PowerShell beenden:
  `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"` und
  `Stop-Process -Id <PID> -Force`.

## Bekannte Baustellen

- `tsc --noEmit` im Backend meldet 5 Fehler (Stand 18.09.2026):
  zwei TS2589 in `ai.ts` aus der Zod-Schema-Tiefe bei `generateObject`,
  drei TS2345 in `notes.ts` wegen `string | string[]`. Bestanden schon vor
  dem B.AI-Einbau und sind nicht durch die Provider-Wahl verursacht.
- `npm audit` meldet 7 Vulnerabilities aus der `ai`-SDK-Familie
  (`undici` <= 6.27.0 ueber `@ai-sdk/provider-utils@3.0.37`). Der 3.x-Zweig
  endet bei 3.0.37, ein Fix ist nur per Major-Sprung zu haben. Bewusst
  offen gelassen.
- `ollama-ai-provider` steht im Backend-Manifest, wird aber nirgends
  importiert. Nur in einem Kommentar erwaehnt. Kandidat zum Entfernen.
- `apps/backend/tsconfig.tsbuildinfo` und `apps/frontend/tsconfig.tsbuildinfo`
  sind versioniert, obwohl es Build-Artefakte sind. Sie gehoeren in
  `.gitignore`.
