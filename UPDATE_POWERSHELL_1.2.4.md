# Schnellupdate SCHUNK PORTAL 1.2.4 – PowerShell

Nicht im entpackten Versionsordner `git init` ausführen.

    cd "$HOME\Downloads\Schunk-Portal-Git"
    git pull origin main

Dann die entpackten 1.2.4-Dateien in diesen Ordner kopieren.

Anschließend:

    git status
    git add .
    git commit -m "SCHUNK PORTAL 1.2.4"
    git push origin main

Kein `npm install`.
Kein `git remote add origin`.
Kein `git push --force`.
Keine Markdown-Zeichen wie ` ```bash ` in PowerShell.
Für 1.2.4 ist kein Supabase-SQL nötig.
