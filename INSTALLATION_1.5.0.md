# SCHUNK PORTAL 1.5.0 – Installation / Update

## 1. Supabase

Version 1.5.0 benötigt neue Datenbanktabellen für:
- Stempeluhr
- interne Nachrichten
- Aufmaße

Wenn der Datenbankstand 1.4.x sicher vollständig installiert ist, im Supabase SQL Editor einmal ausführen:

    supabase/016_portal_1_5_0.sql

Wenn nicht sicher ist, welche älteren Migrationen bereits ausgeführt wurden, stattdessen verwenden:

    supabase/017_portal_1_5_0_complete.sql

Die Komplettmigration enthält den benötigten Datenbankstand bis 1.5.0.

## 2. Projektdateien aktualisieren

Festen Git-Arbeitsordner verwenden:

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull --rebase origin main

Danach den Inhalt des entpackten Ordners

    Schunk_Portal_1.5.0_bearbeitet_2026-08-11

in `Schunk-Portal-Git` kopieren und vorhandene Dateien ersetzen.

Nicht die ZIP-Datei selbst in das Repository legen.

## 3. Commit und Push

    cd "$HOME\Downloads\Schunk-Portal-Git"
    Remove-Item .\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.5.0"
    git pull --rebase origin main

Wenn der Rebase ohne Konflikt durchläuft:

    git push origin main

Wenn Konflikte gemeldet werden: nicht pushen. Zuerst die Konflikte lösen.

Nicht verwenden:

    git init
    git remote add origin ...
    git push --force

## 4. Vercel

Nach dem erfolgreichen Push startet Vercel das Deployment automatisch.

Nach dem Deployment Browser einmal vollständig neu laden.

## 5. Funktionsprüfung

### Stempeluhr
1. Als Mitarbeiter einloggen.
2. Zeiterfassung öffnen.
3. Baustelle und ggf. Unterkategorie wählen.
4. `Arbeitstag starten`.
5. Prüfen, dass keine freie Eingabe der Startzeit für Mitarbeiter möglich ist.
6. Andere Baustelle auswählen und `Auftrag / Tätigkeit wechseln`.
7. Prüfen, dass der vorherige Auftrag automatisch endet und der neue beginnt.
8. `Feierabend / Stopp` drücken.
9. Prüfen, dass die Zeitbuchungen automatisch erstellt wurden.

Automatische Pausenregel:
- bis 5,5 Stunden: 15 Minuten
- ab 5,5 Stunden: 45 Minuten
- vorgesehene Pausenfenster: 09:30–09:45 und 12:30–13:00

### Rapport
1. Während eine Baustelle in der Stempeluhr läuft, als Mitarbeiter einen Rapport erstellen.
2. Baustelle und Unterkategorie müssen aus der laufenden Stempeluhr kommen.
3. Mitarbeiter legt nur die geplante Auftrags-Endzeit fest.
4. Beispiel: Rapport wird beim Kunden 15:00 unterschrieben, geplante Auftrags-Endzeit 16:00.
5. Stempeluhr läuft bis Rückfahrt/Ausladen beendet sind weiter.
6. Rapport darf keine zusätzliche doppelte Arbeitszeitbuchung erzeugen.

### Urlaub / Krankheit
1. Zeiterfassung → `Urlaub / Krankheit`.
2. Mitarbeiter kann Urlaub oder Krankheit selbst buchen.
3. Pro Montag–Freitag wird automatisch Wochenstunden ÷ 5 als Sollzeit gutgeschrieben.

### Übersicht / Export
Prüfen:
- Woche
- Monat
- Jahr
- PDF
- Excel

### Auswertungen
Als Admin:
- Gesamt – alle Mitarbeiter
- einzelnen Mitarbeiter auswählen
- Arbeitsstunden
- Rapporte
- Mängel
- Probleme
- Aufgaben
- Nachrichten

### Nachrichten
Als Mitarbeiter:
- Neue Nachricht erstellen.
- Empfänger ist automatisch der Administrator.

Als Admin:
- Neue Nachricht erstellen.
- Mitarbeiter als Empfänger auswählen.
- Antworten und `Als geklärt markieren` prüfen.

Mitarbeiter können keine direkten Nachrichten an andere Mitarbeiter senden.

### Dashboard
Prüfen, dass die Kacheln anklickbar sind:
- Aktive Baustellen
- Arbeitszeit heute
- Offene Rapporte
- Offene Aufgaben
- Dringende Meldungen
- Nachrichten

### Aufmaß
1. Baustelle öffnen.
2. Tab `Aufmaß`.
3. Neues Aufmaß erstellen.
4. Typen prüfen: Fenster, Türen, Möbel, Fläche, Umfang, Freies Aufmaß.
5. Unterkategorie zuordnen.
6. Positionen mit Länge/Breite/Höhe und Anzahl erfassen.
7. Fläche und Umfang werden automatisch berechnet.
8. Fotos/Skizzen/PDF anhängen.
9. Aufmaß-PDF erzeugen.

## 6. Grundlogik Arbeitszeit

- 5-Tage-Woche Montag bis Freitag.
- Wochenstunden werden je Mitarbeiter individuell aus dem Profil verwendet.
- Tages-Sollzeit = individuelle Wochenstunden ÷ 5.
- Mitarbeiter können Arbeitszeiten nicht frei eintippen oder nachträglich verändern.
- Manuelle Zeitnachträge bleiben nur Admin/Korrekturberechtigten vorbehalten.
- Zeitstempel der Stempeluhr stammen serverseitig vom System.
- Eine Baustellenzuordnung läuft weiter, bis der Mitarbeiter aktiv wechselt oder Feierabend drückt.
- Rückfahrt, Ausladen und unmittelbar auftragsbezogene Nacharbeit bleiben dadurch beim aktuellen Auftrag.
