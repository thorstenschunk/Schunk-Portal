# SCHUNK PORTAL 1.7.0 – Update

Vor dem Deployment in Supabase einmal ausführen:
`supabase/026_portal_1_7_0.sql`

Neu in 1.7.0:
- Rapportpausen durch Mitarbeiter; Nettozeit wird gegen gestempelte Nettoarbeitszeit geprüft.
- Offene Rapporte können über „Rapport fortführen“ an Folgetagen ergänzt werden.
- Vergangene Tagesabschnitte bleiben für Mitarbeiter unveränderbar.
- Kunden-/Mitarbeiterunterschrift erst beim endgültigen Abschluss.
- Rapportbilder erscheinen während des offenen Rapports zusätzlich in der Baustellenakte; Bildbeschreibung = Arbeitsbeschreibung.
- Kalendertermine können mit bestehenden Kunden verknüpft werden.
- Kundennummern werden manuell vergeben und können Lexware entsprechen.
- Benutzerspezifische rote Neu-Zähler für Rapporte, Bilder, Bestellungen, Nachrichten, Mängel/Probleme, Aufmaße und Aufgaben.
- Neu-Zähler auf Dashboard sowie für zentrale Bereiche in der Hauptnavigation.

Deployment:
1. `supabase/026_portal_1_7_0.sql` im Supabase SQL Editor ausführen.
2. Projektdateien in den Git-Arbeitsordner kopieren und vorhandene Dateien ersetzen.
3. `git add .`
4. `git commit -m "SCHUNK PORTAL 1.7.0"`
5. `git pull --rebase origin main`
6. Bei konfliktfreiem Rebase: `git push origin main`
