# SCHUNK PORTAL 1.7.7 – kumulativer Bugfix

Enthält vollständig 1.7.3 bis 1.7.7.

Korrektur Aufmaß:
- Der Datei-/Fotoupload ist bei bestehenden Aufmaßen direkt auch über „Bearbeiten“ erreichbar.
- Nach dem erstmaligen Speichern eines neuen Aufmaßes öffnet sich automatisch dessen Detailansicht mit dem Uploadbereich.
- Mehrere Bilder und PDFs können gleichzeitig ausgewählt werden.
- Fotos werden als Vorschau angezeigt; PDFs/Dateien lassen sich öffnen.
- Zugewiesene Baustellenmitarbeiter dürfen Aufmaß-Anhänge hochladen.

Technischer Grund:
Ein neues Aufmaß besitzt vor dem ersten Speichern noch keine Datenbank-ID. Dateien können deshalb erst nach dem Anlegen eindeutig diesem Aufmaß zugeordnet werden. Der Ablauf führt jetzt automatisch direkt dorthin.

Keine neue Supabase-Migration erforderlich.
