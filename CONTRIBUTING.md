# Contributing

Thanks for wanting to help. Bug reports about a PDF that comes out wrong, or
a photo or signature that won't save, are the most useful contribution, and so
are rooms and items that real inspections need.

## Rules for changes

- **Nothing leaves the device.** No analytics, no uploads, no third-party
  requests beyond loading the app's own files. A change that adds a network
  request won't be merged.
- **Every field stays optional.** An inspection that's half done still makes
  a PDF.
- **A signed report can't change.** Signatures cover what was on the screen
  when people signed. Any new field that ends up in the PDF has to be locked
  once someone signs, the same way the existing ones are.
- **Saved data is untrusted.** Anything read from the browser's storage or a
  backup file goes through `app/normalize-inspection.ts`, and backup photos
  through `app/backup-file.ts`, before the app uses it. Keep new fields in
  there too.
- **Backup files keep working.** If the backup format changes, raise
  `BACKUP_VERSION` in `app/constants.ts` and keep reading the older versions.
  Someone will open a move-in backup a year from now to start the move-out.
- **No legal claims.** Default rooms, items and wording stay plain and common
  to most rentals. Anything that depends on the province or state belongs in
  what the person types, not the defaults.

## Getting set up

You need Node.js 22 or later.

```bash
npm install
npm run dev
npm run check
```

`npm run check` runs everything CI runs: the formatting check, both
typechecks, the tests, ESLint and the production build. Code follows
[@quickcasa/eslint-config](https://github.com/QuickCasa/eslint-config), and
Prettier formats everything. Run `npm run format` before committing.

For a change to the PDF, add a test in `test/pdf.test.ts` that checks the new
text is there, and look at the PDF itself in a real reader before opening the
pull request. For a change to offline support, run
`npm run build && npm run preview`, open the app, stop the server and reload.

## Licence of contributions

The project is licensed under the GNU AGPL v3.0 only, and contributions are
accepted under the same licence.

## Deploying

Every push to `main` that passes CI deploys the app to GitHub Pages. There's
no package to release.
