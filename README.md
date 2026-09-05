<p align="center">
  <img src="assets/icon.png" width="200" />
</p>

# RateKunst

RateKunst ist ein Spiel für Android. Die Spieler müssen möglichst schnell Antworten finden, welche zu den genannten Themen passen.
Die App enthält zehn vorgefertigte Themenpacks sowie eigene Sets. Oberfläche und
integrierte Packs stehen vollständig auf Deutsch und Englisch zur Verfügung.

## Vefügbarkeit

Es ist möglich, die App im Google Play Store zu kaufen: https://play.google.com/store/apps/details?id=com.RateDepp
Alternativ kann man sich die App selbst mit dem hier verfügbaren Code erstellen :)

## Entwicklung

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
```

## Produktion veröffentlichen

Produktions-Releases sind von `main` getrennt. Ein Push auf den permanenten Branch
`production` validiert die App, baut ein signiertes Android App Bundle und veröffentlicht
es mit Status `completed` vollständig im Google-Play-Track `production`.

Einen geprüften Stand ausschließlich per Fast-Forward veröffentlichen:

```bash
git fetch origin
git switch production
git merge --ff-only origin/main
git push origin production
```

Der letzte Push ist bewusst die Live-Veröffentlichung. Die benötigten Secrets und
einmaligen Play-Console-Schritte stehen in [`TODO.md`](TODO.md).
