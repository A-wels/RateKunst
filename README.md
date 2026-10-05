<p align="center">
  <img src="assets/icon.png" width="200" />
</p>

# RateKunst

RateKunst ist ein Spiel für Android. Die Spieler müssen möglichst schnell Antworten finden, welche zu den genannten Themen passen.
Die App enthält zehn vorgefertigte Themenpacks sowie eigene Sets. Oberfläche und
integrierte Packs stehen vollständig auf Deutsch und Englisch zur Verfügung.
Alle eingebauten Packs verwenden dieselbe bilinguale Datenstruktur. Beim ersten
Start erscheint eine überspringbare Spielanleitung, die im Menü erneut geöffnet
werden kann. Die Oberfläche verwendet schlichte Listen und beschriftete Aktionen;
Fragen und Buchstabengruppen werden an ihre Anzeigebereiche angepasst.

## Verfügbarkeit

Die neue Android-App verwendet die Paket-ID `de.awels.ratekunst` und wird zunächst
über interne Tests in Google Play verteilt. Sie ist eine eigenständige App mit
eigenem Speicher; Daten der bisherigen Installation werden nicht automatisch übernommen.
Alternativ kann man sich die App selbst mit dem hier verfügbaren Code erstellen :)

## Entwicklung

```bash
npm ci
node scripts/patch-react-native-gradle-plugin.js
npm run typecheck
npm run lint
npm test -- --runInBand
```

## Interne Tests veröffentlichen

Jeder Push auf `main` validiert die App, baut ein signiertes Android App Bundle und
veröffentlicht es mit Status `completed` im Google-Play-Track `internal` für
`de.awels.ratekunst`. Version-Codes werden automatisch aus der Workflow-Laufnummer
gebildet. Signierte AABs stehen für 30 Tage als GitHub-Actions-Artefakte zur Verfügung,
auch wenn der anschließende Play-Upload fehlschlägt.

Diese Repository-Secrets unter **Settings → Secrets and variables → Actions** setzen:

| Secret | Inhalt |
| --- | --- |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | Neuer Upload-Keystore als Base64 (`base64 -w 0 ratekunst-upload.jks`) |
| `ANDROID_UPLOAD_KEY_ALIAS` | Alias des privaten Upload-Schlüssels |
| `ANDROID_UPLOAD_KEY_PASSWORD` | Passwort des Upload-Schlüssels |
| `ANDROID_UPLOAD_STORE_PASSWORD` | Passwort des Keystores |
| `PLAY_SERVICE_ACCOUNT_JSON` | Vollständiger JSON-Key des Service-Accounts, ohne Base64-Kodierung |

### Einmalige Einrichtung der neuen Play-App

1. Eine neue RateKunst-App in der Play Console anlegen und Play App Signing verwenden.
2. Einen neuen Upload-Key erzeugen und die vier Signing-Secrets oben setzen.
3. Nach dem Merge in `main` unter **Actions → Publish Google Play internal test → Run workflow**
   einen signierten Build starten. **Upload to internal testing** deaktiviert lassen;
   dafür ist noch kein Play-Service-Account-Secret erforderlich.
4. Die AAB aus dem Artefakt `ratekunst-internal-<versionCode>` herunterladen und den
   ersten internen Test-Release manuell in der Play Console hochladen und ausrollen.
   Damit wird `de.awels.ratekunst` für API-Uploads registriert. Solange die Play-App
   noch im Entwurfszustand ist, kann die API keinen `completed`-Release erstellen.
5. Die Google Play Android Developer API aktivieren, den Service-Account unter
   **Nutzer und Berechtigungen** für die neue App einladen und die Berechtigung zur
   Veröffentlichung auf Test-Tracks erteilen. `PLAY_SERVICE_ACCOUNT_JSON` setzen.
6. Der nächste Push auf `main` veröffentlicht automatisch einen internen Test-Release.
   Manuelle Workflow-Läufe können mit aktiviertem **Upload to internal testing**
   ebenfalls veröffentlichen.

Ein Push auf `main` vor Abschluss der Einrichtung kann beim Play-Upload fehlschlagen.
Der signierte Build bleibt als Artefakt verfügbar, sofern die erforderlichen Secrets
vorhanden sind. Offene Einrichtungsschritte werden in [`TODO.md`](TODO.md) gepflegt.
