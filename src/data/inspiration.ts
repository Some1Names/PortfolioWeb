// The /inspiration supplement: favourite films and anime as tapes on a VHS shelf, and music on a
// record player. Covers are official artwork loaded from TMDB (posters) and Apple Music (music
// artwork); the images are not stored in this repo. A new cover must come from one of those two
// hosts (see images.remotePatterns in next.config.ts).

// A tape on the shelf. Under the featured tape: the title, then `original` (the original-language
// title) or, without one, `by`, in pink; then the year (and `by` for anime, the studio).
// `note` is your "why": it shows in the side note beside the shelf (a slot waits until there's one).
export type Favourite = {
  title: string;
  kind: "movie" | "anime";
  year: number;
  by: string; // director (films) or studio (anime)
  original?: string;
  note?: string;
  cover: string;
  alt: string;
  href: string; // the page the cover came from
};

// A song on the record player. `preview` is Apple Music's official 30-second clip and `href`
// the full song on Apple Music; both come from Apple's catalogue lookup
// (https://itunes.apple.com/lookup?id=<track id>: previewUrl and trackViewUrl).
// a record: a song, or an album (then title is the album, href the album, and preview and length
// are the song from it that plays, named in tag)
export type Track = {
  title: string;
  artist: string;
  cover: string;
  href: string;
  preview: string;
  length: number; // the full song, in seconds
  tag?: string; // e.g. "Album · plays Lazy Cat"
};

export const inspiration: {
  label: string;
  title: string;
  intro: string;
  credits: string;
  shelf: { label: string; items: Favourite[] };
  music: { label: string; tracks: Track[] };
  // the turntable's 3D model (CC BY 4.0: credit the author, link the licence, say what changed)
  model: { title: string; href: string; author: string; authorHref: string; license: string; licenseHref: string; changes: string };
} = {
  label: "Supplement · Vol. 01",
  title: "Inspiration",
  // DRAFT: rewrite in your own words
  intro: "The films, shows and music I keep coming back to while I draw and code.",
  credits: "Posters: TMDB. Music artwork and previews: Apple Music. Not endorsed by either.",
  shelf: {
    label: "Film & Anime",
    items: [
      {
        title: "Tenet",
        kind: "movie",
        year: 2020,
        by: "Christopher Nolan",
        cover: "https://media.themoviedb.org/t/p/w500/aCIFMriQh8rvhxpN1IWGgvH0Tlg.jpg",
        alt: "Poster for Tenet",
        href: "https://www.themoviedb.org/movie/577922-tenet",
      },
      {
        title: "The Dark Knight",
        kind: "movie",
        year: 2008,
        by: "Christopher Nolan",
        cover: "https://media.themoviedb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        alt: "Poster for The Dark Knight",
        href: "https://www.themoviedb.org/movie/155-the-dark-knight",
      },
      {
        title: "Tokyo Ghoul",
        kind: "anime",
        year: 2014,
        by: "Studio Pierrot",
        original: "東京喰種トーキョーグール",
        cover: "https://media.themoviedb.org/t/p/w500/1m4RlC9BTCbyY549TOdVQ5NRPcR.jpg",
        alt: "Poster for Tokyo Ghoul",
        href: "https://www.themoviedb.org/tv/61374",
      },
      {
        title: "Jujutsu Kaisen",
        kind: "anime",
        year: 2020,
        by: "MAPPA",
        original: "呪術廻戦",
        cover: "https://media.themoviedb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg",
        alt: "Poster for Jujutsu Kaisen",
        href: "https://www.themoviedb.org/tv/95479",
      },
      {
        title: "Chainsaw Man",
        kind: "anime",
        year: 2022,
        by: "MAPPA",
        original: "チェンソーマン",
        cover: "https://media.themoviedb.org/t/p/w500/npdB6eFzizki0WaZ1OvKcJrWe97.jpg",
        alt: "Poster for Chainsaw Man",
        href: "https://www.themoviedb.org/tv/114410",
      },
    ],
  },
  model: {
    title: "Vinyl player",
    href: "https://sketchfab.com/3d-models/vinyl-player-9eb895af086a4cbb95f86bc2fa773b60",
    author: "AlexEsfell",
    authorHref: "https://sketchfab.com/alexesfell",
    license: "CC BY 4.0",
    licenseHref: "https://creativecommons.org/licenses/by/4.0/",
    changes: "recoloured, with a new record",
  },
  music: {
    label: "Music",
    tracks: [
      {
        title: "Any Love of Any Kind",
        artist: "Woodkid ft. Bryce Dessner",
        cover:
          "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/71/2f/40/712f40af-6e29-95df-a71f-8d30c4bd367c/196873103280.jpg/600x600bb.jpg",
        href: "https://music.apple.com/us/album/any-love-of-any-kind-feat-bryce-dessner/1818147007?i=1818147010",
        preview:
          "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/31/46/56/31465680-fb96-75f3-2bd5-96a45bf1cc4e/mzaf_2399171045580320161.plus.aac.p.m4a",
        length: 234,
      },
      {
        title: "Self Control",
        artist: "Frank Ocean",
        cover:
          "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg",
        href: "https://music.apple.com/us/album/self-control/1146195596?i=1146195718",
        preview:
          "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/67/d5/18/67d5185e-37e4-3e36-d345-0e8075de0407/mzaf_12338821043527808523.plus.aac.p.m4a",
        length: 250,
      },
      // favourite artists, as their latest albums (each plays its first full-length song)
      {
        title: "Under Blue",
        artist: "Eve",
        cover:
          "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4d/d0/cb/4dd0cb75-28d1-f109-5c73-9263190c1b20/4988061930770.jpg/600x600bb.jpg",
        href: "https://music.apple.com/us/album/under-blue/1779475579",
        preview:
          "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/4c/d1/1a/4cd11a95-a8af-32de-b877-ace579c9f7e4/mzaf_14438854170948763444.plus.aac.p.m4a",
        length: 156,
        tag: "Album · plays Lazy Cat",
      },
      {
        title: "replica",
        artist: "Vaundy",
        cover:
          "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/8a/eb/75/8aeb7526-6fe4-a81a-5dce-c5d026e7f036/4547366655728.jpg/600x600bb.jpg",
        href: "https://music.apple.com/us/album/replica/1714599649",
        preview:
          "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/43/99/60/43996059-cd24-db7b-24cc-437727997fd2/mzaf_3662584062574999114.plus.aac.p.m4a",
        length: 232,
        tag: "Album · plays ZERO",
      },
    ],
  },
};
