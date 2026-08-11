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
