type ParticipantRow = {
  id: number;
  name: string;
  avatar: string;
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
  created_at: string;
};

type GuessRow = {
  id: number;
  participant_id: number;
  match_id: number;
  home_guess: number;
  away_guess: number;
  updated_at: string;
};

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
  ["2º Grupo A", "2º Grupo B", "16 avos", "2026-06-28T20:00:00.000Z"],
  ["1º Grupo E", "3º Grupo A/B/C/D/F", "16 avos", "2026-06-29T20:00:00.000Z"],
  ["1º Grupo F", "2º Grupo C", "16 avos", "2026-06-29T23:00:00.000Z"],
  ["1º Grupo C", "2º Grupo F", "16 avos", "2026-06-30T01:00:00.000Z"],
  ["1º Grupo I", "3º Grupo C/D/F/G/H", "16 avos", "2026-06-30T20:00:00.000Z"],
  ["2º Grupo E", "2º Grupo I", "16 avos", "2026-06-30T23:00:00.000Z"],
  ["1º Grupo A", "3º Grupo C/E/F/H/I", "16 avos", "2026-07-01T01:00:00.000Z"],
  ["1º Grupo L", "3º Grupo E/H/I/J/K", "16 avos", "2026-07-01T20:00:00.000Z"],
  ["1º Grupo D", "3º Grupo B/E/F/I/J", "16 avos", "2026-07-01T23:00:00.000Z"],
  ["1º Grupo G", "3º Grupo A/E/H/I/J", "16 avos", "2026-07-02T01:00:00.000Z"],
  ["2º Grupo K", "2º Grupo L", "16 avos", "2026-07-02T20:00:00.000Z"],
  ["1º Grupo H", "2º Grupo J", "16 avos", "2026-07-02T23:00:00.000Z"],
  ["1º Grupo B", "3º Grupo E/F/G/I/J", "16 avos", "2026-07-03T01:00:00.000Z"],
  ["1º Grupo J", "2º Grupo H", "16 avos", "2026-07-03T20:00:00.000Z"],
  ["1º Grupo K", "3º Grupo D/E/I/J/L", "16 avos", "2026-07-03T23:00:00.000Z"],
  ["2º Grupo D", "2º Grupo G", "16 avos", "2026-07-04T01:00:00.000Z"],
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

function getComputedStatus(match: MatchRow): "open" | "locked" | "finished" {
  if (match.home_score !== null && match.away_score !== null) return "finished";
  if (new Date() >= new Date(match.match_date)) return "locked";
  return "open";
}

function toParticipant(row: ParticipantRow) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
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
    updatedAt: row.updated_at,
  };
}

function scoreGuess(guess: GuessRow, match: MatchRow) {
  if (match.home_score === null || match.away_score === null) return 0;
  if (guess.home_guess === match.home_score && guess.away_guess === match.away_score) return 5;

  const actualDirection = Math.sign(match.home_score - match.away_score);
  const guessedDirection = Math.sign(guess.home_guess - guess.away_guess);
  const actualDiff = match.home_score - match.away_score;
  const guessedDiff = guess.home_guess - guess.away_guess;

  if (actualDirection === guessedDirection) return actualDiff === guessedDiff ? 4 : 3;
  return 0;
}

function matchKey(match: Pick<MatchRow, "home_team" | "away_team" | "match_date">) {
  return `${match.home_team}__${match.away_team}__${new Date(match.match_date).toISOString()}`;
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
  const missing = initialMatches.filter(([homeTeam, awayTeam, , matchDate]) => {
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
    const [participantRows, matchRows, guessRows] = await Promise.all([
      supabase<ParticipantRow[]>("participants?select=*&order=created_at.asc,id.asc"),
      supabase<MatchRow[]>("matches?select=*&order=match_date.asc,id.asc"),
      supabase<GuessRow[]>("guesses?select=*&order=updated_at.asc,id.asc"),
    ]);

    const ranked = participantRows
      .map((participant) => {
        const participantGuesses = guessRows.filter((guess) => guess.participant_id === participant.id);
        const total = participantGuesses.reduce((sum, guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return sum + (match ? scoreGuess(guess, match) : 0);
        }, 0);
        const exact = participantGuesses.filter((guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return match && scoreGuess(guess, match) === 5;
        }).length;

        return { ...toParticipant(participant), total, exact, guesses: participantGuesses.length };
      })
      .sort((a, b) => b.total - a.total || b.exact - a.exact || a.name.localeCompare(b.name));

    return Response.json({
      participants: ranked,
      matches: matchRows.map(toMatch),
      guesses: guessRows.map(toGuess),
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
    };

    if (payload.action === "addParticipant") {
      const name = payload.name?.trim();
      if (!name) return Response.json({ error: "Informe um nome." }, { status: 400 });

      const exactMatches = await supabase<ParticipantRow[]>(`participants?select=*&name=eq.${encodeURIComponent(name)}&limit=1`);
      if (exactMatches[0]) return Response.json({ participant: toParticipant(exactMatches[0]) });

      const avatar = name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
      const [participant] = await supabase<ParticipantRow[]>("participants", {
        method: "POST",
        body: JSON.stringify({ name, avatar }),
        prefer: "return=representation",
      });
      return Response.json({ participant: toParticipant(participant) }, { status: 201 });
    }

    if (payload.action === "saveGuess") {
      if (!payload.participantId || !payload.matchId) {
        return Response.json({ error: "Escolha participante e jogo." }, { status: 400 });
      }

      const homeGuess = payload.homeGuess;
      const awayGuess = payload.awayGuess;
      if (
        !Number.isInteger(homeGuess) ||
        !Number.isInteger(awayGuess) ||
        homeGuess === undefined ||
        awayGuess === undefined ||
        homeGuess < 0 ||
        awayGuess < 0 ||
        homeGuess > 20 ||
        awayGuess > 20
      ) {
        return Response.json({ error: "Palpite inválido." }, { status: 400 });
      }

      const [match] = await supabase<MatchRow[]>(`matches?select=*&id=eq.${payload.matchId}&limit=1`);
      if (!match) return Response.json({ error: "Jogo não encontrado." }, { status: 404 });
      if (getComputedStatus(match) !== "open") {
        return Response.json({ error: "Esse jogo já está bloqueado para palpites." }, { status: 409 });
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
        }),
        prefer: "return=representation",
      });

      return Response.json({ ok: true });
    }

    if (payload.action === "updateResult") {
      if (!payload.matchId) return Response.json({ error: "Escolha um jogo." }, { status: 400 });
      const homeScore = payload.homeScore;
      const awayScore = payload.awayScore;
      const hasResult =
        Number.isInteger(homeScore) &&
        Number.isInteger(awayScore) &&
        homeScore !== null &&
        awayScore !== null &&
        homeScore !== undefined &&
        awayScore !== undefined &&
        homeScore >= 0 &&
        awayScore >= 0;

      await supabase<null>(`matches?id=eq.${payload.matchId}`, {
        method: "PATCH",
        body: JSON.stringify({
          home_score: hasResult ? homeScore : null,
          away_score: hasResult ? awayScore : null,
          status: hasResult ? "finished" : "open",
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

    return Response.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    if (message.includes("duplicate key")) {
      return Response.json({ error: "Esse nome ou palpite já existe." }, { status: 409 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
