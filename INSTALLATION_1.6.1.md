# SCHUNK PORTAL 1.6.1 – Build-Fix

Diese Version enthält ausschließlich die Funktionen aus 1.6.0 plus die Korrektur des TypeScript-Buildfehlers in:

`app/api/files/upload-url/route.ts`

## Supabase
Keine zusätzliche Migration erforderlich, wenn `025_portal_1_6_0.sql` bereits erfolgreich ausgeführt wurde.

## PowerShell
Die Dateien aus diesem Ordner in den bestehenden Git-Arbeitsordner kopieren und vorhandene Dateien ersetzen.

```powershell
cd "$HOME\Downloads\Schunk-Portal-Git"
Remove-Item .\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
git status
git add .
git commit -m "SCHUNK PORTAL 1.6.1"
git pull --rebase origin main
git push origin main
```

Falls beim Rebase Konflikte auftreten: nicht pushen.
