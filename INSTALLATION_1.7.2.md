# SCHUNK PORTAL 1.7.2 – Bugfix

Korrigiert:
- `reportDayId` ist jetzt korrekt im Props-Typ des `FileUploader` definiert.
- Dadurch kann die Rapportseite Bilder einem Tagesabschnitt zuordnen, ohne TypeScript-Buildfehler.

Keine neue Supabase-Migration erforderlich gegenüber 1.7.1.
Die Migration `supabase/026_portal_1_7_0.sql` aus Version 1.7.0 muss weiterhin einmalig ausgeführt worden sein.
