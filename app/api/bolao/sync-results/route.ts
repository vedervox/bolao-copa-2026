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
    id?: number;
    date: string;
    status: {
      short: string;
      long?: string;
    };
  };
  league?: {
    id?: number;
    name?: string;
    season?: number;
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
};

type ApiFootballResponse = {
  errors?: unknown;
  results?: number;
  response?: ApiFootballFixture[];
};

const WORLD_CUP_LEAGUE_ID = process.env.API_FOOTBALL_LEAGUE_ID ?? "1";
const WORLD_CUP_SEASON = process.env.API_FOOTBALL_SEASON ?? "2026";
const TOURNAMENT_FROM = process.env.API_FOOTBALL_FROM ?? "2026-06-11";
const TOURNAMENT_TO = process.env.API_FOOTBALL_TO ?? "2026-07-19";
const LOOKBACK_DAYS = Number(process.env.API_FOOTBALL_LOOKBACK_DAYS ?? 5);
const LOOKAHEAD_DAYS = Number(process.env.API_FOOTBALL_LOOKAHEAD_DAYS ?? 1);
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
    australia: "australia",
    belgium: "belgium",
    brasil: "brazil",
    brazil: "brazil",
    canada: "canada",
    "cabo verde": "cape verde",
    "cape verde": "cape verde",
    "congo dr": "dr congo",
    "cote d ivoire": "ivory coast",
    "cote divoire": "ivory coast",
    curacao: "curacao",
    czechia: "czechia",
    "czech republic": "czechia",
    "dr congo": "dr congo",
    ecuador: "ecuador",
    escocia: "scotland",
    "korea republic": "south korea",
    marrocos: "morocco",
    "republic of korea": "south korea",
    scotland: "scotland",
    "south korea": "south korea",
    tchequia: "czechia",
    turkey: "turkey",
    turkiye: "turkey",
    "u s a": "united states",
    usa: "united states",
    "united states": "united states",
    "united states of america": "united states",
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

function formatDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getSyncWindow(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("full") === "1") {
    return { from: TOURNAMENT_FROM, to: TOURNAMENT_TO, full: true };
  }

  const now = new Date();
  return {
    from: formatDateKey(addDays(now, -LOOKBACK_DAYS)),
    to: formatDateKey(addDays(now, LOOKAHEAD_DAYS)),
    full: false,
  };
}

function hoursBetween(left: string, right: string) {
  return Math.abs(new Date(left).getTime() - new Date(right).getTime()) / 36e5;
}

function fixtureSummary(fixture: ApiFootballFixture) {
  return {
    apiFixtureId: fixture.fixture.id ?? null,
    date: fixture.fixture.date,
    status: fixture.fixture.status.short,
    home: fixture.teams.home.name,
    away: fixture.teams.away.name,
    goals: `${fixture.goals.home ?? "-"} x ${fixture.goals.away ?? "-"}`,
  };
}

function matchesFixture(match: MatchRow, fixture: ApiFootballFixture) {
  const sameTeams =
    normalizeTeamName(match.home_team) === normalizeTeamName(fixture.teams.home.name) &&
    normalizeTeamName(match.away_team) === normalizeTeamName(fixture.teams.away.name);

  return sameTeams && hoursBetween(match.match_date, fixture.fixture.date) <= 36;
}

async function fetchApiFootballFixtures(window: { from: string; to: string }) {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) throw new Error("Configure API_FOOTBALL_KEY na Vercel.");

  const params = new URLSearchParams({
    league: WORLD_CUP_LEAGUE_ID,
    season: WORLD_CUP_SEASON,
    from: window.from,
    to: window.to,
  });
  const response = await fetch(`https://v3.football.api-sports.io/fixtures?${params}`, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as ApiFootballResponse;
  if (!response.ok) {
    throw new Error(JSON.stringify(data.errors ?? data));
  }

  return data;
}

async function syncFinishedResults(request: Request) {
  const window = getSyncWindow(request);
  const [matches, apiData] = await Promise.all([
    supabase<MatchRow[]>(
      "matches?select=id,home_team,away_team,group_name,match_date,status,home_score,away_score,qualified_team&order=match_date.asc,id.asc"
    ),
    fetchApiFootballFixtures(window),
  ]);

  const fixtures = apiData.response ?? [];
  const finishedFixtures = fixtures.filter((fixture) => {
    return (
      FINISHED_STATUS.has(fixture.fixture.status.short) &&
      fixture.goals.home !== null &&
      fixture.goals.away !== null
    );
  });
  const eligibleMatches = matches.filter(
    (match) => isDefinedTeam(match.home_team) && isDefinedTeam(match.away_team)
  );
  const updates = [];
  const unchanged = [];
  const unmatchedFinishedFixtures = [];

  for (const fixture of finishedFixtures) {
    const match = eligibleMatches.find((item) => matchesFixture(item, fixture));
    if (!match || fixture.goals.home === null || fixture.goals.away === null) {
      unmatchedFinishedFixtures.push(fixtureSummary(fixture));
      continue;
    }

    if (match.home_score === fixture.goals.home && match.away_score === fixture.goals.away) {
      unchanged.push({
        id: match.id,
        jogo: `${match.home_team} x ${match.away_team}`,
        placar: `${fixture.goals.home} x ${fixture.goals.away}`,
      });
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
    params: {
      league: WORLD_CUP_LEAGUE_ID,
      season: WORLD_CUP_SEASON,
      from: window.from,
      to: window.to,
      full: window.full,
    },
    apiResults: apiData.results ?? fixtures.length,
    apiErrors: apiData.errors ?? null,
    finishedFixtures: finishedFixtures.length,
    eligibleMatches: eligibleMatches.length,
    updated: updates.length,
    unchanged: unchanged.length,
    updates,
    diagnostics: {
      sampleFixtures: fixtures.slice(0, 8).map(fixtureSummary),
      unmatchedFinishedFixtures: unmatchedFinishedFixtures.slice(0, 12),
    },
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

    const result = await syncFinishedResults(request);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
