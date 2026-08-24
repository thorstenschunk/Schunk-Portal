# SCHUNK PORTAL 1.7.5 – kumulatives Update

Diese Version enthält vollständig die Änderungen aus 1.7.3, 1.7.4 und 1.7.5.

Neu in 1.7.5:
- Aufgaben in einer Baustellenakte verwenden jetzt dieselbe vollständige Aufgabenlogik wie der Hauptmenüpunkt „Aufgaben“.
- Klick auf eine Aufgabe öffnet die vollständige Detailansicht.
- Neue Aufgaben in einer Baustelle werden über eine vollständige Eingabemaske angelegt.
- Titel, ausführliche Beschreibung/Arbeitsauftrag, Unterkategorie, Zuständigkeit, Fälligkeit, Priorität und Status sind erfassbar.
- Admin/Büro kann Aufgaben direkt aus der Baustellenakte bearbeiten.
- Mitarbeiter sehen die vollständigen Aufgabendetails.
- Bilder, Fotos und PDFs können direkt an eine Aufgabe angehängt und als Vorschau angezeigt werden.
- Mitarbeiter können Rückmeldungen/Kommentare zur Aufgabe ergänzen.
- Dateifreigaben für Aufgaben-Anhänge können weiterhin nachträglich verwaltet werden.
- Die bisherige vereinfachte Schnellaufgabe in der Baustellenakte wurde ersetzt.

Keine neue Supabase-Migration erforderlich gegenüber 1.7.4.
Die Migration `supabase/026_portal_1_7_0.sql` muss weiterhin einmalig ausgeführt worden sein.
