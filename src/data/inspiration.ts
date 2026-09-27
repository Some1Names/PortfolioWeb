// The /inspiration supplement: favourite films, anime and music, as cover-art cards.
// Covers are official artwork loaded from TMDB (posters) and Apple Music (music artwork); the
// images are not stored in this repo. A new cover must come from one of those two hosts (see
// images.remotePatterns in next.config.ts). `note` is your "why"; cards without one skip it.
import type { Side } from "./site";

export type Favourite = {
  title: string;
  year: number;
  by: string; // director / studio / artist; on an artist card, the linked song
  cover: string;
  alt: string;
  href: string; // the page the cover came from
  source: "TMDB" | "Apple Music";
  note?: string;
  tag?: string; // small chip on the cover
};

export type FavGroup = {
  id: string;
  label: string;
  side: Side; // which accent colours the group
  shape: "poster" | "square";
  listen?: boolean; // song cards show "▶ Listen"
  items: Favourite[];
};

export const inspiration: {
  label: string;
  title: string;
  intro: string;
  credits: string;
  groups: FavGroup[];
} = {
  label: "Supplement · Vol. 01",
  title: "Inspiration",
  // DRAFT: rewrite in your own words
  intro: "The films, shows and music I keep coming back to while I draw and code.",
  credits: "Posters: TMDB. Music artwork: Apple Music. Not endorsed by either.",
  groups: [
    {
      id: "movies",
      label: "Movies",
      side: "collide",
      shape: "poster",
      items: [
        {
          title: "Tenet",
          year: 2020,
          by: "Christopher Nolan",
          cover: "https://media.themoviedb.org/t/p/w500/aCIFMriQh8rvhxpN1IWGgvH0Tlg.jpg",
          alt: "Poster for Tenet",
          href: "https://www.themoviedb.org/movie/577922-tenet",
          source: "TMDB",
        },
        {
          title: "The Dark Knight",
          year: 2008,
          by: "Christopher Nolan",
          cover: "https://media.themoviedb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
          alt: "Poster for The Dark Knight",
          href: "https://www.themoviedb.org/movie/155-the-dark-knight",
          source: "TMDB",
        },
      ],
    },
    {
      id: "anime",
      label: "Anime",
      side: "art",
      shape: "poster",
      items: [
        {
          title: "Tokyo Ghoul",
          year: 2014,
          by: "Studio Pierrot",
          cover: "https://media.themoviedb.org/t/p/w500/1m4RlC9BTCbyY549TOdVQ5NRPcR.jpg",
          alt: "Poster for Tokyo Ghoul",
          href: "https://www.themoviedb.org/tv/61374",
          source: "TMDB",
        },
        {
          title: "Jujutsu Kaisen",
          year: 2020,
          by: "MAPPA",
          cover: "https://media.themoviedb.org/t/p/w500/6qQzMJG27XOJsyAEEIisoJB45j2.jpg",
          alt: "Poster for Jujutsu Kaisen",
          href: "https://www.themoviedb.org/tv/95479",
          source: "TMDB",
        },
        {
          title: "Chainsaw Man",
          year: 2022,
          by: "MAPPA",
          cover: "https://media.themoviedb.org/t/p/w500/npdB6eFzizki0WaZ1OvKcJrWe97.jpg",
          alt: "Poster for Chainsaw Man",
          href: "https://www.themoviedb.org/tv/114410",
          source: "TMDB",
        },
      ],
    },
    {
      id: "songs",
      label: "Songs",
      side: "web",
      shape: "square",
      listen: true,
      items: [
        {
          title: "Any Love of Any Kind",
          year: 2025,
          by: "Woodkid ft. Bryce Dessner",
          cover:
            "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/71/2f/40/712f40af-6e29-95df-a71f-8d30c4bd367c/196873103280.jpg/600x600bb.jpg",
          alt: "Cover art for Any Love of Any Kind by Woodkid ft. Bryce Dessner",
          href: "https://music.apple.com/us/album/any-love-of-any-kind-feat-bryce-dessner/1818147007?i=1818147010",
          source: "Apple Music",
        },
        {
          title: "Self Control",
          year: 2016,
          by: "Frank Ocean",
          cover:
            "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/bb/45/68/bb4568f3-68cd-619d-fbcb-4e179916545d/BlondCover-Final.jpg/600x600bb.jpg",
          alt: "Cover art for Self Control by Frank Ocean",
          href: "https://music.apple.com/us/album/self-control/1146195596?i=1146195718",
          source: "Apple Music",
        },
      ],
    },
    {
      id: "artists",
      label: "Artists",
      side: "web",
      shape: "square",
      items: [
        {
          title: "Eve",
          year: 2020,
          by: "Kaikai Kitan",
          cover:
            "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/00/f7/77/00f77709-2f23-8698-f35b-a3e7685b3d17/4988061912820.jpg/600x600bb.jpg",
          alt: "Cover art for Kaikai Kitan by Eve",
          href: "https://music.apple.com/us/artist/eve/1080967231",
          source: "Apple Music",
          tag: "Jujutsu Kaisen OP",
        },
        {
          title: "Vaundy",
          year: 2022,
          by: "CHAINSAW BLOOD",
          cover:
            "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/c9/de/16/c9de1632-3d12-19c3-2699-22090b4bfcc1/4547366588620.jpg/600x600bb.jpg",
          alt: "Cover art for CHAINSAW BLOOD by Vaundy",
          href: "https://music.apple.com/us/artist/vaundy/1487570516",
          source: "Apple Music",
          tag: "Chainsaw Man ED",
        },
      ],
    },
  ],
};
