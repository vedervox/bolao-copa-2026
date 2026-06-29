type ParticipantRow = {
  id: number;
  name: string;
  avatar: string;
  access_code: string | null;
  created_at: string;
};

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
  created_at: string;
};

type GuessRow = {
  id: number;
  participant_id: number;
  match_id: number;
  home_guess: number;
  away_guess: number;
  qualified_team_guess: string | null;
  updated_at: string;
};

type BonusPredictionRow = {
  participant_id: number;
  champion_guess: string | null;
  top_scorer_guess: string | null;
  updated_at: string;
};

type PoolSettingRow = {
  key: string;
  value: string | null;
  updated_at: string;
};

const GUESS_DEADLINE_MINUTES = 5;
const FIRST_BRAZIL_MATCH_DATE = new Date("2026-06-13T22:00:00.000Z");

type InitialMatch = readonly [string, string, string, string];

const initialMatches: readonly InitialMatch[] = [
  ["Mexico", "South Africa", "Grupo A", "2026-06-11T20:00:00.000Z"],
  ["South Korea", "Czechia", "Grupo A", "2026-06-12T03:00:00.000Z"],
  ["Czechia", "South Africa", "Grupo A", "2026-06-18T17:00:00.000Z"],
  ["Mexico", "South Korea", "Grupo A", "2026-06-19T02:00:00.000Z"],
  ["Czechia", "Mexico", "Grupo A", "2026-06-25T02:00:00.000Z"],
  ["South Africa", "South Korea", "Grupo A", "2026-06-25T02:00:00.000Z"],
  ["Canada", "Bosnia and Herzegovina", "Grupo B", "2026-06-12T20:00:00.000Z"],
  ["Qatar", "Switzerland", "Grupo B", "2026-06-13T20:00:00.000Z"],
  ["Switzerland", "Bosnia and Herzegovina", "Grupo B", "2026-06-18T20:00:00.000Z"],
  ["Canada", "Qatar", "Grupo B", "2026-06-18T23:00:00.000Z"],
  ["Switzerland", "Canada", "Grupo B", "2026-06-24T20:00:00.000Z"],
  ["Bosnia and Herzegovina", "Qatar", "Grupo B", "2026-06-24T20:00:00.000Z"],
  ["Brasil", "Marrocos", "Grupo C", "2026-06-13T22:00:00.000Z"],
  ["Haiti", "Escócia", "Grupo C", "2026-06-14T01:00:00.000Z"],
  ["Escócia", "Marrocos", "Grupo C", "2026-06-19T22:00:00.000Z"],
  ["Brasil", "Haiti", "Grupo C", "2026-06-20T01:00:00.000Z"],
  ["Escócia", "Brasil", "Grupo C", "2026-06-24T22:00:00.000Z"],
  ["Marrocos", "Haiti", "Grupo C", "2026-06-24T22:00:00.000Z"],
  ["United States", "Paraguay", "Grupo D", "2026-06-13T01:00:00.000Z"],
  ["Australia", "Türkiye", "Grupo D", "2026-06-14T04:00:00.000Z"],
  ["Türkiye", "Paraguay", "Grupo D", "2026-06-20T04:00:00.000Z"],
  ["United States", "Australia", "Grupo D", "2026-06-19T20:00:00.000Z"],
  ["Türkiye", "United States", "Grupo D", "2026-06-26T02:00:00.000Z"],
  ["Paraguay", "Australia", "Grupo D", "2026-06-26T02:00:00.000Z"],
  ["Côte d'Ivoire", "Ecuador", "Grupo E", "2026-06-14T18:00:00.000Z"],
  ["Germany", "Curaçao", "Grupo E", "2026-06-14T23:00:00.000Z"],
  ["Germany", "Côte d'Ivoire", "Grupo E", "2026-06-20T21:00:00.000Z"],
  ["Ecuador", "Curaçao", "Grupo E", "2026-06-21T00:00:00.000Z"],
  ["Curaçao", "Côte d'Ivoire", "Grupo E", "2026-06-25T21:00:00.000Z"],
  ["Ecuador", "Germany", "Grupo E", "2026-06-25T21:00:00.000Z"],
  ["Netherlands", "Japan", "Grupo F", "2026-06-14T21:00:00.000Z"],
  ["Sweden", "Tunisia", "Grupo F", "2026-06-15T02:00:00.000Z"],
  ["Netherlands", "Sweden", "Grupo F", "2026-06-20T18:00:00.000Z"],
  ["Tunisia", "Japan", "Grupo F", "2026-06-21T04:00:00.000Z"],
  ["Japan", "Sweden", "Grupo F", "2026-06-25T23:00:00.000Z"],
  ["Tunisia", "Netherlands", "Grupo F", "2026-06-25T23:00:00.000Z"],
  ["Iran", "New Zealand", "Grupo G", "2026-06-16T01:00:00.000Z"],
  ["Belgium", "Egypt", "Grupo G", "2026-06-15T20:00:00.000Z"],
  ["Belgium", "Iran", "Grupo G", "2026-06-21T20:00:00.000Z"],
  ["New Zealand", "Egypt", "Grupo G", "2026-06-22T01:00:00.000Z"],
  ["Egypt", "Iran", "Grupo G", "2026-06-27T03:00:00.000Z"],
  ["New Zealand", "Belgium", "Grupo G", "2026-06-27T03:00:00.000Z"],
  ["Saudi Arabia", "Uruguay", "Grupo H", "2026-06-15T22:00:00.000Z"],
  ["Spain", "Cape Verde", "Grupo H", "2026-06-15T17:00:00.000Z"],
  ["Uruguay", "Cape Verde", "Grupo H", "2026-06-21T22:00:00.000Z"],
  ["Spain", "Saudi Arabia", "Grupo H", "2026-06-21T17:00:00.000Z"],
  ["Cape Verde", "Saudi Arabia", "Grupo H", "2026-06-27T00:00:00.000Z"],
  ["Uruguay", "Spain", "Grupo H", "2026-06-27T00:00:00.000Z"],
  ["France", "Senegal", "Grupo I", "2026-06-16T20:00:00.000Z"],
  ["Iraq", "Norway", "Grupo I", "2026-06-16T22:00:00.000Z"],
  ["Norway", "Senegal", "Grupo I", "2026-06-23T00:00:00.000Z"],
  ["France", "Iraq", "Grupo I", "2026-06-22T22:00:00.000Z"],
  ["Norway", "France", "Grupo I", "2026-06-26T20:00:00.000Z"],
  ["Senegal", "Iraq", "Grupo I", "2026-06-26T20:00:00.000Z"],
  ["Argentina", "Algeria", "Grupo J", "2026-06-17T01:00:00.000Z"],
  ["Austria", "Jordan", "Grupo J", "2026-06-17T04:00:00.000Z"],
  ["Argentina", "Austria", "Grupo J", "2026-06-22T17:00:00.000Z"],
  ["Jordan", "Algeria", "Grupo J", "2026-06-23T03:00:00.000Z"],
  ["Algeria", "Austria", "Grupo J", "2026-06-28T02:00:00.000Z"],
  ["Jordan", "Argentina", "Grupo J", "2026-06-28T02:00:00.000Z"],
  ["Portugal", "DR Congo", "Grupo K", "2026-06-17T17:00:00.000Z"],
  ["Uzbekistan", "Colombia", "Grupo K", "2026-06-18T02:00:00.000Z"],
  ["Portugal", "Uzbekistan", "Grupo K", "2026-06-23T17:00:00.000Z"],
  ["Colombia", "DR Congo", "Grupo K", "2026-06-24T02:00:00.000Z"],
  ["Colombia", "Portugal", "Grupo K", "2026-06-27T23:30:00.000Z"],
  ["DR Congo", "Uzbekistan", "Grupo K", "2026-06-27T23:30:00.000Z"],
  ["Ghana", "Panama", "Grupo L", "2026-06-17T23:00:00.000Z"],
  ["England", "Croatia", "Grupo L", "2026-06-17T20:00:00.000Z"],
  ["England", "Ghana", "Grupo L", "2026-06-23T20:00:00.000Z"],
  ["Panama", "Croatia", "Grupo L", "2026-06-23T23:00:00.000Z"],
  ["Panama", "England", "Grupo L", "2026-06-27T22:00:00.000Z"],
  ["Croatia", "Ghana", "Grupo L", "2026-06-27T22:00:00.000Z"],
  ["South Africa", "Canada", "16 avos", "2026-06-28T20:00:00.000Z"],
  ["Germany", "Paraguay", "16 avos", "2026-06-29T20:00:00.000Z"],
  ["Netherlands", "Marrocos", "16 avos", "2026-06-29T23:00:00.000Z"],
  ["Brasil", "Japan", "16 avos", "2026-06-30T01:00:00.000Z"],
  ["France", "Sweden", "16 avos", "2026-06-30T20:00:00.000Z"],
  ["Côte d'Ivoire", "Norway", "16 avos", "2026-06-30T23:00:00.000Z"],
  ["Mexico", "Ecuador", "16 avos", "2026-07-01T01:00:00.000Z"],
  ["England", "DR Congo", "16 avos", "2026-07-01T20:00:00.000Z"],
  ["United States", "Bosnia and Herzegovina", "16 avos", "2026-07-01T23:00:00.000Z"],
  ["Belgium", "Senegal", "16 avos", "2026-07-02T01:00:00.000Z"],
  ["Portugal", "Croatia", "16 avos", "2026-07-02T20:00:00.000Z"],
  ["Spain", "Austria", "16 avos", "2026-07-02T23:00:00.000Z"],
  ["Switzerland", "Algeria", "16 avos", "2026-07-03T01:00:00.000Z"],
  ["Argentina", "Cape Verde", "16 avos", "2026-07-03T20:00:00.000Z"],
  ["Colombia", "Ghana", "16 avos", "2026-07-03T23:00:00.000Z"],
  ["Australia", "Egypt", "16 avos", "2026-07-04T01:00:00.000Z"],
  ["Vencedor Jogo 74", "Vencedor Jogo 77", "Oitavas", "2026-07-04T20:00:00.000Z"],
  ["Vencedor Jogo 73", "Vencedor Jogo 75", "Oitavas", "2026-07-04T23:00:00.000Z"],
  ["Vencedor Jogo 76", "Vencedor Jogo 78", "Oitavas", "2026-07-05T20:00:00.000Z"],
  ["Vencedor Jogo 79", "Vencedor Jogo 80", "Oitavas", "2026-07-05T23:00:00.000Z"],
  ["Vencedor Jogo 83", "Vencedor Jogo 84", "Oitavas", "2026-07-06T20:00:00.000Z"],
  ["Vencedor Jogo 81", "Vencedor Jogo 82", "Oitavas", "2026-07-06T23:00:00.000Z"],
  ["Vencedor Jogo 86", "Vencedor Jogo 88", "Oitavas", "2026-07-07T20:00:00.000Z"],
  ["Vencedor Jogo 85", "Vencedor Jogo 87", "Oitavas", "2026-07-07T23:00:00.000Z"],
  ["Vencedor Jogo 89", "Vencedor Jogo 90", "Quartas", "2026-07-09T20:00:00.000Z"],
  ["Vencedor Jogo 93", "Vencedor Jogo 94", "Quartas", "2026-07-10T20:00:00.000Z"],
  ["Vencedor Jogo 91", "Vencedor Jogo 92", "Quartas", "2026-07-11T20:00:00.000Z"],
  ["Vencedor Jogo 95", "Vencedor Jogo 96", "Quartas", "2026-07-11T23:00:00.000Z"],
  ["Vencedor Jogo 97", "Vencedor Jogo 98", "Semifinal", "2026-07-14T20:00:00.000Z"],
  ["Vencedor Jogo 99", "Vencedor Jogo 100", "Semifinal", "2026-07-15T20:00:00.000Z"],
  ["Perdedor Jogo 101", "Perdedor Jogo 102", "3º lugar", "2026-07-18T20:00:00.000Z"],
  ["Vencedor Jogo 101", "Vencedor Jogo 102", "Final", "2026-07-19T20:00:00.000Z"],
];

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !apiKey) {
    throw new Error("Configure SUPABASE_URL e SUPABASE_ANON_KEY nas variáveis de ambiente.");
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

function hasOfficialResult(match: MatchRow) {
  return match.home_score !== null && match.away_score !== null;
}

function hasMatchStarted(match: MatchRow) {
  return new Date() >= new Date(match.match_date);
}

function hasGuessDeadlinePassed(match: MatchRow) {
  return Date.now() >= new Date(match.match_date).getTime() - GUESS_DEADLINE_MINUTES * 60 * 1000;
}

function getComputedStatus(match: MatchRow): "open" | "locked" | "finished" {
  if (hasOfficialResult(match) && hasMatchStarted(match)) return "finished";
  if (hasGuessDeadlinePassed(match)) return "locked";
  return "open";
}

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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

function hasDefinedTeams(match: MatchRow) {
  return isDefinedTeam(match.home_team) && isDefinedTeam(match.away_team);
}

function isKnockoutMatch(match: Pick<MatchRow, "group_name">) {
  return !normalizeTeamName(match.group_name).startsWith("grupo ");
}

function normalizePick(value: string | null | undefined) {
  return normalizeTeamName(value ?? "");
}

function toParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    hasLogin: Boolean(row.access_code),
    createdAt: row.created_at,
  };
}

