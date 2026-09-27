import { projects, type Member } from "@/data/projects";

const API = "https://api.github.com";
const DAY = 60 * 60 * 24;

type Contributor = { login: string; html_url: string; avatar_url: string; contributions: number; type: string };
type Profile = { name: string | null };

// Read at build time and re-read at most once a day, so visitors never hit GitHub's rate limit.
// Set GITHUB_TOKEN in the environment for a higher limit when building often.
async function gh<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(API + path, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: DAY },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

const initialsOf = (name: string) =>
  name
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || name.slice(0, 2).toUpperCase();

// Everyone who committed to the repo (most commits first) with their GitHub name, avatar and profile.
// null when GitHub can't be reached, so the caller keeps the hand-written party.
async function repoParty(repo: string, roles: Record<string, string>, me?: Member): Promise<Member[] | null> {
  const contributors = await gh<Contributor[]>(`/repos/${repo}/contributors?per_page=20`);
  if (!contributors) return null;
  const people = contributors.filter((c) => c.type === "User");
  const profiles = await Promise.all(people.map((c) => gh<Profile>(`/users/${c.login}`)));
  return people.map((c, i) => {
    // you keep the site's name ("Uefa") so every project reads the same
    const name = c.login === me?.login ? me.name : profiles[i]?.name || c.login;
    return {
      initials: initialsOf(name),
      name,
      login: c.login,
      avatar: c.avatar_url,
      href: c.html_url,
      role: roles[c.login] ?? `${c.contributions} commit${c.contributions === 1 ? "" : "s"}`,
      me: c.login === me?.login,
    };
  });
}

// Party per project id: GitHub contributors when the project has a repo, otherwise its own list
// (with your GitHub avatar added to your row).
export async function projectParties(): Promise<Record<string, Member[]>> {
  const meLogin = projects.flatMap((p) => p.party).find((m) => m.me)?.login;
  const myAvatar = meLogin ? (await gh<{ avatar_url: string }>(`/users/${meLogin}`))?.avatar_url : undefined;
  const entries = await Promise.all(
    projects.map(async (p) => {
      const me = p.party.find((m) => m.me);
      const fetched = p.repo ? await repoParty(p.repo, p.roles ?? {}, me) : null;
      const own = p.party.map((m) => (m.me && myAvatar ? { ...m, avatar: myAvatar } : m));
      return [p.id, fetched && fetched.length ? fetched : own] as const;
    }),
  );
  return Object.fromEntries(entries);
}
