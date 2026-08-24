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

1. **Optimize the photos.** Phone shots are 4–6k px, several MB each, and half of
   them carry an EXIF rotation flag that not every crawler honours. One command
   fixes all of that:

   ```bash
   node scripts/optimize-vehicle-photos.mjs 2009-toyota-fj-cruiser ~/Desktop/fj/*.jpg
   ```

   Pass the photos in the order you want them shown — the first is the card and
   hero shot. The script writes WebP sets (plus one JPEG fallback each) into
   `public/images/vehicles/` and prints the `photos:` block to paste in. It also
   makes a 3:2 crop for the inventory card; if a card crop cuts a vehicle off,
   re-run it with `--focus=0.45` (higher = crop lower in the frame).

2. Copy `src/content/vehicles/2009-toyota-fj-cruiser.md` and rename it
   `year-make-model-trim.md` (the filename becomes the URL slug).

3. Edit the front-matter and paste in the `photos:` block from step 1. Omit
   `price` to show "Call for price". Write the condition notes in the body —
   what was checked, what was replaced, anything a buyer should know. Honest,
   specific notes sell cars and rank pages.

4. Commit. The site rebuilds and the car gets its own page at
   `/inventory/<slug>/` with Vehicle schema for Google rich results, and shows up
   automatically in `/sitemap.xml` and `/llms.txt`.

Mark a car `status: sold` to badge it (leave it up ~30 days for SEO, then delete)
or `status: pending`.

## Before launch (checklist)

- [ ] Get a free access key at https://web3forms.com and paste it into
      `src/data/business.js` (`web3formsKey`) — until then forms won't deliver
- [ ] Confirm the phone number in `src/data/business.js` (see SPEC.md §12 — 989 vs 586)
- [ ] Verify the geo pin coordinates against Google Business Profile
- [ ] In GitHub repo settings → Pages, set Source to **GitHub Actions**
      (move `deploy-workflow.yml` to `.github/workflows/deploy.yml` first)

## Where things live

- `src/data/business.js` — NAP, hours, phone: the single source of truth
- `src/content/vehicles/` — one markdown file per car
- `scripts/optimize-vehicle-photos.mjs` — phone JPEGs → responsive WebP sets
- `src/styles/` — SCSS (v1 design tokens carried over in `_variables.scss`)
- `src/layouts/BaseLayout.astro` — head, AutoDealer schema, Clarity, header/footer
- `public/images/` — brand SVGs + compressed dealership photos

The `_to_delete_v2_emptyshell/` folder is safe to delete.
