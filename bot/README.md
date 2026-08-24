# Dixie inventory bot

Publishes vehicle listings to the site by committing markdown + photos to this
repo. GitHub Actions rebuilds and deploys, so the bot never touches the website
directly — it only writes files.

No npm dependencies. Node 20.6+ (uses native `fetch` and `--env-file`).

## Setup

1. **Bot token** — talk to [@BotFather](https://t.me/BotFather), `/newbot`.
2. **Your user ID** — message [@userinfobot](https://t.me/userinfobot). This is
   the allowlist; without it anyone who finds the bot could publish to the lot.
3. **GitHub token** — a [fine-grained PAT](https://github.com/settings/personal-access-tokens)
   scoped to *only this repo*, Repository permissions → Contents: Read and write.
4. `cp .env.example .env`, fill it in, then:

```bash
cd bot
npm start
```

It refuses to start if anything is missing or the GitHub token can't write.

`.env` is gitignored. Keep it that way — this repo is public and auto-deploys.

## Commands

| Command | What it does |
| --- | --- |
| `/newcar 2015 Honda Civic EX, 98k miles, FWD, $9,500` | Start a draft. Read the echo — it validates shape, not truth. |
| *(send photos)* → `/next` | Attach photos. `/next` alone skips them. |
| *(send text)* or `/skip` | Description. |
| `/add` | Publish. One commit, one deploy. |
| `/edit price 7500` | Change a draft field, then re-preview. |
| `/reset` | Discard the draft. |
| `/inventory` | Numbered list of what's for sale. `all` / `sold` to widen. |
| `/sold 3` | Mark sold (confirms by name first). |
| `/price 3 7500` | Change price on a live listing. |

## Notes

- Nothing is downloaded or committed until `/add`, so `/reset` is free.
- `/sold` and `/price` numbers resolve against the last `/inventory` **you were
  shown**, and always confirm by name — a stale number can't sell the wrong car.
- Marking sold sets `status: sold` rather than deleting, so the URL and its
  search ranking survive. The sitemap and llms.txt already demote sold cars.
- Photos sent normally are compressed by Telegram to ~1280px. Send as *file*
  for full resolution.
- Live listing edits rewrite a single front-matter line, leaving the rest of the
  file — including your comments — untouched.
