# SCHUNK PORTAL 1.6.0 – Update

## 1. Supabase
Im SQL Editor genau diese Migration ausführen:

    supabase/025_portal_1_6_0.sql

Danach muss `Success. No rows returned` erscheinen.

## 2. Projektdateien
Den vollständigen Inhalt dieses Ordners in den bestehenden Git-Arbeitsordner kopieren und vorhandene Dateien ersetzen.

## 3. Git
```powershell
cd "$HOME\Downloads\Schunk-Portal-Git"
Remove-Item .\tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
git status
git add .
git commit -m "SCHUNK PORTAL 1.6.0"
git pull --rebase origin main
git push origin main
```

Bei einem Rebase-Konflikt nicht pushen.

## 4. Neue Funktionen prüfen
- Mitarbeiter: freier Rapport/Kleinauftrag über laufende Stempeluhr „Kleinauftrag / freie Tätigkeit / Betrieb“
- freie Kundendaten im Rapport
- Admin: „Als Kunde übernehmen“
- Rapportbilder im Portal; nicht im PDF
- Aufgaben: erstellen/bearbeiten, Beschreibung, Zuständigkeit, Fälligkeit, Bilder, Kommentare; Löschen nur Admin
- Nachrichten: MA schreiben/antworten, Anhänge, Ungelesen-Zähler im Menü
- Kalender: MA erstellen/bearbeiten, Bilder, Beschreibung/Ort, deutlichere Startzeit; Löschen nur Admin
- Bestellungen: Anzahl, Einheit, Beschreibung, Baustelle/Unterkategorie, Status, Bilder; neuer Menüpunkt und Admin-Zähler
