# Dispo-Assistent – Einrichtung und aktueller Stand

**Aktuelle App:** v0.8.0 – https://moritzfrohnapfel-tech.github.io/dispo-assistent/

## Was bereits funktioniert

- Offline-/lokale Erkennung und getrennte, korrigierbare Dispo-Karten
- Mehrere Telefonate sammeln, Vorgänge einzeln korrigieren und bestätigen
- Wahlweise lokale Entwürfe, TXT-Export und Kopieren bestätigter Meldungen für OneNote
- KI-Oberfläche: Umschalten zwischen `Lokal` und `Mit KI`
- Geschützter KI-Server als Quellcode in [backend/worker.js](backend/worker.js)

**Noch nicht live:** Der KI-Server muss erst auf einem eigenen Cloudflare-Worker bereitgestellt und mit einem separat abgerechneten OpenAI-API-Zugang konfiguriert werden. GitHub Pages allein kann den API-Schlüssel nicht sicher verwalten.

## KI einrichten: Schritt für Schritt

1. Bei https://dash.cloudflare.com/ anmelden (oder Konto erstellen). Unter **Workers & Pages** einen neuen Worker namens z. B. `dispo-assistent-api` erstellen.
2. Im Worker **Edit Code** öffnen. Den vollständigen Inhalt von [backend/worker.js](backend/worker.js) als JavaScript-Modul verwenden und **Deploy** ausführen. Eine Worker-Adresse endet typischerweise auf `.workers.dev`.
3. Unter **Settings → Variables and Secrets** folgende **Secrets** hinzufügen:
   - `OPENAI_API_KEY`: Der persönliche OpenAI-API-Schlüssel aus https://platform.openai.com/api-keys
   - `DISPO_ACCESS_TOKEN`: Ein **eigenes**, möglichst zufälliges, mindestens 32 Zeichen langes Passwort für diesen Worker (nicht identisch mit dem OpenAI-Schlüssel).
4. Optional als **Variable** `ALLOWED_ORIGIN` mit dem exakten Wert `https://moritzfrohnapfel-tech.github.io` setzen; Standardwert ist bereits so eingestellt. Optional `OPENAI_MODEL` setzen (standardmäßig `gpt-4.1-mini`).
5. Sicherstellen, dass für die OpenAI-API die separate Abrechnung eingerichtet ist. Ein ChatGPT-Abonnement schließt **keine** API-Nutzung ein.
6. Auf dem iPhone die App öffnen. Oben auf **Mit KI** gehen, **KI-Verbindung einrichten** aufklappen, die Worker-Basisadresse und das **private Worker-Passwort** (niemals den OpenAI-API-Schlüssel!) eintragen, anschließend **Server prüfen**.
7. Mit **Testdaten** beginnen und **Mit KI auswerten** drücken. Jeder erkannte Vorgang bleibt unbestätigt, bis er korrigiert/bestätigt wird.

**Wichtig:** Der Worker-Schlüssel wird im geöffneten Eingabefeld gehalten; nicht als Link oder GitHub-Datei veröffentlichen. Der Inhalt echter Diktate wird im KI-Modus über den Worker an den OpenAI-API-Dienst gesendet. Vor realer Nutzung sind Firmenfreigabe, Datenschutz, Zugriffs-/Missbrauchsschutz und ggf. eine belastbarere Benutzeranmeldung erforderlich. Ein gemeinsamer Schlüssel ist nur für einen kleinen privaten Prototyp gedacht.

## OneNote: Implementierungsplan (noch keine aktive Verbindung)

Ziel: Den bestätigten Dispo-Nachtrag auf die korrekte, bestehende Tagesseite **unterhalb** der bisherigen OneNote-Tabellen einfügen. Nichts überschreiben und niemals automatisch beim Diktieren synchronisieren.

1. Microsoft-Entra-Appregistrierung oder vergleichbaren zugelassenen Microsoft-365-Anmeldefluss bereitstellen. Delegierte Graph-Berechtigung `Notes.ReadWrite` benutzen (zusätzliche/scopeschärfere Berechtigung nur falls tatsächlich nötig). Bei Firmensystemen kann die Zustimmung der IT erforderlich sein.
2. Mit der Benutzeridentität Notebook → Abschnitt → Seitenliste lesen. Zielseite nach konkretem Tagesdatum und **exaktem** Seitentitel auswählen, z. B. `Für Montag den 12.10.2026`. Wenn mehrere Seiten passen: Benutzer muss explizit auswählen.
3. Nur vom Benutzer **bestätigte** Einträge zum Versand anbieten, vor der Übertragung Vorschau und eindeutigen **An OneNote anhängen**-Knopf anzeigen.
4. Microsoft Graph: `PATCH https://graph.microsoft.com/v1.0/me/onenote/pages/{id}/content` mit `[{"target":"body","action":"append","content":"<div><h2>Dispo-Assistent – neue Meldungen</h2><p>…</p></div>"}]`. Texte in HTML sicher escapen. Keine vorhandenen Tabellen ersetzen.
5. Schreibversuche mit eigener ID protokollieren, damit bei Verbindungsabbruch nicht derselbe Eintrag doppelt angehängt wird. Nach erfolgreicher Rückmeldung Seite erneut laden und sichtbar bestätigen.

Microsoft-Doku:
- https://learn.microsoft.com/en-us/graph/onenote-update-page
- https://learn.microsoft.com/en-us/graph/api/page-update?view=graph-rest-1.0
- https://learn.microsoft.com/en-us/graph/api/section-list-pages?view=graph-rest-1.0

Die aktuelle Funktion **Bestätigte für OneNote kopieren** ist ein bewusst manueller Zwischenschritt. Sie schreibt nichts auf Microsoft-Server.
