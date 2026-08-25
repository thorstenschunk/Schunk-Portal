# SCHUNK PORTAL 1.7.10 – kumulatives Update

Enthält vollständig alle Änderungen bis einschließlich 1.7.10.

Neu in 1.7.10:

## iPhone / iPad – Dateien zuverlässig öffnen
- Geschützte Bilder, PDFs und Dokumente werden beim Antippen sofort in einem neuen Browserfenster vorbereitet.
- Erst danach wird die geschützte Supabase-URL geladen.
- Dadurch blockiert Safari das Öffnen nicht mehr als nachträgliches Popup.
- Wenn iOS kein neues Fenster zulässt, wird die Datei als Fallback im aktuellen Tab geöffnet.
- Die zentrale Öffnungslogik wird in Dokumenten, Baustellen, Aufgaben, Mängeln/Problemen, Rapportbildern und weiteren Anhängen verwendet.
- Die Dateien bleiben geschützt; es werden keine öffentlichen Storage-URLs verwendet.

## Rapporte nach Feierabend
- Mitarbeiter können auch nach „Feierabend / Ausstempeln“ noch Rapporte für den aktuellen Tag erstellen.
- Voraussetzung ist nur, dass für den aktuellen Tag ein Arbeitstag über die Stempeluhr vorhanden ist.
- Die Summe der Netto-Rapportzeiten darf weiterhin die bereits gestempelte Nettoarbeitszeit nicht überschreiten.
- Auch offene mehrtägige Rapporte können am aktuellen Tag nach dem Ausstempeln weitergeführt werden.
- Vergangene Tage bleiben für Mitarbeiter unveränderbar.

Keine neue Supabase-Migration erforderlich.
