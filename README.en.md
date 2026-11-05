<p align="center"><img src="assets/icon-1024.png" width="140" alt="ttalgakverse" /></p>
<p align="center"><img src="assets/wordmark.png" width="520" alt="ttalgakverse" /></p>

<p align="center"><b>A few chat messages and a few clicks (<i>ttalgak!</i>) — your own metaverse.</b><br/>Design the world together through a live interview, walk it with friends without a server, and publish it with one link.</p>
<p align="center"><a href="README.md">한국어</a> · English</p>
<p align="center">Works with Claude Code · Codex (ChatGPT app)</p>

---

Start with one sentence: *"A Seoul walk metaverse — Hangang Park, Seokchon Lake and Gwanghwamun Square."*

While Claude asks you a few questions, **a draft of your world is drawn live in your browser**, then **three 3D mood/colour concepts** appear. Pick one and it becomes a world you can walk around, invite friends into, and publish at `https://<name>.workers.dev`.

- 🎙️ **Interview-driven worldbuilding** — not a fixed template; drafts grow with every answer
- 🔴 **Live preview** — world map and concept mockups update instantly in the browser (phone too); pick one with a button right on the board and Claude continues
- 👥 **Serverless multiplayer** — Supabase Realtime, people in the same zone see each other
- 🚀 **Free to publish** — Cloudflare Workers static assets, optional custom domain
- 🔐 **Always-on secret scanning** — keys, tokens and `.env` files are caught and filtered before every commit, push and deploy
- 🧭 **Resume anywhere** — a doctor skill finds where you left off and what's next

> The bundled example world "Seoul Walk" includes Gwanghwamun, the King Sejong & Admiral Yi statues, Lotte World Tower, Some Sevit islands, Banpo Bridge's rainbow fountain and N Seoul Tower. For real places, Claude looks up photos and matches their silhouettes.

> Distilled from building [Metrobus](https://metrobus.workromancer.ai), a Seoul Subway Line 2 metaverse.

## How to use (video)

| With Claude Code | With ChatGPT (Codex) |
|---|---|
| [![With Claude Code](https://img.youtube.com/vi/78r-6ocGgb0/maxresdefault.jpg)](https://youtu.be/78r-6ocGgb0) | [![With ChatGPT (Codex)](https://img.youtube.com/vi/SA1Y8qC7CoE/maxresdefault.jpg)](https://youtu.be/SA1Y8qC7CoE) |
| [youtu.be/78r-6ocGgb0](https://youtu.be/78r-6ocGgb0) | [youtu.be/SA1Y8qC7CoE](https://youtu.be/SA1Y8qC7CoE) |

> Click a thumbnail to watch on YouTube (Korean).

## Install

Works in both **Claude Code** and **Codex** (including the ChatGPT app).

| | Install |
|---|---|
| **Claude Code** | `/plugin marketplace add workromancer/ttalgakverse` → `/plugin install ttalgakverse@ttalgakverse` |
| **Codex / ChatGPT app** | Add `workromancer/ttalgakverse` as a plugin marketplace and install ttalgakverse |

Then, in an empty folder, say **"I want to build a metaverse"**. The agent replies in your language (Korean or English). In Claude Code you can also run `/metaverse`.

> MCP connections (Supabase, Cloudflare) follow your app's own MCP setup; the skills check the official docs and guide you for the app you use.

## Steps

You don't need slash commands — **just say it in chat** and Claude picks the right skill (or call one directly, e.g. `/metaverse`).

| | Just say | Skill | What it does |
|---|---|---|---|
| 0 | "I want to build a metaverse" | `metaverse` | Guide — checks progress and routes to the next step |
| 1 | "Am I ready?" | `mv-setup` | Node · **Supabase MCP** · **Cloudflare MCP** + wrangler, following the official docs ([Supabase](https://supabase.com/docs/guides/ai-tools/mcp) · [Cloudflare](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/)) — just browser clicks |
| 2 | "Let's design the world" | `mv-worldview` | 🎙️ interview → 🔴 live world drafts (zone map, portals) → pick |
| 3 | "Let's pick the mood", "design my character" | `mv-concept` | 🎙️ mood interview → 🔴 three live 3D concepts → pick or mix → 🧸 your described character built fresh, shown walking on a live board |
| 4 | "Build the world" | `mv-build` | Real world on a three.js engine, run locally (`npm run dev`) |
| 5 | "Let my friends join" | `mv-multiplayer` | Supabase project & keys; people in the same zone see each other |
| 6 | "Deploy it" | `mv-deploy` | Publish to `*.workers.dev` (+ custom domain, + private GitHub repo) |
| 🔁 | "I don't like it", "the building looks off", "polish it" | `mv-polish` | Iterate after it's built — Claude points out weak spots first and asks with concrete options → fixes → before/after → asks again. Structures get a photo-comparison workbench |
| 🩺 | "I'm stuck", "where was I" | `mv-doctor` | Diagnose, fix, and continue projects started elsewhere |

## 🧸 Only the tech stack is fixed

The engine (three.js + Vite), data formats, Supabase multiplayer and Cloudflare deploy stay the same. Characters, buildings and zone effects are **written fresh for each project** from what you describe — "a penguin in a scarf", "a library floating on clouds", "a hill with drifting cherry petals" — as files in `src/avatars/`, `src/props/`, `src/scenes/` that the engine loads automatically. The bunny and Seoul landmarks in the template are examples, not a menu. See [docs/custom-code.md](docs/custom-code.md).

## 🔁 Polish loop

A freshly built world is usually "not bad, but something's off" — and people find it hard to say what. So Claude looks first (screenshots of every zone, checked for first impression, structures, density, mood and mobile), offers **concrete options** instead of "how is it?", fixes, shows **before/after from the same spot**, commits a checkpoint, and asks again until you're happy.

- **📝 In-world feedback button** — tap it while walking, write a line; the screenshot and location go to Claude. **🎯 Pick** a building to attach exactly which prop it is and its real size.
- **🛠️ Structure workbench** `/lab.html` — one structure from front/45°/side/top, next to a person for scale and a reference photo, in one screen.

Both exist only in `npm run dev`, never in the deployed build.

## 🔐 Secret scanning (always on)

| When | How |
|---|---|
| Right before Claude runs `git commit`, `git push`, `gh repo create` or a deploy | Plugin hook scans and **blocks the command**, then Claude warns you and fixes it |
| When you commit/push yourself | The project's `.githooks/pre-commit` and `pre-push` run the same scan |
| `npm run deploy` | Scans the build output (`dist/`) before uploading |

Detects `.env`-style files, private keys/certificates, Supabase **service_role**/secret keys, Anthropic/OpenAI/GitHub/AWS/Slack/Telegram/Stripe/Cloudflare tokens, hard-coded passwords. Public keys (Supabase anon/publishable) are reported as fine. `secret-scan.mjs --fix` unstages risky files and adds them to `.gitignore`.

## Resume

Every step records to `.metaverse/state.json` (machine) and `.metaverse/PROGRESS.md` (human). Another day, machine or session — `/metaverse` picks up where you left off.

## Cost

Both Cloudflare Workers static assets and Supabase start on free plans. A custom domain is optional.

Documentation inside the skills is written in Korean; Claude follows it and talks to you in English if you write in English.

## License

[MIT](LICENSE)
