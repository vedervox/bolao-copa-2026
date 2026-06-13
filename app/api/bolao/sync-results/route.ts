type MatchRow = {
  id: number;
  home_team: string;
  away_team: string;
  group_name: string;
  match_date: string;
  status: "open" | "locked" | "finished";
  home_score: number | null;
  away_score: number | null;
  qualified_team: string | null;
};

type ApiFootballFixture = {
  fixture: {
    date: string;
    status: {
      short: string;
    };
  };
  teams: {
    home: {
      name: string;
    };
    away: {
      name: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score?: {
    extratime?: {
      home: number | null;
      away: number | null;
    };
  };
};

type ApiFootballResponse = {
  response?: ApiFootballFixture[];
};

const WORLD_CUP_LEAGUE_ID = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
const WORLD_CUP_SEASON = process.env.API_FOOTBALL_SEASON ?? "2026";
const WORLD_CUP_FROM = process.env.API_FOOTBALL_FROM ?? "2026-06-11";
const WORLD_CUP_TO = process.env.API_FOOTBALL_TO ?? "2026-07-19";
const FINISHED_STATUS = new Set(["FT", "AET", "PEN"]);

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !apiKey) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_ANON_KEY nas variaveis de ambiente.");
  }

  return {
    url: url.replace(/\/$/, ""),
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };
}

async function supabase<T>(path: string, init: RequestInit & { prefer?: string } = {}) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...config.headers,
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Erro Supabase ${response.status}`);
  }

  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

function normalizeTeamName(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const aliases: Record<string, string> = {
    brasil: "brazil",
    marrocos: "morocco",
    escocia: "scotland",
    tchequia: "czechia",
    "czech republic": "czechia",
    "korea republic": "south korea",
    "republic of korea": "south korea",
    usa: "united states",
    "u s a": "united states",
    "cote d ivoire": "ivory coast",
    "cote divoire": "ivory coast",
    "ivory coast": "ivory coast",
    curacao: "curacao",
    turkiye: "turkey",
    "cape verde": "cape verde",
    "cabo verde": "cape verde",
    "dr congo": "dr congo",
    "congo dr": "dr congo",
    "bosnia herzegovina": "bosnia and herzegovina",
  };

  return aliases[normalized] ?? normalized;
}

function isDefinedTeam(team: string) {
  const normalized = normalizeTeamName(team);
  return !(
    normalized.includes("a definir") ||
    normalized.includes("finalista") ||
    normalized.includes("vencedor") ||
    normalized.includes("perdedor") ||
    normalized.includes("grupo")
  );
}

function sameUtcDay(left: string, right: string) {
  return new Date(left).toISOString().slice(0, 10) === new Date(right).toISOString().slice(0, 10);
}

function matchesFixture(match: MatchRow, fixture: ApiFootballFixture) {
  return (
    normalizeTeamName(match.home_team) === normalizeTeamName(fixture.teams.home.name) &&
    normalizeTeamName(match.away_team) === normalizeTeamName(fixture.teams.away.name) &&
    sameUtcDay(match.match_date, fixture.fixture.date)
  );
}

async function fetchApiFootballFixtures() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("Configure API_FOOTBALL_KEY na Vercel.");

  const params = new URLSearchParams({
    league: WORLD_CUP_LEAGUE_ID,
    season: WORLD_CUP_SEASON,
    from: WORLD_CUP_FROM,
    to: WORLD_CUP_TO,
  });
  const response = await fetch(`https://v3.football.api-sports.io/fixtures?${params}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Erro API-Football ${response.status}`);
  }

  const data = (await response.json()) as ApiFootballResponse;
  return data.response ?? [];
}

async function syncFinishedResults() {
  const [matches, fixtures] = await Promise.all([
    supabase<MatchRow[]>(
      "matches?select=id,home_team,away_team,group_name,match_date,status,home_score,away_score,qualified_team&order=match_date.asc,id.asc"
    ),
    fetchApiFootballFixtures(),
  ]);

  const finishedFixtures = fixtures.filter((fixture) => {
    return (
      FINISHED_STATUS.has(fixture.fixture.status.short) &&
      fixture.goals.home !== null &&
      fixture.goals.away !== null
    );
  });

  const updates = [];

  for (const match of matches) {
    if (!isDefinedTeam(match.home_team) || !isDefinedTeam(match.away_team)) continue;

    const fixture = finishedFixtures.find((item) => matchesFixture(match, item));
    if (!fixture || fixture.goals.home === null || fixture.goals.away === null) continue;

    if (match.home_score === fixture.goals.home && match.away_score === fixture.goals.away) {
      continue;
    }

    await supabase<null>(`matches?id=eq.${match.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        home_score: fixture.goals.home,
        away_score: fixture.goals.away,
        qualified_team: null,
        status: "finished",
      }),
      prefer: "return=minimal",
    });

    updates.push({
      id: match.id,
      jogo: `${match.home_team} x ${match.away_team}`,
      placar: `${fixture.goals.home} x ${fixture.goals.away}`,
    });
  }

  return {
    ok: true,
    checkedFixtures: finishedFixtures.length,
    updated: updates.length,
    updates,
  };
}

function isAuthorized(request: Request) {
  const secret = process.env.SYNC_RESULTS_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return true;

  const url = new URL(request.url);
  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${secret}` || url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Nao autorizado." }, { status: 401 });
    }

    const result = await syncFinishedResults();
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}
