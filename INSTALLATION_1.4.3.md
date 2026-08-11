# SCHUNK PORTAL 1.4.3 – Update

## Supabase

Für 1.4.3 ist keine neue Datenbankmigration erforderlich.

Der Fehler beim Öffnen von Rapporten wurde im API-Code behoben. Es wird nicht mehr versucht,
über den nicht vorhandenen Foreign-Key `work_reports_created_by_fkey` auf `profiles` zuzugreifen.

## Windows PowerShell

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull --rebase origin main

Danach die Dateien aus
`Schunk_Portal_1.4.3_bearbeitet_2026-08-11`
in `Schunk-Portal-Git` kopieren und vorhandene Dateien ersetzen.

Anschließend:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.4.3"
    git pull --rebase origin main
    git push origin main

Falls beim Rebase Konflikte auftreten: nicht pushen, sondern zuerst die Konflikte lösen.

## Änderungen 1.4.3

- Konkreter Fix für Vercel/Supabase-Fehler PGRST200 beim Öffnen eines Rapports.
- Ersteller des Rapports wird separat über `created_by` geladen.
- Admin-Änderungsverlauf lädt Bearbeiternamen ebenfalls ohne FK-Hint.
- „Material & Lager“ aus Navigation und Portal entfernt.
- „Unterkategorien“ nicht mehr als eigener Menüpunkt.
- Unterkategorien bleiben ausschließlich innerhalb der jeweiligen Baustelle.
- Senkrechte mobile Navigation aus 1.4.2 bleibt erhalten.
- Mobile Rapportkarten und die Fehlerkorrekturen aus 1.4.1 bleiben erhalten.
