# SCHUNK PORTAL 1.4.1 – Update

## Supabase

Für Version 1.4.1 ist keine neue Datenbankstruktur erforderlich.

Wenn Version 1.4.0 bereits mit dem vollständigen Supabase-Stand läuft, muss in Supabase nichts geändert werden.

## Windows PowerShell

Im festen Git-Arbeitsordner:

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull --rebase origin main

Danach die Dateien aus dem entpackten Ordner
`Schunk_Portal_1.4.1_bearbeitet_2026-08-11`
in `Schunk-Portal-Git` kopieren und vorhandene Dateien ersetzen.

Dann:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.4.1"
    git pull --rebase origin main
    git push origin main

Falls beim zweiten `git pull --rebase origin main` Konflikte auftreten:
nicht pushen, sondern die Konfliktausgabe prüfen.

## Änderungen 1.4.1

- Mobile Bottom-Navigation repariert.
- Alle verfügbaren Navigationspunkte werden horizontal scrollbar angezeigt.
- Rapportliste auf Smartphones nicht mehr als breite Desktop-Tabelle.
- Rapporte werden mobil als übersichtliche Karten dargestellt.
- Unterkategorie, Baustelle, Datum und Status sind ohne horizontales Scrollen lesbar.
- Der Rapport-Listenabruf ist von optionalen Mitarbeiter-/Baustellenoptionen getrennt.
- Ein Fehler beim Laden optionaler Auswahldaten erzeugt nicht mehr pauschal den Fehler über der funktionierenden Rapportliste.
- Desktop-Ansicht bleibt unverändert.
