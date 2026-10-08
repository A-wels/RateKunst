<p align="center">
  <img src="assets/icon.png" width="200" />
</p>

# RateKunst

RateKunst ist ein Spiel für Android. Die Spieler müssen möglichst schnell Antworten finden, welche zu den genannten Themen passen.
Die App enthält zehn vorgefertigte Themenpacks sowie eigene Sets. Oberfläche und
integrierte Packs stehen vollständig auf Deutsch und Englisch zur Verfügung.
Die Packs enthalten insgesamt 922 Fragen pro Sprache. Die Themen reichen von
Alltag und Essen bis zu Fantasy, Spielen und schwarzem Humor. Neue Fragen sollen
viele mögliche Antworten zulassen und überwiegend ohne spezielles Fachwissen
oder Kenntnis einzelner Serien und Spiele funktionieren.
Alle eingebauten Packs verwenden dieselbe bilinguale Datenstruktur. Beim ersten
Start erscheint eine überspringbare Spielanleitung, die im Menü erneut geöffnet
werden kann. Die Oberfläche verwendet schlichte Listen und beschriftete Aktionen;
Fragen und Buchstabengruppen werden an ihre Anzeigebereiche angepasst.

## Darstellung und Einstellungen

Unter **Einstellungen** stehen **System**, **Hell** und **Dunkel** zur Auswahl.
Standardmäßig folgt die gesamte Oberfläche dem Gerätedesign und reagiert auch
während der Nutzung auf Änderungen. Eine manuelle Auswahl wird lokal gespeichert.
Beim ersten Start folgt die Sprache der Gerätesprache: Deutsch für deutsche
Gerätesprachen, sonst Englisch. Die Auswahl wird gespeichert und bleibt bei
späteren Änderungen der Gerätesprache erhalten. Die Sprache lässt sich in den
Einstellungen ändern; der DE/EN-Schalter bleibt im Menü.
Die native React-Native-Oberfläche verwendet Material-Farbrollen mit warmen
Pfirsich-/Orange-Akzenten und eigenen Hell-/Dunkel-Paletten, einschließlich der
Navigation, Eingaben, Spielansicht, Auswahldialoge und Spielanleitung.

## Werbung und Werbefrei-Kauf

Banner erscheinen außerhalb aktiver Runden. Nach jeder zweiten abgeschlossenen
Runde wird beim Wechsel zurück ins Menü ein Interstitial angezeigt, sofern eines
bereitsteht. Der einmalige Google-Play-Kauf `remove_ads` entfernt sämtliche
Werbung dauerhaft und kann in den Einstellungen wiederhergestellt werden.
Die Android-Mindestversion ist mit dem aktuellen AdMob-SDK Android 7.0 (API 24).
Produkt, AdMob-IDs, Einwilligungsnachrichten und Store-Angaben müssen vor dem
produktiven Einsatz eingerichtet werden; ohne AdMob-IDs läuft Testwerbung.
Die vollständige Einrichtung einschließlich app-ads.txt steht in
[docs/monetization.md](docs/monetization.md).

## Verfügbarkeit

Die neue Android-App verwendet die Paket-ID `de.awels.ratekunst` und wird zunächst
über interne Tests in Google Play verteilt. Sie ist eine eigenständige App mit
eigenem Speicher; Daten der bisherigen Installation werden nicht automatisch übernommen.
Alternativ kann man sich die App selbst mit dem hier verfügbaren Code erstellen :)

## Entwicklung

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
```

Die Tests prüfen Spielabläufe, Navigation, Speicherung, Darstellung sowie Werbung
und Käufe. Bei Fragen prüfen sie spielbare, duplikatfreie Packs und die Zuordnung
zwischen Deutsch und Englisch. Feste Formulierungen und interne Komponentenstrukturen
werden nicht als eigenständige Anforderungen getestet.

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

### Current Android release toolchain

React Native 0.87.1 / React 19.2.3, Node 24, JDK 17, Android compile SDK 36
(target 36), NDK 27.1.12297006 and Gradle 9.4.1. CI checks the actual AAB's
64-bit ELF LOAD segment alignment for 16 KB devices and the merged manifest's
ad-free startup configuration. The legacy Gradle patch and Flipper were removed.

The single bilingual privacy source is `docs/RateKunst-privacy-policy.html`.
Run `python3 scripts/generate-privacy-policy.py` after editing it; CI verifies the
offline app copy is in sync. The in-app policy is always reachable from Settings.
Publishing the HTML at the configured Play/AdMob privacy URL remains a website
owner action. See TODO.md for the device and Play Console production checks.
