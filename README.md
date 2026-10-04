# Rental Inspection

[![CI](https://github.com/QuickCasa/rental-inspection/actions/workflows/ci.yml/badge.svg)](https://github.com/QuickCasa/rental-inspection/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

A free, open source move-in and move-out inspection app. Walk through a
rental on your phone, rate each room, add notes and photos, collect
signatures and download a PDF report that shows when every photo was added
and every signature was made. It works offline, there's no account, and
nothing leaves the device.

**[Start an inspection](https://quickcasa.github.io/rental-inspection/)**

## What it does

- **A checklist for each room.** A new inspection starts with six common
  rooms and their usual items, and 14 room types can be added, from a laundry
  room to a garage. Every room and item can be renamed, added or removed.
  Each item is rated good, fair, poor or not applicable, with notes and
  photos.
- **Photos.** Taken or picked on the phone, then scaled down to 1600 pixels
  and saved as a JPEG on the device. Saving them again drops the location and
  camera details phones store in a photo. The report numbers every photo and
  shows when it was added.
- **Signatures.** The landlord or agent and each tenant sign on the screen.
  The first signature locks the report, so nobody signs one version and gets
  another. Editing a signed report clears every signature. Anyone who didn't
  sign in the app gets lines to sign the printed PDF.
- **Move-out comparison.** Start a move-out from a move-in inspection and
  every item shows its move-in rating and notes. The report lists everything
  rated worse than at move-in, and the keys handed over at each.
- **The PDF report.** Built on the device: the details, anything that needs a
  look, a checklist for each room, the tenant's comments, the signatures and
  when each was made, then every photo with a caption. Times are shown in the
  time zone the inspection started in, whatever device opens it.
- **Backup files.** One file holds an inspection and its photos, to move it to
  another device or keep it safe. Opening one adds a new copy.
- **Works offline.** After the first visit, a service worker keeps the app and
  its PDF builder on the device.

## Before you rely on it

Some provinces and states have their own inspection form, or rules about when
an inspection happens and who has to be there. Check your local rules. The
report records a rental's condition. It isn't legal advice.

A PDF isn't tamper-proof, because anyone with a PDF editor can change one.
Send the signed PDF to everyone who signed it on the day, so each person
holds the same copy.

## Privacy

- The app has no server side, no analytics and no account. It's static files
  on GitHub Pages.
- Inspections and photos are stored in the browser on the device, in
  IndexedDB. Clearing browsing data deletes them, so download the PDF and save
  a backup file of every inspection you need to keep.
- The app asks the browser to keep its storage when the device runs low on
  space. Browsers decide for themselves.
- PDFs are built in the browser by [jsPDF](https://github.com/parallax/jsPDF).

## Known limits

- An inspection lives on one device. There's no syncing, so use a backup file
  to move one.
- Browsers limit how much each site can store, and the limit depends on the
  browser and the free space. If a photo can't be saved, the app says so. Save
  backup files of finished inspections, then delete them from the app to make
  room.
- The PDFs use the fonts built into every PDF reader, which cover Western
  European alphabets only. Other characters, including emoji, print as `?`.
- Pages are US Letter size, the standard in Canada and the US.

## Hosting your own copy

The app is static files. `npm run build` writes them to `site/`, and any web
server can host that folder. It needs HTTPS for the offline support, because
browsers only run service workers on secure sites and on localhost.

The app is licensed under the GNU AGPL. If you change it and let other people
use your changed version, you have to offer them its source code. The source
link in the page footer is the easy way: point it at your copy's source.

## Development

You need Node.js 22 or later.

```bash
npm install
npm run dev       # serves the app with live reload, without the service worker
npm run check     # format, typecheck, tests, lint and build
npm run preview   # serves the production build, service worker included
```

The app is plain TypeScript with no framework, in `app/`. The PDF layout is in
`app/pdf/`. The service worker is `app/service-worker/sw.ts`, built as a
second entry with its own `tsconfig.json`. At build time,
`build/service-worker-plugin.ts` writes the list of files to keep offline into
it, so each deploy gets a fresh cache, and the app offers the new version with
an "Update now" banner.

Tests run in Node and build real PDFs with jsPDF, then check the text in them.
To test offline support, run `npm run build && npm run preview`, open the app,
stop the server and reload.

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Licence

[GNU Affero General Public License v3.0 only](LICENSE). Copyright QuickCasa
Lead Management Incorporated. Built and maintained by
[QuickCasa](https://quickcasa.ai) in Kitchener, Ontario.
