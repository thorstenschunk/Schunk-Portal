# Abnahmetest SCHUNK PORTAL 1.0

Vor echten Firmendaten einmal vollständig in dieser Reihenfolge testen:

1. Admin anmelden.
2. Testmitarbeiter anlegen.
3. Als Testmitarbeiter anmelden; Administration darf nicht sichtbar sein.
4. Kunde und Baustelle anlegen.
5. Testmitarbeiter der Baustelle zuweisen.
6. Als Mitarbeiter Baustelle öffnen und Foto hochladen.
7. Browser neu laden: erneute Anmeldung muss erforderlich sein.
8. Nach Login: Foto muss weiterhin serverseitig vorhanden sein.
9. Arbeitszeit z. B. 07:00–15:30, Pause 30 min, Fahrt/Rüst 60 min erfassen. Gesamt muss 8:00 h sein, nicht 9:00 h.
10. Zeit verbindlich speichern. Mitarbeiter darf sie danach nicht ändern können.
11. Admin-Korrektur testen; Korrekturgrund muss erforderlich sein.
12. Urlaub/Krankheit anlegen und Monatsübersicht prüfen.
13. Rapport mit zwei Mitarbeitern und mehreren Materialzeilen anlegen.
14. Kunde und Mitarbeiter auf Tablet/Handy unterschreiben lassen.
15. Rapport verbindlich abschließen. Danach darf keine Bearbeitung mehr möglich sein.
16. PDF erzeugen und prüfen: Kundendaten, beide Mitarbeiter, Zeiten, Material, Bemerkung und Unterschriften.
17. Disposition: Mitarbeiter doppelt im selben Zeitraum einplanen. Zweite Planung muss abgewiesen werden.
18. Benutzer sperren. Anmeldung muss danach von der API abgewiesen werden.
19. Audit-Log auf die vorgenannten Aktionen prüfen.
