# SCHUNK PORTAL 1.6.2 – Update

Enthalten:
- Kalenderzeit ohne +2-Stunden-Verschiebung
- Mehrfachauswahl für Bilder/Anhänge
- Bildvorschau in Kalender, Nachrichten und Bestellungen
- Unterkategorien nur noch innerhalb der Baustellen; Hauptmenüeintrag entfernt
- Material & Lager vollständig aus dem Portal entfernt
- Auto-Logout nach 60 Minuten Inaktivität
- Arbeitstag starten / Feierabend direkt auf dem Dashboard
- Rapporte laufen unabhängig von der Stempeluhr weiter
- Mitarbeiter erfassen im Rapport konkrete Von-/Bis-Zeiten
- Pausen werden nur von der Stempeluhr abgezogen
- Summe der Rapportzeiten darf die verfügbare gestempelte Nettoarbeitszeit nicht überschreiten

Für diese Änderungen ist keine neue Supabase-Migration vorgesehen.

Deployment:
1. Dateien der Version 1.6.2 in den Git-Arbeitsordner kopieren und vorhandene Dateien ersetzen.
2. `git add .`
3. `git commit -m "SCHUNK PORTAL 1.6.2"`
4. `git pull --rebase origin main`
5. Bei konfliktfreiem Rebase: `git push origin main`
