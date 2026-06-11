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

const initialMatches = [
  ["Brasil", "Rival a definir", "Grupo do Brasil", "2026-06-13T19:00:00-03:00"],
  ["Argentina", "Rival a definir", "Favoritos", "2026-06-14T16:00:00-03:00"],
  ["Portugal", "Rival a definir", "Favoritos", "2026-06-15T13:00:00-03:00"],
  ["Espanha", "Rival a definir", "Classico", "2026-06-16T16:00:00-03:00"],
  ["Franca", "Rival a definir", "Favoritos", "2026-06-17T19:00:00-03:00"],
  ["Finalista 1", "Finalista 2", "Final", "2026-07-19T16:00:00-03:00"],
] as const;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!url || !apiKey) {
    throw new Error(
      "Configure SUPABASE_URL e SUPABASE_ANON_KEY nas variaveis de ambiente."
    );
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

async function supabase<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
) {
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
    status: row.status,
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
  if (guess.home_guess === match.home_score && guess.away_guess === match.away_score) {
    return 5;
  }

  const actualDirection = Math.sign(match.home_score - match.away_score);
  const guessedDirection = Math.sign(guess.home_guess - guess.away_guess);
  const actualDiff = match.home_score - match.away_score;
  const guessedDiff = guess.home_guess - guess.away_guess;

  if (actualDirection === guessedDirection) {
    return actualDiff === guessedDiff ? 4 : 3;
  }

  return 0;
}

async function ensureSeeded() {
  const existing = await supabase<Pick<MatchRow, "id">[]>("matches?select=id&limit=1");
  if (existing.length > 0) return;

  await supabase<MatchRow[]>("matches", {
    method: "POST",
    body: JSON.stringify(
      initialMatches.map(([homeTeam, awayTeam, groupName, matchDate]) => ({
        home_team: homeTeam,
        away_team: awayTeam,
        group_name: groupName,
        match_date: matchDate,
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
      supabase<GuessRow[]>("guesses?select=*"),
    ]);

    const ranked = participantRows
      .map((participant) => {
        const participantGuesses = guessRows.filter(
          (guess) => guess.participant_id === participant.id
        );
        const total = participantGuesses.reduce((sum, guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return sum + (match ? scoreGuess(guess, match) : 0);
        }, 0);
        const exact = participantGuesses.filter((guess) => {
          const match = matchRows.find((item) => item.id === guess.match_id);
          return match && scoreGuess(guess, match) === 5;
        }).length;

        return {
          ...toParticipant(participant),
          total,
          exact,
          guesses: participantGuesses.length,
        };
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

      const exactMatches = await supabase<ParticipantRow[]>(
        `participants?select=*&name=eq.${encodeURIComponent(name)}&limit=1`
      );
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
        awayGuess < 0
      ) {
        return Response.json({ error: "Palpite invalido." }, { status: 400 });
      }

      await supabase<GuessRow[]>("guesses?on_conflict=participant_id,match_id", {
        method: "POST",
        body: JSON.stringify({
          participant_id: payload.participantId,
          match_id: payload.matchId,
          home_guess: homeGuess,
          away_guess: awayGuess,
          updated_at: new Date().toISOString(),
        }),
        prefer: "resolution=merge-duplicates,return=representation",
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
      if (!payload.participantId) {
        return Response.json({ error: "Escolha participante." }, { status: 400 });
      }
      await supabase<null>(`participants?id=eq.${payload.participantId}`, {
        method: "DELETE",
        prefer: "return=minimal",
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Acao desconhecida." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    if (message.includes("duplicate key")) {
      return Response.json({ error: "Esse nome ou palpite ja existe." }, { status: 409 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