function normalizeAccessCode(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

type ParticipantAccess =
  | { ok: true; participant: ParticipantRow }
  | { ok: false; error: string };

async function verifyParticipantAccess(
  participantId: number,
  accessCode: string
): Promise<ParticipantAccess> {
  const [participant] = await supabase<ParticipantRow[]>(
    `participants?select=*&id=eq.${participantId}&limit=1`
  );

  if (!participant) return { ok: false, error: "Participante não encontrado." };

  if (!participant.access_code) {
    if (accessCode.length < 4) {
      return { ok: false, error: "Crie um PIN com pelo menos 4 dígitos." };
    }

    await supabase<null>(`participants?id=eq.${participantId}`, {
      method: "PATCH",
      body: JSON.stringify({ access_code: accessCode }),
      prefer: "return=minimal",
    });

    return { ok: true, participant: { ...participant, access_code: accessCode } };
  }

  if (participant.access_code !== accessCode) {
    return { ok: false, error: "PIN incorreto para esse participante." };
  }

  return { ok: true, participant };
}

function toMatch(row: MatchRow) {
  return {
    id: row.id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    groupName: row.group_name,
    matchDate: row.match_date,
    status: getComputedStatus(row),
    homeScore: row.home_score,
    awayScore: row.away_score,
    qualifiedTeam: row.qualified_team,
    createdAt: row.created_at,
  };
}

function toGuess(row: GuessRow) {
  return {
    id: row.id,
    participantId: row.participant_id,
    matchId: row.match_id,
    homeGuess: row.home_guess,
    awayGuess: row.away_guess,
    qualifiedTeamGuess: row.qualified_team_guess,
    updatedAt: row.updated_at,
  };
}

function scoreGuess(guess: GuessRow, match: MatchRow) {
  if (match.home_score === null || match.away_score === null) {
    return { points: 0, exact: false, trend: false };
  }

  const exact = guess.home_guess === match.home_score && guess.away_guess === match.away_score;
  if (exact) return { points: 10, exact: true, trend: true };

  const actualDirection = Math.sign(match.home_score - match.away_score);
  const guessedDirection = Math.sign(guess.home_guess - guess.away_guess);
  const trend = actualDirection === guessedDirection;

  if (!trend) return { points: 0, exact: false, trend: false };

  const actualDiff = match.home_score - match.away_score;
  const guessedDiff = guess.home_guess - guess.away_guess;
  const actualWinnerGoals =
    actualDirection > 0 ? match.home_score : actualDirection < 0 ? match.away_score : null;
  const guessedWinnerGoals =
    actualDirection > 0 ? guess.home_guess : actualDirection < 0 ? guess.away_guess : null;

  if (actualWinnerGoals !== null && guessedWinnerGoals === actualWinnerGoals) {
    return { points: 5, exact: false, trend: true };
  }

  if (actualDiff === guessedDiff) {
    return { points: 3, exact: false, trend: true };
  }

  return { points: 2, exact: false, trend: true };
}

function scoreQualificationBonus(guess: GuessRow, match: MatchRow) {
  if (!isKnockoutMatch(match) || !match.qualified_team || !guess.qualified_team_guess) return 0;
  return normalizePick(match.qualified_team) === normalizePick(guess.qualified_team_guess) ? 2 : 0;
}

function settingValue(settings: PoolSettingRow[], key: string) {
  return settings.find((setting) => setting.key === key)?.value ?? "";
}

function scoreBonusPrediction(prediction: BonusPredictionRow | undefined, settings: PoolSettingRow[]) {
  const bonusFinalized = settingValue(settings, "bonus_finalized") === "true";
  if (!bonusFinalized) {
    return { points: 0, championCorrect: false, topScorerCorrect: false };
  }

  const champion = settingValue(settings, "champion");
  const topScorer = settingValue(settings, "top_scorer");
  const championCorrect = Boolean(
    champion && prediction?.champion_guess && normalizePick(prediction.champion_guess) === normalizePick(champion)
  );
  const topScorerCorrect = Boolean(
    topScorer && prediction?.top_scorer_guess && normalizePick(prediction.top_scorer_guess) === normalizePick(topScorer)
  );

  return {
    points: (championCorrect ? 20 : 0) + (topScorerCorrect ? 15 : 0),
    championCorrect,
    topScorerCorrect,
  };
}

function matchKey(match: Pick<MatchRow, "home_team" | "away_team" | "match_date">) {
  return `${match.home_team}__${match.away_team}__${new Date(match.match_date).toISOString()}`;
}

function isGroupStageSeed(match: InitialMatch) {
  return normalizeTeamName(match[2]).startsWith("grupo ");
}

function isDemoMatch(match: MatchRow) {
  return (
    match.away_team.includes("Rival a definir") ||
    match.home_team.includes("Finalista") ||
    match.away_team.includes("Finalista") ||
    match.group_name === "Favoritos" ||
    match.group_name === "Classico" ||
    match.group_name === "Grupo do Brasil"
  );
}

async function ensureSeeded() {
  const existing = await supabase<MatchRow[]>("matches?select=*&order=match_date.asc,id.asc");

  if (existing.length > 0 && existing.length < 20 && existing.every(isDemoMatch)) {
    await supabase<null>("guesses?id=gt.0", { method: "DELETE", prefer: "return=minimal" });
    await supabase<null>("matches?id=gt.0", { method: "DELETE", prefer: "return=minimal" });
    await insertAllMatches();
    return;
  }

  if (existing.length === 0) {
    await insertAllMatches();
    return;
  }

  const existingKeys = new Set(existing.map(matchKey));
  const missing = initialMatches.filter(isGroupStageSeed).filter(([homeTeam, awayTeam, , matchDate]) => {
    return !existingKeys.has(
      `${homeTeam}__${awayTeam}__${new Date(matchDate).toISOString()}`
    );
  });

  if (missing.length > 0) {
    await supabase<MatchRow[]>("matches", {
      method: "POST",
      body: JSON.stringify(
        missing.map(([homeTeam, awayTeam, groupName, matchDate]) => ({
          home_team: homeTeam,
          away_team: awayTeam,
          group_name: groupName,
          match_date: matchDate,
          status: "open",
        }))
      ),
      prefer: "return=representation",
    });
  }
}

async function insertAllMatches() {
  await supabase<MatchRow[]>("matches", {
    method: "POST",
    body: JSON.stringify(
      initialMatches.map(([homeTeam, awayTeam, groupName, matchDate]) => ({
        home_team: homeTeam,
        away_team: awayTeam,
        group_name: groupName,
        match_date: matchDate,
        status: "open",
      }))
    ),
    prefer: "return=representation",
  });
}

export async function GET() {
  try {
    await ensureSeeded();
    const [participantRows, matchRows, guessRows, bonusRows, settingRows] = await Promise.all([
      supabase<ParticipantRow[]>("participants?select=*&order=created_at.asc,id.asc"),
      supabase<MatchRow[]>("matches?select=*&order=match_date.asc,id.asc"),
      supabase<GuessRow[]>("guesses?select=*&order=updated_at.asc,id.asc"),
      supabase<BonusPredictionRow[]>("bonus_predictions?select=*"),
      supabase<PoolSettingRow[]>("pool_settings?select=*"),
    ]);

    const ranked = participantRows
      .map((participant) => {
        const participantGuesses = guessRows.filter((guess) => guess.participant_id === participant.id);
        const matchPoints = participantGuesses.reduce((sum, guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return sum + (match ? scoreGuess(guess, match).points + scoreQualificationBonus(guess, match) : 0);
        }, 0);
        const exact = participantGuesses.filter((guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return match && scoreGuess(guess, match).exact;
        }).length;
        const trend = participantGuesses.filter((guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return match && scoreGuess(guess, match).trend;
        }).length;
        const bonus = scoreBonusPrediction(
          bonusRows.find((row) => row.participant_id === participant.id),
          settingRows
        );

        return {
          ...toParticipant(participant),
          total: matchPoints + bonus.points,
          exact,
          trend,
          championCorrect: bonus.championCorrect,
          guesses: participantGuesses.length,
        };
      })
      .sort(
        (a, b) =>
          b.total - a.total ||
          b.exact - a.exact ||
          b.trend - a.trend ||
          Number(b.championCorrect) - Number(a.championCorrect) ||
          a.name.localeCompare(b.name)
      );

    return Response.json({
      participants: ranked,
      matches: matchRows.map(toMatch),
      guesses: guessRows.map(toGuess),
      bonusPredictions: bonusRows.map((row) => ({
        participantId: row.participant_id,
        championGuess: row.champion_guess,
        topScorerGuess: row.top_scorer_guess,
      })),
      poolSettings: {
        champion: settingValue(settingRows, "champion"),
        topScorer: settingValue(settingRows, "top_scorer"),
        bonusFinalized: settingValue(settingRows, "bonus_finalized") === "true",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const payload = (await request.json()) as {
      action?: string;
      name?: string;
      participantId?: number;
      matchId?: number;
      homeGuess?: number;
      awayGuess?: number;
      homeScore?: number | null;
      awayScore?: number | null;
      guessId?: number;
      accessCode?: string;
      qualifiedTeamGuess?: string;
      qualifiedTeam?: string | null;
      championGuess?: string;
      topScorerGuess?: string;
      champion?: string | null;
      topScorer?: string | null;
      bonusFinalized?: boolean;
    };

    if (payload.action === "addParticipant") {
      const name = payload.name?.trim();
      if (!name) return Response.json({ error: "Informe um nome." }, { status: 400 });
      const accessCode = normalizeAccessCode(payload.accessCode);
      if (accessCode.length < 4) {
        return Response.json({ error: "Crie um PIN com pelo menos 4 dígitos." }, { status: 400 });
      }

      const exactMatches = await supabase<ParticipantRow[]>(`participants?select=*&name=eq.${encodeURIComponent(name)}&limit=1`);
      if (exactMatches[0]) {
        const existing = exactMatches[0];

        if (existing.access_code && existing.access_code !== accessCode) {
          return Response.json(
            { error: "Esse nome já existe. Use o PIN correto para entrar." },
            { status: 401 }
          );
        }

        if (!existing.access_code) {
          await supabase<null>(`participants?id=eq.${existing.id}`, {
            method: "PATCH",
            body: JSON.stringify({ access_code: accessCode }),
            prefer: "return=minimal",
          });
        }

        return Response.json({
          participant: toParticipant({ ...existing, access_code: existing.access_code ?? accessCode }),
        });
      }

      const avatar = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
      const [participant] = await supabase<ParticipantRow[]>("participants", {
        method: "POST",
        body: JSON.stringify({ name, avatar, access_code: accessCode }),
        prefer: "return=representation",
      });
      return Response.json({ participant: toParticipant(participant) }, { status: 201 });
    }

    if (payload.action === "loginParticipant") {
      if (!payload.participantId) {
        return Response.json({ error: "Escolha participante." }, { status: 400 });
      }

      const accessCode = normalizeAccessCode(payload.accessCode);
      const access = await verifyParticipantAccess(payload.participantId, accessCode);
      if (!access.ok) return Response.json({ error: access.error }, { status: 401 });

      return Response.json({ participant: toParticipant(access.participant) });
    }

    if (payload.action === "saveGuess") {
      if (!payload.participantId || !payload.matchId) {
        return Response.json({ error: "Escolha participante e jogo." }, { status: 400 });
      }

      const access = await verifyParticipantAccess(
        payload.participantId,
        normalizeAccessCode(payload.accessCode)
      );
      if (!access.ok) return Response.json({ error: access.error }, { status: 401 });

      const { homeGuess, awayGuess } = payload;
      if (
        homeGuess === undefined ||
        awayGuess === undefined ||
        !Number.isInteger(homeGuess) ||
        !Number.isInteger(awayGuess) ||
        homeGuess < 0 ||
        awayGuess < 0 ||
        homeGuess > 20 ||
        awayGuess > 20
      ) {
        return Response.json({ error: "Palpite inválido." }, { status: 400 });
      }

      const [match] = await supabase<MatchRow[]>(`matches?select=*&id=eq.${payload.matchId}&limit=1`);
      if (!match) return Response.json({ error: "Jogo não encontrado." }, { status: 404 });
      if (!hasDefinedTeams(match)) {
        return Response.json(
          { error: "Esse jogo ainda não tem os dois times definidos." },
          { status: 409 }
        );
      }
      if (getComputedStatus(match) !== "open") {
        return Response.json(
          { error: `Esse jogo já está bloqueado. Palpites fecham ${GUESS_DEADLINE_MINUTES} minutos antes.` },
          { status: 409 }
        );
      }

      const qualifiedTeamGuess = normalizeAccessCode(payload.qualifiedTeamGuess);
      if (
        isKnockoutMatch(match) &&
        qualifiedTeamGuess &&
        normalizePick(qualifiedTeamGuess) !== normalizePick(match.home_team) &&
        normalizePick(qualifiedTeamGuess) !== normalizePick(match.away_team)
      ) {
        return Response.json({ error: "Escolha uma seleção classificada válida." }, { status: 400 });
      }

      const existingGuess = await supabase<GuessRow[]>(
        `guesses?select=*&participant_id=eq.${payload.participantId}&match_id=eq.${payload.matchId}&limit=1`
      );
      if (existingGuess[0]) {
        return Response.json(
          { error: "Este participante já deu palpite para este jogo e não pode alterar." },
          { status: 409 }
        );
      }

      await supabase<GuessRow[]>("guesses", {
        method: "POST",
        body: JSON.stringify({
          participant_id: payload.participantId,
          match_id: payload.matchId,
          home_guess: homeGuess,
          away_guess: awayGuess,
          qualified_team_guess: qualifiedTeamGuess || null,
        }),
        prefer: "return=representation",
      });

      return Response.json({ ok: true });
    }

    if (payload.action === "deleteGuess") {
      if (!payload.participantId || !payload.guessId) {
        return Response.json({ error: "Escolha participante e palpite." }, { status: 400 });
      }

      const access = await verifyParticipantAccess(
        payload.participantId,
        normalizeAccessCode(payload.accessCode)
      );
      if (!access.ok) return Response.json({ error: access.error }, { status: 401 });

      await supabase<null>(
        `guesses?id=eq.${payload.guessId}&participant_id=eq.${payload.participantId}`,
        { method: "DELETE", prefer: "return=minimal" }
      );

      return Response.json({ ok: true });
    }

    if (payload.action === "deleteParticipantGuesses") {
      if (!payload.participantId) {
        return Response.json({ error: "Escolha participante." }, { status: 400 });
      }

      const access = await verifyParticipantAccess(
        payload.participantId,
        normalizeAccessCode(payload.accessCode)
      );
      if (!access.ok) return Response.json({ error: access.error }, { status: 401 });

      await supabase<null>(`guesses?participant_id=eq.${payload.participantId}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });

      return Response.json({ ok: true });
    }

    if (payload.action === "updateResult") {
      if (!payload.matchId) return Response.json({ error: "Escolha um jogo." }, { status: 400 });

      const [match] = await supabase<MatchRow[]>(`matches?select=*&id=eq.${payload.matchId}&limit=1`);
      if (!match) return Response.json({ error: "Jogo não encontrado." }, { status: 404 });
      if (!hasDefinedTeams(match)) {
        return Response.json(
          { error: "Defina os dois times antes de lançar placar para esse jogo." },
          { status: 409 }
        );
      }
      if (!hasMatchStarted(match)) {
        return Response.json(
          { error: "Esse jogo ainda não aconteceu. Resultado oficial só pode ser fechado depois da partida." },
          { status: 409 }
        );
      }

      const { homeScore, awayScore } = payload;
      const qualifiedTeam = normalizeAccessCode(payload.qualifiedTeam);
      const hasResult =
        typeof homeScore === "number" &&
        typeof awayScore === "number" &&
        Number.isInteger(homeScore) &&
        Number.isInteger(awayScore) &&
        homeScore >= 0 &&
        awayScore >= 0;

      await supabase<null>(`matches?id=eq.${payload.matchId}`, {
        method: "PATCH",
        body: JSON.stringify({
          home_score: hasResult ? homeScore : null,
          away_score: hasResult ? awayScore : null,
          qualified_team: qualifiedTeam || null,
          status: hasResult ? "finished" : "open",
        }),
        prefer: "return=minimal",
      });

      return Response.json({ ok: true });
    }

    if (payload.action === "clearResult") {
      if (!payload.matchId) return Response.json({ error: "Escolha um jogo." }, { status: 400 });

      await supabase<null>(`matches?id=eq.${payload.matchId}`, {
        method: "PATCH",
        body: JSON.stringify({
          home_score: null,
          away_score: null,
          qualified_team: null,
          status: "open",
        }),
        prefer: "return=minimal",
      });

      return Response.json({ ok: true });
    }

    if (payload.action === "deleteParticipant") {
      if (!payload.participantId) return Response.json({ error: "Escolha participante." }, { status: 400 });
      await supabase<null>(`participants?id=eq.${payload.participantId}`, { method: "DELETE", prefer: "return=minimal" });
      return Response.json({ ok: true });
    }

    if (payload.action === "saveBonusPrediction") {
      if (!payload.participantId) {
        return Response.json({ error: "Escolha participante." }, { status: 400 });
      }

      if (Date.now() >= FIRST_BRAZIL_MATCH_DATE.getTime()) {
        return Response.json(
          { error: "Previsões extras fecharam antes do primeiro jogo do Brasil." },
          { status: 409 }
        );
      }

      const access = await verifyParticipantAccess(
        payload.participantId,
        normalizeAccessCode(payload.accessCode)
      );
      if (!access.ok) return Response.json({ error: access.error }, { status: 401 });

      await supabase<BonusPredictionRow[]>("bonus_predictions?on_conflict=participant_id", {
        method: "POST",
        body: JSON.stringify({
          participant_id: payload.participantId,
          champion_guess: normalizeAccessCode(payload.championGuess) || null,
          top_scorer_guess: normalizeAccessCode(payload.topScorerGuess) || null,
          updated_at: new Date().toISOString(),
        }),
        prefer: "resolution=merge-duplicates,return=representation",
      });

      return Response.json({ ok: true });
    }

    if (payload.action === "updateBonusResults") {
      await supabase<PoolSettingRow[]>("pool_settings?on_conflict=key", {
        method: "POST",
        body: JSON.stringify([
          {
            key: "champion",
            value: normalizeAccessCode(payload.champion) || null,
            updated_at: new Date().toISOString(),
          },
          {
            key: "top_scorer",
            value: normalizeAccessCode(payload.topScorer) || null,
            updated_at: new Date().toISOString(),
          },
          {
            key: "bonus_finalized",
            value: payload.bonusFinalized ? "true" : "false",
            updated_at: new Date().toISOString(),
          },
        ]),
        prefer: "resolution=merge-duplicates,return=representation",
      });

      return Response.json({ ok: true });
    }

    return Response.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    if (message.includes("duplicate key")) {
      return Response.json({ error: "Esse nome ou palpite já existe." }, { status: 409 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
