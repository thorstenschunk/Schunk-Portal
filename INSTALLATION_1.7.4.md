# SCHUNK PORTAL 1.7.4 – kumulatives Update

Diese ZIP enthält vollständig die Änderungen aus 1.7.3 und 1.7.4. Version 1.7.3 muss vorher nicht installiert werden.

Enthalten aus 1.7.3:
- echte Bildvorschau in der Baustellenakte
- Rapportbilder für zugewiesene Baustellenmitarbeiter öffnbar
- Rapport bleibt separat geschützt

Neu in 1.7.4:
- Datei-/Bildberechtigungen nachträglich ändern
- Sichtbarkeit: Admin, Büro + Admin, Baustellenteam, ausgewählte Mitarbeiter
- Freigaben werden beim Anzeigen und Öffnen serverseitig geprüft
- Rapportbilder respektieren diese Freigaben auch in der Baustellenakte
- Aufgaben vollständig mit Titel, Beschreibung, Baustelle, Unterkategorie, Zuständigkeit, Fälligkeit, Priorität und Status bearbeitbar
- Bilder/PDFs an Aufgaben anhängen und als Vorschau anzeigen
- Berechtigungen von Aufgaben-Anhängen nachträglich ändern
- Kommentare/Verlauf bleiben erhalten

Keine neue Supabase-Migration erforderlich gegenüber 1.7.3.
Die Migration `supabase/026_portal_1_7_0.sql` muss weiterhin einmalig ausgeführt worden sein.
