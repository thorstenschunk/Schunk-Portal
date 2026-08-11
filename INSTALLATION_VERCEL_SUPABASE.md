# SCHUNK PORTAL 1.2.4 – Update unter Windows PowerShell

Diese Anleitung ist ausschließlich für Windows PowerShell geschrieben.

Wichtig:
- Niemals ` ```bash ` oder ` ``` ` in PowerShell eingeben.
- Für dieses Update ist lokal kein `npm install` nötig. Vercel installiert die Pakete.
- Nicht in jedem neuen ZIP-Ordner `git init` ausführen. Das erzeugt unnötige Rebase-Konflikte.
- Kein `git push --force` verwenden.
- Für Version 1.2.4 ist keine neue Supabase-SQL-Migration erforderlich.

## Empfohlener Update-Weg

### 1. GitHub-Repository sauber verwenden

In PowerShell:

    cd "$HOME\Downloads"

Falls noch kein Arbeitsordner existiert:

    git clone https://github.com/thorstenschunk/Schunk-Portal.git Schunk-Portal-Git

Dann:

    cd "$HOME\Downloads\Schunk-Portal-Git"

Falls der Ordner bereits existiert:

    git pull origin main

### 2. 1.2.4-Dateien in den Git-Ordner kopieren

Die ZIP entpacken.

Beispiel:

    Copy-Item -Path "C:\Users\Boss\Downloads\Schunk_Portal_1.2.4_bearbeitet_2026-08-11\Schunk_Portal_1.2.4_bearbeitet_2026-08-11\*" -Destination "C:\Users\Boss\Downloads\Schunk-Portal-Git" -Recurse -Force

Danach:

    cd "C:\Users\Boss\Downloads\Schunk-Portal-Git"

### 3. Git-Identität korrekt setzen

    git config --global user.name "Thorsten Schunk"
    git config --global --replace-all user.email "thorstenschunk@googlemail.com"

Prüfen:

    git config --global user.name
    git config --global --get-all user.email

Erwartet:

    Thorsten Schunk
    thorstenschunk@googlemail.com

Keine Markdown-Links wie `[adresse](mailto:adresse)` als E-Mail eintragen.

### 4. Änderungen hochladen

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.2.4"
    git push origin main

Wenn `nothing to commit, working tree clean` erscheint, wurden die 1.2.4-Dateien nicht in den Git-Arbeitsordner kopiert.

Wenn `fetch first` erscheint:

    git pull --rebase origin main

Bei einem Konflikt nicht raten und kein `--force` verwenden.

## Vercel

Nach erfolgreichem

    git push origin main

deployt Vercel automatisch neu.

Im Vercel-Dashboard prüfen:
- Projekt: `Schunk-Portal`
- Branch: `main`
- Status: `Ready`

## Supabase

Für Version 1.2.4 ist kein neues SQL erforderlich.

Die bestehenden Environment Variables bleiben:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Änderungen in 1.2.4

- exakt das hochgeladene Original-Logo
- Desktop-Portal: Original-Logo
- mobile Ansicht: Original-Logo
- Login: Original-Logo
- Rapport-PDF: Original-Logo
- Browser-Icon verweist auf das Originalbild
- keine Datenbankänderung

## Test nach Deployment

1. Desktop öffnen und mit `Strg + F5` neu laden.
2. Mobil neu laden.
3. Prüfen, ob das schwarz/rote Original-Logo oben erscheint.
4. Abgeschlossenen Rapport öffnen.
5. `Rapport als PDF` anklicken.
6. Prüfen, ob im PDF dasselbe Original-Logo erscheint.


## Version 1.2.5
Keine Supabase-SQL-Änderung erforderlich.

