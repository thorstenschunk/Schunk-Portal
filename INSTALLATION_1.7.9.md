# SCHUNK PORTAL 1.7.9 – Build-Bugfix

Korrigiert:
- Fehlender React-Import `useRef` in `app/baustellen/page.tsx`.
- Dadurch kompiliert die neue Dateiauswahl im Aufmaß nicht mehr mit
  `Cannot find name 'useRef'` ab.

Die vollständige Ein-Schritt-Aufmaßfunktion aus 1.7.8 bleibt enthalten:
Aufmaßdaten und mehrere Fotos/PDFs in derselben Maske auswählen und mit
„Alles speichern“ gemeinsam anlegen bzw. hochladen.

Keine neue Supabase-Migration erforderlich.
