# SCHUNK PORTAL 1.4.0 – Installation / Update

## 1. Supabase zuerst

Wenn der Datenbankstand 1.3.2 bereits vollständig läuft:

- Für 1.4.0 ist keine zusätzliche Schemaänderung nötig.
- Optional kann `supabase/013_portal_1_4_0.sql` ausgeführt werden. Die Datei verändert keine Fachdaten.

Wenn nicht sicher ist, ob die Migrationen 1.3.0 bis 1.3.2 vollständig ausgeführt wurden:

1. Supabase öffnen.
2. SQL Editor öffnen.
3. Inhalt von `supabase/014_portal_1_4_0_complete.sql` vollständig einfügen.
4. Einmal ausführen.

Bestehende Kunden, Baustellen und Rapporte werden dadurch nicht absichtlich gelöscht.

## 2. Empfohlener Git-Weg unter Windows PowerShell

Nicht im neu entpackten Versionsordner `git init` ausführen.

Festen Arbeitsordner verwenden:

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull --rebase origin main

Danach die entpackten Dateien aus `Schunk_Portal_1.4.0_bearbeitet_2026-08-11`
in `Schunk-Portal-Git` kopieren und vorhandene Dateien ersetzen.

Anschließend:

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.4.0"
    git push origin main

Nicht verwenden:

    git init
    git remote add origin ...
    git push --force

Vercel deployt nach dem erfolgreichen Push automatisch.

## 3. Upload über GitHub im Browser

Alternativ können die entpackten Projektdateien über die GitHub-Weboberfläche in den Branch `main`
hochgeladen und vorhandene Dateien ersetzt werden.

Wichtig:
- Nicht nur die ZIP-Datei hochladen.
- Die vorhandene Ordnerstruktur (`app`, `components`, `lib`, `public`, `supabase` usw.) beibehalten.
- Keine `.git`, `node_modules` oder `.next`-Ordner hochladen.
- Commit-Nachricht: `SCHUNK PORTAL 1.4.0`

## 4. Nach dem Vercel-Deployment prüfen

1. Portal öffnen.
2. Einloggen.
3. Browserseite mit F5 neu laden.
4. Der Benutzer muss angemeldet bleiben.
5. Unter `Rapporte` einen bestehenden Rapport öffnen.
6. Als Admin `Bearbeiten / Verschieben` testen.
7. Als Admin die Löschfunktion prüfen – nur mit einem entbehrlichen Test-Rapport.
8. `Nachrichten` öffnen.
9. `Mängel & Probleme` öffnen.
10. `Aufgaben`, `Dokumente`, `Unterkategorien`, `Material & Lager` und `Auswertungen` öffnen.
11. Einstellungen öffnen und eigenes Passwort ändern.
12. Mobil prüfen, ob die Navigation horizontal bedienbar ist.

## Änderungen in 1.4.0

- Login bleibt nach F5 / Seitenaktualisierung erhalten.
- Supabase-Session wird lokal sicher persistiert und automatisch erneuert.
- Navigation und Gesamtaufbau an die freigegebene Portal-Referenz angenähert.
- Zentrale Nachrichtenfunktion mit Antworten, Anhängen und Status.
- Zentrale Mängel-&-Probleme-Ansicht.
- Zentrale Aufgabenansicht.
- Zentrale Dokumentenansicht.
- Zentrale Unterkategorienansicht.
- Materialansicht aus tatsächlich erfassten Rapportmaterialien.
- Projekt-Auswertungen aus tatsächlich vorhandenen Daten.
- Nachrichten-Badge in der Navigation.
- Rapportdetail nach Referenz neu gegliedert.
- Rapport zeigt Fotos, Dokumente, Mängel, Probleme, To-dos und Nachrichten aus derselben Baustelle/Unterkategorie.
- Admin kann Rapporte bearbeiten und verschieben.
- Admin kann Rapporte löschen; Löschgrund ist Pflicht.
- Eigenes Passwort kann jeder angemeldete Benutzer in Einstellungen ändern.
- Doppeltes Desktop-Logo bleibt entfernt.
