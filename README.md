# Team Configurator (web app)

Splits players into teams for several training rounds so that everyone plays with as many
different team mates as possible, repeated pairings are rare and teams are balanced in strength.
A phone-friendly, installable web app (PWA) based on the original Python CLI.

- **Local only:** all data stays in the browser on the device. No server, no account, no tracking.
  The production build sets a Content Security Policy that forbids requests to other hosts.
- **Sharing:** player lists and plans are exchanged as CSV files (send via WhatsApp, Signal, mail…),
  readable and editable in Excel/Numbers. Plain spreadsheets with Name/Position/Strength columns
  can be imported too.
- **Languages:** English and German (`src/lib/i18n.svelte.ts`).
- **Configurable positions** per player list, **manual swaps** after generation, **locked rounds**.

## Development

```sh
npm install
npm run dev      # dev server
npm test         # unit tests (engine checked against the Python reference values)
npm run check    # type check
npm run build    # production build in dist/
```

`tests/fixtures/reference.json` holds values computed by the original Python code
(`scripts/export_reference_fixtures.py`).

## Deploying to GitHub Pages

1. Create a repository on GitHub and push this folder (`git remote add origin …; git push -u origin main`).
2. In the repository: *Settings → Pages → Build and deployment → Source: GitHub Actions*.
3. Every push to `main` runs the tests, builds and deploys
   (`.github/workflows/deploy.yml`). The app is then at `https://<user>.github.io/<repo>/`.
