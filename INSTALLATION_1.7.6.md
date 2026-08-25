# SCHUNK PORTAL 1.7.6 – kumulatives Update

Diese Version enthält vollständig die Änderungen aus 1.7.3 bis 1.7.6.

Neu in 1.7.6:
- Zugewiesene Mitarbeiter können direkt in ihrer Baustellenakte Bilder, PDFs, Pläne, Aufmaße und sonstige Dateien hochladen.
- Mitarbeiter-Uploads erhalten serverseitig automatisch die Sichtbarkeit „Baustellenteam“.
- Mitarbeiter können keine Dateiberechtigungen manipulieren; Admin/Büro kann Freigaben weiterhin nachträglich ändern.
- Strukturierte Aufmaße können von zugewiesenen Mitarbeitern erstellt und geöffnet werden.
- Im Aufmaß gibt es einen eigenen Bereich „Dateien & Fotos zum Aufmaß“.
- Dort können mehrere Fotos, PDF-Aufmaße, Skizzen und Zeichnungen gleichzeitig ausgewählt und hochgeladen werden.
- Bilder im Aufmaß werden direkt als Vorschau angezeigt und lassen sich groß öffnen.
- PDFs und andere Anhänge lassen sich direkt aus dem Aufmaß öffnen.
- Sichtbarkeitsregeln werden auch bei Aufmaß-Anhängen serverseitig berücksichtigt.

Keine neue Supabase-Migration erforderlich gegenüber 1.7.5.
Die Migration `supabase/026_portal_1_7_0.sql` muss weiterhin einmalig ausgeführt worden sein.
