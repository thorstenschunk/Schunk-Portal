# SCHUNK PORTAL 1.7.1 – Bugfix

Bugfix für den Next.js/TypeScript-Buildfehler im Dashboard:

`Type 'unknown' is not assignable to type 'ReactNode'`

Ursache:
Die Summe der benutzerspezifischen Neu-Zähler wurde über `Object.values(unseen)` berechnet. TypeScript hat die Werte dabei als `unknown` behandelt.

Korrektur:
Die Neu-Zähler werden jetzt explizit als `Record<string, number>` typisiert und als Zahl summiert.

Keine neue Supabase-Migration erforderlich.

Deployment:
1. Dateien der Version 1.7.1 in den Git-Arbeitsordner kopieren.
2. `git add .`
3. `git commit -m "SCHUNK PORTAL 1.7.1"`
4. `git pull --rebase origin main`
5. Wenn konfliktfrei: `git push origin main`
