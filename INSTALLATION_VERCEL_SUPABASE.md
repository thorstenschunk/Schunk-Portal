# Installation: GitHub + Vercel + Supabase

Diese Anleitung setzt kein eigenes Serverwissen voraus.

## 1. Projekt zu GitHub hochladen

Repository: `https://github.com/thorstenschunk/Schunk-Portal.git`

ZIP entpacken. Danach PowerShell im entpackten Ordner öffnen und ausführen:

```powershell
git init
git branch -M main
git remote add origin https://github.com/thorstenschunk/Schunk-Portal.git
git add .
git commit -m "SCHUNK PORTAL 1.0"
git push -u origin main
```

Falls Git nach einem Login fragt, über GitHub anmelden. Geheimnisse niemals in GitHub hochladen. `.env.local` ist deshalb in `.gitignore` enthalten.

## 2. Supabase-Datenbank einrichten

1. Supabase-Projekt öffnen.
2. Links `SQL Editor` → `New query`.
3. Datei `supabase/001_portal_schema.sql` öffnen.
4. Den **gesamten Inhalt** kopieren und in den SQL Editor einfügen.
5. `Run` drücken.
6. Erwartetes Ergebnis: `Success. No rows returned`.

Das SQL legt Tabellen, Rollen, Rechte und den privaten Storage-Bucket `schunk-private` an.

## 3. Ersten Administrator anlegen

1. Supabase → `Authentication` → `Users`.
2. `Add user`.
3. Deine Firmen-E-Mail und ein starkes Passwort eintragen.
4. Benutzer direkt als bestätigt anlegen.
5. Danach SQL Editor öffnen und ausführen:

```sql
select public.bootstrap_admin('DEINE-EMAIL@BEISPIEL.DE');
```

Die Bootstrap-Funktion ist für normale Benutzer/RPC-Aufrufe gesperrt und kann nicht aus dem Portal heraus missbraucht werden.

## 4. Supabase-Schlüssel ermitteln

Supabase → Project Settings → API.

Benötigt werden:

- Project URL
- Publishable/Anon Key
- Service Role Key

Der Service Role Key ist hochsensibel. Er wird ausschließlich in Vercel gesetzt und niemals in eine Datei im GitHub-Repository eingetragen.

## 5. Vercel-Projekt erstellen

1. Bei Vercel mit GitHub anmelden.
2. `Add New` → `Project`.
3. Repository `Schunk-Portal` auswählen.
4. Framework sollte automatisch als Next.js erkannt werden.
5. Unter `Environment Variables` folgende Werte eintragen:

```text
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_PUBLISHABLE_ODER_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=DEIN_SERVICE_ROLE_KEY
```

6. Environment jeweils für `Production`, `Preview` und bei Bedarf `Development` setzen.
7. `Deploy` klicken.

## 6. Erster Login

Nach erfolgreichem Deployment die Vercel-Adresse öffnen und mit dem in Schritt 3 angelegten Administrator anmelden.

Im Menü muss `Administration` sichtbar sein. Dort weitere Mitarbeiter anlegen und Rollen/Rechte vergeben.

## 7. Mitarbeiter anlegen

Administration → `Mitarbeiter anlegen`.

Erfasst werden:

- Name
- Login-E-Mail
- Personalnummer
- Telefon
- Wochenstunden
- Urlaubsanspruch
- Rolle
- Startpasswort (mindestens 10 Zeichen)

Bestehende Passwörter können aus Sicherheitsgründen nie angezeigt werden. Administratoren können nur ein neues Passwort setzen.

## 8. Domain `portal.t-schunk.de` anbinden (optional)

In Vercel → Project → Settings → Domains → `portal.t-schunk.de` hinzufügen.

Vercel zeigt den benötigten DNS-Eintrag. Diesen beim Domainanbieter von `t-schunk.de` eintragen. Danach stellt Vercel HTTPS automatisch bereit.

## 9. Updateprozess

Jede Änderung wird zuerst lokal/GitHub geprüft und danach in `main` gepusht. Vercel deployt automatisch den neuen Stand.

Keine Änderungen direkt in Supabase-Produktivtabellen vornehmen, wenn nicht ausdrücklich vorgesehen. Schemaänderungen künftig als neue SQL-Migrationsdatei versionieren.

## 10. Lokaler Test (optional)

Dafür muss Node.js LTS installiert sein.

```powershell
copy .env.example .env.local
npm install
npm run verify
npm run typecheck
npm run dev
```

`.env.local` mit echten Supabase-Werten befüllen. Die Datei niemals committen.
