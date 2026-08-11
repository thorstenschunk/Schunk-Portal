# SCHUNK PORTAL 1.4.2 – Update

Diese Version enthält alle Änderungen aus 1.4.1 plus die korrigierte mobile Navigation.

## Supabase
Keine neue Datenbankmigration erforderlich.

## PowerShell

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull --rebase origin main

Dann die Dateien aus dem entpackten Ordner
`Schunk_Portal_1.4.2_bearbeitet_2026-08-11`
in `Schunk-Portal-Git` kopieren und vorhandene Dateien ersetzen.

Danach:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.4.2"
    git pull --rebase origin main
    git push origin main

Falls beim Rebase Konflikte auftreten: nicht pushen, sondern zuerst die Konflikte lösen.

## Enthalten
- Mobile Rapportliste als Karten
- Rapport-Abruf robuster gegen optionale Zusatzdaten
- Mobile Navigation jetzt senkrecht als aufklappbares Seitenmenü
- Menübutton oben links
- Menü schließt beim Seitenwechsel automatisch
- Desktop bleibt unverändert
