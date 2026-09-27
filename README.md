# Uefa — Portfolio Vol. 01

Next.js 16 · TypeScript · CSS Modules · GSAP + ScrollTrigger · Lenis

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Where to edit things

All content is in `src/data/`, so you rarely need to touch the components.

| File | What's in it |
|---|---|
| `src/data/site.ts` | Tagline, status panel, **email (placeholder)**, social links, marquee words, About text, hero video settings |
| `src/data/projects.ts` | Projects, collaborators (**mock**), links, screenshots |
| `src/data/timeline.ts` | Timeline entries (**all mock**) |
| `src/data/skills.ts` | Skill tree branches, "Used in" tags, detail text for the click card |

### Screenshots
Put images in `public/projects/` and set `image: "/projects/manga.webp"` on the project.

### Hero video (scroll-scrubbed)
1. Export your clip as an image sequence: `frame_0001.webp`, `frame_0002.webp`, …
   (ffmpeg: `ffmpeg -i clip.mp4 -vf "fps=30,scale=900:-1" -c:v libwebp -quality 80 public/frames/frame_%04d.webp`)
2. Put them in `public/frames/`
3. Set `heroFrames.frameCount` in `src/data/site.ts` to the number of frames.

## Motion

| Section | What moves |
|---|---|
| Whole page | Lenis smooth scroll; nav XP bar = scroll progress |
| Hero | Pinned for one screen: video frames scrub, name blurs away, beams widen, grid floor moves, panels drift |
| Tech strip | Loops sideways; speeds up with scroll velocity, reverses on scroll up |
| Work | Image wipes in, then the text column rises |
| About | Statement lights up word by word |
| Timeline | Rail draws down, dots fill as each row passes the middle |
| Skill tree | Lines draw out from the root, nodes pop in tier by tier; click a node for details |
| Contact | Headline slides up; achievement toast appears |

Everything respects the OS "reduce motion" setting.

## Fonts
- Headings: **Orange Avenue** (`src/fonts/`) — DEMO, *personal use only*. Buy a licence before commercial use.
- Body: Instrument Sans · Labels/code: Geist Mono · Thai: IBM Plex Sans Thai (all self-hosted via npm, no Google Fonts request).