Logo-Verwendung:
- Login: dunkler Hintergrund + bisheriges weiß/rotes Logo
- eingeloggtes Portal Desktop: dunkler Kopf + weiß/rotes Logo
- eingeloggtes Portal mobil: dunkler Kopf + weiß/rotes Logo
- Browser-Icon/Favicon: schwarz/rotes Original-Logo
- Rapport-PDF: ausschließlich das hochgeladene QR-/Schunk-Kopfband auf weißem Hintergrund

Update weiterhin nur im festen Git-Arbeitsordner `Schunk-Portal-Git`.


## Version 1.2.6
- Rapport-PDF: doppelten Titel/Rapportnummer entfernt.
- QR-/Schunk-Kopfband bleibt unverändert oben.
- ARBEITSBERICHT steht nur einmal direkt unter dem Kopfband.
- Vertikale Abstände korrigiert, damit Unterschriften, Rechtstext und Footer nicht kollidieren.
- Keine Supabase-SQL-Änderung erforderlich.


## Version 1.2.7

Vor dem Deployment einmal im Supabase SQL Editor ausführen:

    supabase/007_portal_1_2_7.sql

Danach die Portal-Dateien wie gewohnt in den festen Ordner `Schunk-Portal-Git` kopieren und:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.2.7"
    git pull --rebase origin main
    git push origin main

Änderungen:
- Administration lädt Mitarbeiter unabhängig von optionalem Audit-/Rechte-Fehler.
- Mitarbeiter mobil als Karten statt breiter Tabelle.
- Sperren/Entsperren direkt unter „Verwalten“.
- Passwort neu setzen.
- Personalnummer und Wochenstunden pflegen.
- Letzter Login und Status bleiben sichtbar.
- Aktuelle Baustellen je Mitarbeiter sichtbar.
- Desktop: kein doppeltes Logo im oberen Kopf.
- Baustellen: Angebote, Aufmaße, Pläne/Zeichnungen, Fotos und sonstige Dokumente.
- Sichtbarkeit je Datei: Nur Admin / Büro + Admin / gesamtes Baustellenteam / ausgewählte Mitarbeiter.


## Version 1.3.0 – Bereiche, Mängel, Probleme und Baustellenmeldungen

Vor dem Deployment im Supabase SQL Editor einmal vollständig ausführen:

    supabase/008_portal_1_3_0.sql

Danach im festen Git-Arbeitsordner `Schunk-Portal-Git` die Dateien der Version 1.3.0 hineinkopieren und in PowerShell:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.3.0"
    git pull --rebase origin main
    git push origin main

Neu:
- frei anlegbare Bereiche/Gewerke pro Baustelle
- Mängel, Probleme, Noch zu erledigen und Nachrichten an Thorsten
- Priorität einschließlich „Dringend“
- Zuständigkeit und Frist
- Fotos/Anhänge direkt je Eintrag
- Mängelfotos getrennt in „Vorher“ und „Erledigt“
- Antworten/Verlauf je Meldung
- Dashboard für dringende Mängel/Probleme und offene Nachrichten
- automatische Zuordnung von Ersteller und Zeitstempel


## Version 1.3.1 – echte Unterkategorien

Wenn Version 1.3.0 noch NICHT produktiv eingespielt wurde, im Supabase SQL Editor nur diese eine Datei ausführen:

    supabase/010_portal_1_3_1_complete.sql

Sie enthält die Migrationen aus 1.3.0 und 1.3.1 zusammen.

Wenn `008_portal_1_3_0.sql` bereits erfolgreich ausgeführt wurde, reicht:

    supabase/009_portal_1_3_1.sql

Danach im festen Git-Arbeitsordner `Schunk-Portal-Git` die Dateien von 1.3.1 hineinkopieren und in PowerShell:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.3.1"
    git pull --rebase origin main
    git push origin main

