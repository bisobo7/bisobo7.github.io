# Dixie Auto Land — live site (dixieauto.land)

Astro 5 site for dixieauto.land (see `SPEC.md` for the full redesign spec).
The old one-page site is archived in `legacy-v1/` for reference only.

## Run it

```bash
npm install
npm run dev        # local dev at localhost:4321
npm run build      # production build to dist/
```

## Add a vehicle (the 5-minute version)

1. Copy any file in `src/content/vehicles/` and rename it `year-make-model-trim.md`
   (the filename becomes the URL slug).
2. Edit the front-matter fields. Omit `price` to show "Call for price".
3. Drop photos in `public/images/vehicles/` and list the filenames in `photos:`.
   First photo is the card/hero image. No photos → branded placeholder.
4. Commit. The site rebuilds and the car gets its own page at `/inventory/<slug>/`
   with Vehicle schema for Google rich results.

Mark a car `status: sold` to badge it (leave it up ~30 days for SEO, then delete)
or `status: pending`.

**The three current listings are SAMPLES — replace them before going live.**

## Before launch (checklist)

- [ ] Replace sample vehicles with real inventory + real photos
- [ ] Get a free access key at https://web3forms.com and paste it into
      `src/data/business.js` (`web3formsKey`) — until then forms won't deliver
- [ ] Confirm the phone number in `src/data/business.js` (see SPEC.md §12 — 989 vs 586)
- [ ] Verify the geo pin coordinates against Google Business Profile
- [ ] In GitHub repo settings → Pages, set Source to **GitHub Actions**
      (move `deploy-workflow.yml` to `.github/workflows/deploy.yml` first)

## Where things live

- `src/data/business.js` — NAP, hours, phone: the single source of truth
- `src/content/vehicles/` — one markdown file per car
- `src/styles/` — SCSS (v1 design tokens carried over in `_variables.scss`)
- `src/layouts/BaseLayout.astro` — head, AutoDealer schema, Clarity, header/footer
- `public/images/` — brand SVGs + compressed dealership photos

The `_to_delete_v2_emptyshell/` folder is safe to delete.
