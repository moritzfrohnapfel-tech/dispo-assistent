# Dispo-Assistent – v0.9.0 (kostenlose Cloudflare-KI)

**iPhone-App:** https://moritzfrohnapfel-tech.github.io/dispo-assistent/?v=090

**Status:** Die Oberfläche ist auf v0.9.0 aktualisiert und der KI-Servercode ist auf **Cloudflare Workers AI** umgestellt. **Die KI funktioniert erst nach der einmaligen Bereitstellung des Workers in deinem Cloudflare-Konto.** Ohne Worker bleibt der lokale Modus voll funktionsfähig.

## Das funktioniert bereits

- Lokale Erkennung ohne API-Anbieter; mehrere Diktate und getrennte Vorgangskarten
- Bearbeiten, Bestätigen, Exportieren und optional lokal gespeicherte Entwürfe
- Zwischen **„Lokal“** und **„KI kostenlos“** wählen
- KI-Antworten als getrennte, erst zu bestätigende Karten
- Kopieren bestätigter Vorgänge als manueller OneNote-Zwischenschritt

## KI gratis einrichten (Cloudflare Workers AI)

Du brauchst **keinen OpenAI-API-Schlüssel und kein kostenpflichtiges OpenAI-Konto**. Cloudflare Workers AI hat ein tägliches Freikontingent von 10.000 Neurons. Ist es erschöpft, gehen Anfragen im kostenlosen Workers-Tarif nicht mehr durch. Das konkrete Kontingent kann sich ändern; Dashboard beobachten.

### Variante A: Cloudflare-Weboberfläche – auch ohne lokalen PC

1. Gehe zu https://dash.cloudflare.com/ und melde dich an bzw. erstelle ein kostenloses Konto (Free-Plan).
2. Unter **Workers & Pages** einen Worker erstellen, z. B. mit dem Namen `dispo-assistent-api`. Eine anfängliche „Hello World“-Vorlage reicht.
3. Im Worker **Edit Code** öffnen und den vollständigen Code aus [backend/worker.js](backend/worker.js) als **JavaScript-/Module-Worker** einfügen. Änderungen veröffentlichen (**Deploy**).
4. **Wichtig:** Unter den Worker-Einstellungen → **Bindings** → **Add binding** das Produkt **Workers AI** auswählen und die Variable genau **`AI`** nennen. Ohne dieses Binding ist die KI nicht funktionsfähig. Speichern und Worker erneut bereitstellen, falls angefordert.
5. Unter **Settings → Variables and Secrets** ein Secret anlegen:
   - **Name:** `DISPO_ACCESS_TOKEN`
   - **Wert:** ein selbst erzeugtes, langes, zufälliges privates Passwort (mindestens 32 Zeichen)
   - **Typ:** Secret (nicht normaler Text/Variable)
   - **Diesen Wert nicht hier im Chat posten, nicht in GitHub speichern.** Du brauchst ihn später auf deinem iPhone.
6. Falls erforderlich, Worker neu bereitstellen. Unter **Domains & Routes** die `https://…workers.dev`-Adresse kopieren.
7. Öffne die [Dispo-App](https://moritzfrohnapfel-tech.github.io/dispo-assistent/?v=090) und prüfe oben rechts **v0.9.0**. Tippe **„KI kostenlos“ → „KI-Verbindung einrichten“**. Trage die Worker-Adresse (ohne `/health` oder `/api/analyze`) und das private Worker-Passwort ein.
8. **„KI-Server prüfen“** antippen. Es sollte „Server erreichbar und konfiguriert“ angezeigt werden. Danach ein **frei erfundenes Testdiktat** eingeben und auf **„Kostenlos mit KI auswerten“** tippen.
9. Jede einzelne KI-Karte prüfen, bearbeiten und bestätigen. Noch keine automatische Weiterleitung an OneNote.

Wenn **„Server erreichbar, aber … Binding fehlt“** kommt, fehlt meist Schritt 4 (AI-Binding) oder Schritt 5 (Secret). Bei CORS-Fehlern die `ALLOWED_ORIGIN` prüfen: Standardmäßig ist die GitHub-Pages-Adresse `https://moritzfrohnapfel-tech.github.io` erlaubt.

### Variante B: Vom PC mit Wrangler deployen (optional)

Die [wrangler.toml](wrangler.toml) im Repository enthält den benötigten KI-Binding-Eintrag:

```toml
[ai]
binding = "AI"
```

Mit Node.js und Wrangler kann der Worker aus dem Repository bereitgestellt werden:

```sh
npx wrangler login
npx wrangler secret put DISPO_ACCESS_TOKEN
npx wrangler deploy
```

Bei `secret put` niemals den Schlüssel in die Konsole als Befehlsparameter einfügen: Er wird über den interaktiven Prompt eingegeben. In Cloudflare gilt weiterhin das kostenlose Kontingent.

### Technische Daten

- **KI-Modell:** `@cf/meta/llama-3.1-8b-instruct` mit JSON-Mode, über Cloudflare `env.AI.run(...)`.
- **Server-Endpunkte:** `GET /health`, `POST /api/analyze`; `Authorization: Bearer <privates Worker-Passwort>`.
- **Authentifizierung:** Für diesen Einzelbenutzer-Test ein privates Passwort; kein vollwertiges Benutzerverwaltungssystem, keine organisationsweite Zugriffssicherung.
- **Berechnete Texte** gehen im KI-Modus an Cloudflare. Im **lokalen** Modus wird kein Text an diesen KI-Server geschickt.
- Niemals einen Anbieter-API-Schlüssel oder ein Passwort im öffentlichen GitHub-Repo hinterlegen.
- Für echte Mitarbeiter-/Baustellendaten vorher Arbeitgeber- und Datenschutzfreigabe einholen. Cloudflare-/Spracherkennungs-Verarbeitung und Vertragslage sind dafür gesondert zu prüfen.

Offizielle Dokumentation:
- Cloudflare Workers-AI-Binding: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- JSON-Mode: https://developers.cloudflare.com/workers-ai/features/json-mode/
- Freikontingent: https://developers.cloudflare.com/workers-ai/platform/pricing/

## OneNote (noch nicht automatisiert)

Der Button **„Bestätigte für OneNote kopieren“** erzeugt nur einen Text für das manuelle Einfügen, ohne die vorhandene Tagesseite zu verändern.

Später vorgesehen: Microsoft-Konto sicher anmelden (Microsoft Entra / Microsoft Graph mit passenden Zugriffsrechten), korrekte Tagesseite im freigegebenen Notebook finden, die bestätigten Einträge als neuen Abschnitt an den Seiteninhalt anhängen **ohne bestehende Tabellen zu ändern**. Bei mehreren gleichnamigen Seiten muss die richtige Seite bewusst gewählt werden. Vor produktiver Nutzung anhand eines Testnotizbuchs prüfen.

Dokumentation:
- https://learn.microsoft.com/en-us/graph/onenote-update-page
- https://learn.microsoft.com/en-us/graph/api/page-update?view=graph-rest-1.0

## Wichtig

Die App ist ein Prototyp, keine fertig geprüfte Betriebssoftware. KI-Ergebnisse können falsche Zuordnungen enthalten; **Bestätigung und Kontrolle bleiben Pflicht**. Cloudflare-Worker und OneNote-Automatik wurden noch **nicht live** an deinem eigenen Konto getestet.
