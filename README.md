# SCHUNK PORTAL 1.0

Webbasiertes Betriebsportal für die Design Tischlerei Schunk.

## Enthalten

- Supabase Auth Login ohne persistente Browser-Sitzung
- echter Adminbereich für Mitarbeiter, Rollen, individuelle Rechte, Login-E-Mail, Passwort-Reset und Sperren
- Kundenverwaltung
- Baustellenakten mit Team, Aufgaben, Notizen, Fotos und Dokumenten
- Arbeitszeiterfassung im 15-Minuten-Raster
- Soll/Ist, Überstunden, Urlaub und Krankheit
- verbindlich gesperrte Mitarbeiterzeiten; Admin-Korrekturen nur mit Korrekturgrund und Revisionsprotokoll
- Tagesrapporte mit mehreren Mitarbeitern
- Fahrt-/Rüstzeit als Bestandteil der Gesamtzeit, nicht zusätzlich aufgeschlagen
- Material mit separaten Feldern Menge / Einheit / Beschreibung
- Kunden- und Mitarbeiterunterschrift direkt per Finger/Stift
- einseitiger PDF-Arbeitsbericht im Schunk-Design mit Original-Logo
- Disposition / Wochenplanung mit serverseitiger Doppelbelegungsprüfung
- Audit-Log
- private Dateispeicherung in Supabase Storage

## Sicherheitsgrundsatz

Fachdaten werden nicht dauerhaft im Browser gespeichert. Es gibt kein `localStorage`, kein `sessionStorage`, keine IndexedDB, keinen Service Worker und keinen Offline-Datencache. Die Login-Sitzung lebt ausschließlich im Arbeitsspeicher der geöffneten Seite; nach Neuladen muss erneut angemeldet werden.

Der Browser hat keinen direkten Zugriff auf die Fachtabellen. Alle Fachdatenzugriffe laufen über serverseitige Next.js-API-Routen. Supabase RLS ist auf allen Fachtabellen aktiv; es werden bewusst keine direkten Browser-Policies angelegt. Der `SUPABASE_SERVICE_ROLE_KEY` darf ausschließlich als serverseitige Vercel-Umgebungsvariable gesetzt werden.

## Schnellstart

Bitte zuerst `INSTALLATION_VERCEL_SUPABASE.md` lesen.


## Version 1.1 – Einsatzbereit
- Zahnrad öffnet die Admin-Einstellungen.
- Browser-Icon/Favicon nutzt das vorhandene Schunk-Logo.
- Rapport-Unterschriften werden im Ablauf deutlich angezeigt.
- Abgeschlossene Rapporte können als PDF heruntergeladen werden.
- Arbeitszeiten können monatsweise als PDF und echte XLSX-Datei exportiert werden.
- Firmendaten und Rapport-Zusatztext sind in den Einstellungen pflegbar.

Vor dem ersten Start von 1.1 in einer bestehenden Datenbank `supabase/002_portal_1_1_migration.sql` einmal im Supabase SQL Editor ausführen.


## Version 1.2.4
- Unverändertes Original-Logo in Portal, Mobilansicht, Login und Rapport-PDF.
- PowerShell-Updateanleitung korrigiert.


## Version 1.3.2
- Admin-Rapportbearbeitung und Verschieben inkl. Änderungsverlauf.
- Unterkategorien umbenennen, leere löschen und belegte sicher archivieren.
- Doppeltes Desktop-Logo korrigiert.


## Version 1.4.0
- Session bleibt nach Reload erhalten.
- Portalnavigation und Rapportansicht an die freigegebene Referenz angenähert.
- Nachrichten, Mängel & Probleme, Aufgaben, Dokumente, Unterkategorien und Auswertungen als zentrale Arbeitsbereiche.
- Admin: Rapport bearbeiten, verschieben und löschen.
- Eigenes Passwort für jeden Benutzer änderbar.


## Version 1.5.0
- Echte Stempeluhr mit Start, Auftrag/Tätigkeit wechseln und Stopp.
- Mitarbeiter können Arbeitszeiten nicht mehr frei eintippen.
- Automatische Pausenregel 15 / 45 Minuten.
- Urlaub und Krankheit mit individueller Sollzeit.
- Zeitübersicht und Export für Woche, Monat und Jahr.
- Auswertungen Gesamt oder je Mitarbeiter.
- Direkte interne Nachrichten Administrator ↔ Mitarbeiter.
- Anklickbare Dashboard-Kennzahlen.
- Aufmaßmodul pro Baustelle/Unterkategorie inklusive Berechnung, Anhängen und PDF.
- Rapporte verwenden bei Mitarbeitern die laufende Stempeluhr; die geplante Auftrags-Endzeit kann vor der Unterschrift festgelegt werden.


## Version 1.6.0
- Freie Rapporte/Kleinaufträge ohne vorher angelegte Baustelle.
- Freie Kundendaten und Admin-Funktion „Als Kunde übernehmen“.
- Rapportbilder bleiben im Portal und werden nicht ins PDF übernommen.
- Erweiterte Aufgaben mit Bildern und Mitarbeiter-Kommentaren.
- Nachrichten mit Anhängen und Ungelesen-Zähler.
- Erweiterter Kalender mit Bildern, Bearbeiten durch Mitarbeiter und Löschen nur durch Admin.
- Neuer Hauptmenüpunkt Bestellungen mit Admin-Kennzeichnung neuer Anforderungen.
