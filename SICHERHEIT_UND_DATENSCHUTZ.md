# Sicherheit und Datenschutz – technischer Stand

## Technische Maßnahmen

- HTTPS über Vercel
- Authentifizierung über Supabase Auth
- keine persistente Browser-Sitzung
- keine Fachdaten in LocalStorage, SessionStorage oder IndexedDB
- keine PWA-/Offline-Datenspeicherung
- private Supabase-Storage-Buckets
- Dateizugriff nur über zeitlich begrenzte signierte URLs
- Service-Role-Key ausschließlich serverseitig
- Fachtabellen mit RLS und ohne direkte Browser-Policies
- serverseitige Rollen- und Rechteprüfung je API-Request
- individuelles Rechte-Override je Mitarbeiter
- Audit-Log für administrative und fachlich wichtige Änderungen
- gesperrte Arbeitszeiten und Rapporte
- Admin-Korrektur von Arbeitszeiten nur mit Korrekturgrund und Revisionshistorie
- Schutz des letzten aktiven Administrators
- Sicherheitsheader und `Cache-Control: no-store`

## Wichtiger rechtlicher Hinweis

Das Portal stellt technische Funktionen für nachvollziehbare Arbeitszeit- und Baustellendokumentation bereit. Daraus folgt keine juristische Garantie für eine bestimmte Rechtskonformität. Vor Produktiveinsatz sollten insbesondere Datenschutzinformationen für Beschäftigte, Aufbewahrungs-/Löschfristen sowie arbeitsrechtliche Prozesse geprüft und dokumentiert werden.

GPS-/dauerhafte Standortüberwachung ist in Version 1.0 bewusst nicht enthalten.
