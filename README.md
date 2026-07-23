# devcard — GitHub Profile Visualizer

A reimagined GitHub profile viewer built for the Cloud Computing Cell (AKGEC) frontend task.
Plain HTML / CSS / vanilla JavaScript — no frameworks, no build step, no charting libraries.

## Run it locally

No installation needed. Any static file server works:

```bash
cd github-profile-visualizer
python3 -m http.server 8080
# then open http://localhost:8080
```

Or just double-click `index.html` (fetch calls to the GitHub API work fine from `file://` too,
though a local server is recommended for consistent behavior across browsers).

## Deploy

This is a static site (`index.html`, `styles.css`, `app.js`) — drag the folder into
[Vercel](https://vercel.com/new), [Netlify Drop](https://app.netlify.com/drop), or push it to a
repo and enable **GitHub Pages** in the repo settings (Settings → Pages → deploy from `main`).
No environment variables or build commands are required.

## What it does

- Type any GitHub username and it fetches live data — profile, repositories, and languages —
  from the public GitHub REST API (`api.github.com`). No hardcoded/mock data anywhere.
- **Identity panel**: avatar, name, bio (typed out character-by-character), location/company/blog,
  join date, and follower/following/repo/gist counts.
- **Language footprint**: a hand-built SVG donut chart (raw `<circle>` elements with
  `stroke-dasharray` math — no Chart.js/Recharts/etc.) showing the language mix across a
  developer's repos, with a legend and percentages.
- **Top repositories**: the 6 highest-starred repos as interactive cards (stars, forks, primary
  language, description), each linking out to GitHub.
- **Compare mode**: toggle to look up two developers side by side.
- **Dark/light theme toggle**: re-themes the entire UI (not just the background) using CSS custom
  properties.
- Smooth, animated transitions between loading → loaded states and between searches (no hard cuts).
- Fully responsive layout (desktop / tablet / mobile).

## API resilience — the heavily-weighted part

- **Nonexistent username** → GitHub returns `404`; the UI shows a friendly "user not found" state,
  never a blank screen or console error.
- **Zero public repos** → charts and repo grid degrade gracefully with an explanatory message
  instead of breaking.
- **Rate limiting** (`403` + `X-RateLimit-Remaining: 0`) → detected explicitly via response
  headers, with a banner telling the user how many minutes until the limit resets.
- **Network failures / slow responses** → wrapped in `try/catch`; shown as a distinct "network
  error" state rather than an infinite spinner.
- **Rate-limit-aware design**: instead of calling the expensive `/repos/{owner}/{repo}/languages`
  endpoint for every repository (which would burn through the 60 req/hr unauthenticated limit fast
  on accounts with many repos), the app only fetches detailed byte-level language data for the top
  8 most-starred repos and falls back to each repo's single reported primary language for the rest.
  If even those calls get rate-limited, the chart still renders from the primary-language fallback
  data rather than failing.
- A tiny in-memory request cache avoids re-fetching the same endpoint twice in one session.

## Design system

The visual language follows `DESIGN-supabase.md`: white canvas with a single emerald green
(`#3ecf8e`) accent reserved for primary actions, near-black text on the green CTA (not white),
6px "square-ish" button radii, Inter at weight 500 with tight letter-spacing for display type, and
flat 1px-hairline cards with restrained shadows rather than gradients. Dark mode swaps the palette
tokens (`canvas-night` / `on-dark`) without changing structure.


## Notes / honest limitations

- The GitHub contribution heatmap (green grid) and "export as image" stretch goals were left out
  of this submission — the heatmap requires either GitHub's GraphQL API (needs an auth token, which
  conflicts with the "no hardcoded credentials, unauthenticated client-only" constraint) or scraping
  `github.com/users/{user}/contributions`, which GitHub does not serve with CORS headers for
  browser fetches. Rather than fake it, it's documented here as a known gap.
- "Private/restricted profile" edge cases are handled the way the public REST API actually exposes
  them (suspended/removed accounts surface as `404`); there's no separate "private profile" flag in
  the API for the client to detect beyond that.