Neu in 1.3.1:
- Unterkategorien sind echte zweite Ebene innerhalb einer Baustelle.
- Beispiel: BV Müller > Türen / Trockenbau / Boden / Sonderleistungen.
- Jede Unterkategorie hat eigene Rapporte, Arbeitszeiten, Material, Dokumente, Mängel, Probleme, To-dos und Nachrichten.
- Beim Rapport wird nach der Baustelle die Unterkategorie ausgewählt.
- Beim Abschluss des Rapports werden die Mitarbeiterstunden automatisch derselben Unterkategorie zugeordnet.
- Materialpositionen des Rapports werden ebenfalls derselben Unterkategorie zugeordnet.
- Baustellendokumente können einer Unterkategorie zugeordnet werden.
- Bestehende Daten ohne Zuordnung bleiben unter "Allgemein".


## Version 1.3.2 – Admin-Rapportkorrekturen & Unterkategorien verwalten

### Supabase

Wenn 1.3.1 bereits läuft und `010_portal_1_3_1_complete.sql` erfolgreich ausgeführt wurde, im Supabase SQL Editor nur diese Datei ausführen:

    supabase/011_portal_1_3_2.sql

Wenn du nicht sicher bist, ob 1.3.0/1.3.1 vollständig in Supabase ausgeführt wurden, verwende stattdessen einmal:

    supabase/012_portal_1_3_2_complete.sql

Die komplette Migration ist idempotent aufgebaut und löscht keine bestehenden Rapporte, Kunden oder Baustellen.

### Windows PowerShell / Git

Wichtig: Weiterhin ausschließlich den festen Git-Arbeitsordner verwenden. Nicht im neu entpackten ZIP-Ordner `git init` ausführen.

Zuerst den GitHub-Stand aktualisieren:

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull --rebase origin main

Danach die entpackten Dateien von 1.3.2 in `Schunk-Portal-Git` kopieren.

Anschließend:

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.3.2"
    git push origin main

Kein `git push --force`.
Kein neues `git init`.
Kein neues `git remote add origin`.
Kein lokales `npm install` erforderlich.

### Änderungen in 1.3.2

- Desktop: das Logo erscheint nicht mehr doppelt; das Logo im oberen Kopf wird nur mobil angezeigt.
- Admin kann Unterkategorien umbenennen.
- Leere Unterkategorien können entfernt werden.
- Unterkategorien mit vorhandenen Rapporten, Stunden, Material, Dokumenten, Aufgaben oder Meldungen werden beim Entfernen automatisch archiviert, damit keine Projektdaten verloren gehen.
- Admin kann jeden Rapport über „Bearbeiten / Verschieben“ einer anderen Baustelle und Unterkategorie zuordnen.
- Admin kann auch bereits verbindlich abgeschlossene Rapporte nachträglich bearbeiten.
- Änderbar sind Datum, Kunde, Arbeitsbeschreibung, Bemerkungen, Abschlussstatus, Mitarbeiterzeiten und Material.
- Ein Änderungsgrund ist bei jeder Admin-Korrektur Pflicht.
- Jede Admin-Korrektur wird mit Benutzer, Zeitpunkt sowie Vorher-/Nachher-Daten protokolliert.
- Bei abgeschlossenen Rapporten werden die bereits übernommenen Arbeitszeiten automatisch mit der neuen Baustelle/Unterkategorie und den korrigierten Zeiten synchronisiert.
- Nach einer Admin-Korrektur wird das Rapport-PDF automatisch neu erzeugt.
- Frühere PDF-Dateien bleiben im Dateispeicher als Historie erhalten.


## Version 1.4.0

Für das Update auf 1.4.0 bitte die separate Datei `INSTALLATION_1.4.0.md` verwenden.
Sie enthält den aktuellen Ablauf für Supabase, PowerShell, GitHub und die Prüfung nach dem Deployment.


## Version 1.4.1
Für dieses Fehlerkorrektur-Update bitte `INSTALLATION_1.4.1.md` verwenden. Keine zusätzliche Supabase-Schemaänderung erforderlich.


## Version 1.4.3
Für dieses Update bitte `INSTALLATION_1.4.3.md` verwenden. Keine neue Supabase-Migration erforderlich.
