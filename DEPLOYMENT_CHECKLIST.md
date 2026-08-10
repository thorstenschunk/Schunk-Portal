# Deployment-Checkliste – SCHUNK PORTAL 1.0

## Vor dem ersten Deployment

- [ ] Neues bzw. dafür vorgesehenes Supabase-Projekt verwenden.
- [ ] `supabase/001_portal_schema.sql` im Supabase SQL Editor vollständig ausführen.
- [ ] Ersten Benutzer unter Supabase Auth anlegen.
- [ ] Danach `select public.bootstrap_admin('ADMIN-EMAIL');` im SQL Editor ausführen.
- [ ] Privaten Bucket `schunk-private` in Supabase prüfen (wird vom SQL-Skript angelegt).
- [ ] GitHub-Repository enthält den kompletten Projektinhalt, jedoch keine `.env`-Datei.
- [ ] In Vercel die drei Environment Variables aus `.env.example` setzen.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` niemals als `NEXT_PUBLIC_...` Variable anlegen.

## Vercel

Build Command: `npm run build`

Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Nach dem ersten erfolgreichen Deployment:

- [ ] Admin-Login testen.
- [ ] Mitarbeiter anlegen und Mitarbeiterrolle vergeben.
- [ ] Mit Mitarbeiterkonto anmelden und Rechtebegrenzung prüfen.
- [ ] Testkunde und Testbaustelle anlegen.
- [ ] Foto/Dokument hochladen und auf zweitem Gerät öffnen.
- [ ] Arbeitszeit im 15-Minuten-Raster erfassen.
- [ ] Arbeitszeit verbindlich sperren und Änderungsverbot prüfen.
- [ ] Rapport mit zwei Mitarbeitern, Material und beiden Unterschriften erstellen.
- [ ] Rapport abschließen; anschließend Bearbeitung als Mitarbeiter testen.
- [ ] Rapport-PDF erzeugen und prüfen.
- [ ] Doppelbelegung in der Disposition testen.
- [ ] Audit-Log kontrollieren.

## Vor Verwendung mit echten Betriebsdaten

Den vollständigen `TESTPLAN.md` durchführen. Datenschutz-, Aufbewahrungs- und arbeitsrechtliche Prozesse des Betriebs zusätzlich fachlich prüfen lassen.
