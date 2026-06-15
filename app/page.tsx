/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Participant = {
  id: number;
  name: string;
  avatar: string;
  hasLogin: boolean;
  total: number;
  exact: number;
  trend: number;
  championCorrect: boolean;
  guesses: number;
};

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  groupName: string;
  matchDate: string;
  status: "open" | "locked" | "finished";
  homeScore: number | null;
  awayScore: number | null;
  qualifiedTeam: string | null;
};

type Guess = {
  id: number;
  participantId: number;
  matchId: number;
  homeGuess: number;
  awayGuess: number;
  qualifiedTeamGuess: string | null;
};

type BonusPrediction = {
  participantId: number;
  championGuess: string | null;
  topScorerGuess: string | null;
};

type PoolSettings = {
  champion: string;
  topScorer: string;
  bonusFinalized: boolean;
};

type BolaoData = {
  participants: Participant[];
  matches: Match[];
  guesses: Guess[];
  bonusPredictions: BonusPrediction[];
  poolSettings: PoolSettings;
};

type GuessDraft = {
  homeGuess: number;
  awayGuess: number;
  qualifiedTeamGuess: string;
};

type GuessTab = "brasil" | "todos";

const emptyData: BolaoData = {
  participants: [],
  matches: [],
  guesses: [],
  bonusPredictions: [],
  poolSettings: {
    champion: "",
    topScorer: "",
    bonusFinalized: false,
  },
};

const GUESS_DEADLINE_MINUTES = 30;
const FIRST_BRAZIL_MATCH_DATE = new Date("2026-06-13T22:00:00.000Z");

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
}

function normalizeTeamName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isBrazilMatch(match: Match) {
  const home = normalizeTeamName(match.homeTeam);
  const away = normalizeTeamName(match.awayTeam);

  return home === "brasil" || home === "brazil" || away === "brasil" || away === "brazil";
}

function getBrazilOpponent(match: Match) {
  const home = normalizeTeamName(match.homeTeam);
  return home === "brasil" || home === "brazil" ? match.awayTeam : match.homeTeam;
}

function hasOfficialResult(match: Match) {
  return match.homeScore !== null && match.awayScore !== null;
}

function hasMatchStarted(match: Match) {
  return new Date() >= new Date(match.matchDate);
}

function hasGuessDeadlinePassed(match: Match) {
  return Date.now() >= new Date(match.matchDate).getTime() - GUESS_DEADLINE_MINUTES * 60 * 1000;
}

function getMatchStatus(match: Match): Match["status"] {
  if (hasOfficialResult(match) && hasMatchStarted(match)) return "finished";
  if (hasGuessDeadlinePassed(match)) return "locked";
  return "open";
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

function hasDefinedTeams(match: Match) {
  return isDefinedTeam(match.homeTeam) && isDefinedTeam(match.awayTeam);
}

function isKnockoutMatch(match: Match) {
  return !normalizeTeamName(match.groupName).startsWith("grupo ");
}

function statusLabel(match: Match) {
  const status = getMatchStatus(match);
  if (!hasDefinedTeams(match)) return "times pendentes";
  if (status === "finished") return "encerrado";
  if (status === "locked") return "bloqueado";
  return "aberto";
}

function findGuess(guesses: Guess[], participantId: number | null, matchId: number) {
  if (!participantId) return undefined;
  return guesses.find(
    (guess) => guess.participantId === participantId && guess.matchId === matchId
  );
}

function getGuessResult(guess: Guess, match: Match) {
  if (match.homeScore === null || match.awayScore === null) {
    return {
      label: "Aguardando resultado",
      points: null as number | null,
      className: "bg-[#edf1ee] text-[#5e6a63]",
      rowClassName: "bg-white",
    };
  }

  const exact = guess.homeGuess === match.homeScore && guess.awayGuess === match.awayScore;
  const actualDirection = Math.sign(match.homeScore - match.awayScore);
  const guessedDirection = Math.sign(guess.homeGuess - guess.awayGuess);
  const trend = actualDirection === guessedDirection;

  if (exact) {
    return {
      label: "Placar exato",
      points: 10,
      className: "bg-[#1d6b57] text-white",
      rowClassName: "bg-[#eef8f3]",
    };
  }

  if (trend) {
    const actualDiff = match.homeScore - match.awayScore;
    const guessedDiff = guess.homeGuess - guess.awayGuess;
    const actualWinnerGoals =
      actualDirection > 0 ? match.homeScore : actualDirection < 0 ? match.awayScore : null;
    const guessedWinnerGoals =
      actualDirection > 0 ? guess.homeGuess : actualDirection < 0 ? guess.awayGuess : null;
    const points =
      actualWinnerGoals !== null && guessedWinnerGoals === actualWinnerGoals
        ? 5
        : actualDiff === guessedDiff
          ? 3
          : 2;

    return {
      label: "Tendência",
      points,
      className: "bg-[#f0c44c] text-[#18211f]",
      rowClassName: "bg-[#fff9e7]",
    };
  }

  return {
    label: "Sem ponto",
    points: 0,
    className: "bg-[#edf1ee] text-[#5e6a63]",
    rowClassName: "bg-white",
  };
}

export default function Home() {
  const [data, setData] = useState<BolaoData>(emptyData);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loginParticipantId, setLoginParticipantId] = useState<number | null>(null);
  const [viewedParticipantId, setViewedParticipantId] = useState<number | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [qualifiedTeam, setQualifiedTeam] = useState("");
  const [championGuess, setChampionGuess] = useState("");
  const [topScorerGuess, setTopScorerGuess] = useState("");
  const [championResult, setChampionResult] = useState("");
  const [topScorerResult, setTopScorerResult] = useState("");
  const [bonusFinalized, setBonusFinalized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Carregando bolão...");
  const [activeTab, setActiveTab] = useState<GuessTab>("brasil");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("todos");
  const [drafts, setDrafts] = useState<Record<number, GuessDraft>>({});

  async function load() {
    const response = await fetch("/api/bolao", { cache: "no-store" });
    const nextData = (await response.json()) as BolaoData & { error?: string };

    if (!response.ok) throw new Error(nextData.error ?? "Não foi possível carregar.");

    setData(nextData);
    setLoginParticipantId((current) => current ?? nextData.participants[0]?.id ?? null);
    setViewedParticipantId((current) => current ?? nextData.participants[0]?.id ?? null);
    setSelectedMatchId((current) => current ?? nextData.matches[0]?.id ?? null);
    setMessage("Tudo pronto para os palpites.");
  }

  useEffect(() => {
    load().catch((error) =>
      setMessage(error instanceof Error ? error.message : "Erro ao carregar.")
    );
  }, []);

  const selectedMatch = useMemo(
    () => data.matches.find((match) => match.id === selectedMatchId) ?? data.matches[0],
    [data.matches, selectedMatchId]
  );

  useEffect(() => {
    if (
      selectedMatch &&
      selectedMatch.homeScore !== null &&
      selectedMatch.awayScore !== null
    ) {
      setHomeScore(selectedMatch.homeScore);
      setAwayScore(selectedMatch.awayScore);
      setQualifiedTeam(selectedMatch.qualifiedTeam ?? "");
    } else {
      setHomeScore(0);
      setAwayScore(0);
      setQualifiedTeam("");
    }
  }, [selectedMatch]);

  useEffect(() => {
    if (!selectedParticipantId) {
      setDrafts({});
      return;
    }

    const nextDrafts: Record<number, GuessDraft> = {};

    data.matches.forEach((match) => {
      const existingGuess = findGuess(data.guesses, selectedParticipantId, match.id);
      nextDrafts[match.id] = {
        homeGuess: existingGuess?.homeGuess ?? 0,
        awayGuess: existingGuess?.awayGuess ?? 0,
        qualifiedTeamGuess: existingGuess?.qualifiedTeamGuess ?? "",
      };
    });

    setDrafts(nextDrafts);
  }, [data.guesses, data.matches, selectedParticipantId]);

  const leader = data.participants[0];

  const selectedParticipant = useMemo(
    () => data.participants.find((participant) => participant.id === selectedParticipantId),
    [data.participants, selectedParticipantId]
  );

  const loginParticipant = useMemo(
    () => data.participants.find((participant) => participant.id === loginParticipantId),
    [data.participants, loginParticipantId]
  );

  const viewedParticipant = useMemo(
    () => data.participants.find((participant) => participant.id === viewedParticipantId),
    [data.participants, viewedParticipantId]
  );

  const selectedBonusPrediction = useMemo(
    () => data.bonusPredictions.find((prediction) => prediction.participantId === selectedParticipantId),
    [data.bonusPredictions, selectedParticipantId]
  );

  useEffect(() => {
    setChampionGuess(selectedBonusPrediction?.championGuess ?? "");
    setTopScorerGuess(selectedBonusPrediction?.topScorerGuess ?? "");
  }, [selectedBonusPrediction]);

  useEffect(() => {
    setChampionResult(data.poolSettings.champion);
    setTopScorerResult(data.poolSettings.topScorer);
    setBonusFinalized(data.poolSettings.bonusFinalized);
  }, [data.poolSettings.bonusFinalized, data.poolSettings.champion, data.poolSettings.topScorer]);

  const brazilMatches = useMemo(
    () => data.matches.filter(isBrazilMatch),
    [data.matches]
  );

  const tabMatches = useMemo(() => {
    return activeTab === "brasil" ? brazilMatches : data.matches;
  }, [activeTab, brazilMatches, data.matches]);

  const groupOptions = useMemo(() => {
    return Array.from(new Set(tabMatches.map((match) => match.groupName))).sort();
  }, [tabMatches]);

  const filteredMatches = useMemo(() => {
    const normalizedSearch = normalizeTeamName(search);

    return tabMatches.filter((match) => {
      const matchesGroup = groupFilter === "todos" || match.groupName === groupFilter;
      const matchesSearch =
        !normalizedSearch ||
        normalizeTeamName(match.homeTeam).includes(normalizedSearch) ||
        normalizeTeamName(match.awayTeam).includes(normalizedSearch) ||
        normalizeTeamName(match.groupName).includes(normalizedSearch);

      return matchesGroup && matchesSearch;
    });
  }, [groupFilter, search, tabMatches]);

  const matchesByDay = useMemo(() => {
    const groups = new Map<string, Match[]>();

    filteredMatches.forEach((match) => {
      const dayKey = new Date(match.matchDate).toISOString().slice(0, 10);
      groups.set(dayKey, [...(groups.get(dayKey) ?? []), match]);
    });

    return Array.from(groups.entries()).map(([dayKey, matches]) => ({
      dayKey,
      label: formatDay(matches[0].matchDate),
      matches,
    }));
  }, [filteredMatches]);

  const allMatchesByDay = useMemo(() => {
    const groups = new Map<string, Match[]>();

    data.matches.forEach((match) => {
      const dayKey = new Date(match.matchDate).toISOString().slice(0, 10);
      groups.set(dayKey, [...(groups.get(dayKey) ?? []), match]);
    });

    return Array.from(groups.entries()).map(([dayKey, matches]) => ({
      dayKey,
      label: formatDay(matches[0].matchDate),
      matches,
    }));
  }, [data.matches]);

  const tabGuessCount = useMemo(() => {
    if (!selectedParticipantId) return 0;
    const matchIds = new Set(tabMatches.map((match) => match.id));
    return data.guesses.filter(
      (guess) => guess.participantId === selectedParticipantId && matchIds.has(guess.matchId)
    ).length;
  }, [data.guesses, selectedParticipantId, tabMatches]);

  const saveableVisibleCount = useMemo(() => {
    if (!selectedParticipantId) return 0;

    return filteredMatches.filter((match) => {
      const alreadyGuessed = Boolean(findGuess(data.guesses, selectedParticipantId, match.id));
      return !alreadyGuessed && hasDefinedTeams(match) && getMatchStatus(match) === "open";
    }).length;
  }, [data.guesses, filteredMatches, selectedParticipantId]);

  async function post(payload: Record<string, unknown>) {
    const response = await fetch("/api/bolao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { error?: string; participant?: Participant };
    if (!response.ok) throw new Error(result.error ?? "Não foi possível salvar.");
    return result;
  }

  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setMessage("Salvando...");

    try {
      const result = await post(payload);
      if (result.participant) {
        setSelectedParticipantId(result.participant.id);
        setLoginParticipantId(result.participant.id);
        setViewedParticipantId(result.participant.id);
      }
      await load();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  function addParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const participantName = name.trim();
    if (!participantName) return;

    send(
      { action: "addParticipant", name: participantName, accessCode },
      `${participantName} entrou no bolão.`
    );
    setName("");
  }

  async function login() {
    if (!loginParticipantId) {
      setMessage("Escolha quem está entrando.");
      return;
    }

    setBusy(true);
    setMessage("Entrando...");

    try {
      const result = await post({
        action: "loginParticipant",
        participantId: loginParticipantId,
        accessCode,
      });

      if (result.participant) {
        setSelectedParticipantId(result.participant.id);
        setViewedParticipantId(result.participant.id);
      }

      await load();
      setMessage(`${result.participant?.name ?? "Participante"} entrou no bolão.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao entrar.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setSelectedParticipantId(null);
    setAccessCode("");
    setMessage("Escolha seu nome e entre com seu PIN antes de palpitar.");
  }

  function updateResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (selectedMatch && !hasDefinedTeams(selectedMatch)) {
      setMessage("Defina os dois times antes de lançar placar para esse jogo.");
      return;
    }

    if (selectedMatch && !hasMatchStarted(selectedMatch)) {
      setMessage("Esse jogo ainda não aconteceu. O resultado oficial só pode ser fechado depois da data do jogo.");
      return;
    }

    send(
      {
        action: "updateResult",
        matchId: selectedMatch?.id,
        homeScore,
        awayScore,
        qualifiedTeam,
      },
      "Resultado atualizado e ranking recalculado."
    );
  }

  function clearResult() {
    if (!selectedMatch) return;

    send(
      {
        action: "clearResult",
        matchId: selectedMatch.id,
      },
      "Resultado removido. O jogo voltou a ficar aberto até a data da partida."
    );
  }

  function updateDraft(matchId: number, field: "homeGuess" | "awayGuess", value: number) {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        homeGuess: current[matchId]?.homeGuess ?? 0,
        awayGuess: current[matchId]?.awayGuess ?? 0,
        qualifiedTeamGuess: current[matchId]?.qualifiedTeamGuess ?? "",
        [field]: Number.isFinite(value) ? value : 0,
      },
    }));
  }

  function updateQualifiedDraft(matchId: number, value: string) {
    setDrafts((current) => ({
      ...current,
      [matchId]: {
        homeGuess: current[matchId]?.homeGuess ?? 0,
        awayGuess: current[matchId]?.awayGuess ?? 0,
        qualifiedTeamGuess: value,
      },
    }));
  }

  async function saveVisibleGuesses(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedParticipantId) {
      setMessage("Adicione ou selecione um participante antes de salvar.");
      return;
    }

    const matchesToSave = filteredMatches.filter((match) => {
      const alreadyGuessed = Boolean(findGuess(data.guesses, selectedParticipantId, match.id));
      return !alreadyGuessed && hasDefinedTeams(match) && getMatchStatus(match) === "open";
    });

    if (matchesToSave.length === 0) {
      setMessage("Não há jogos disponíveis para salvar nesta lista.");
      return;
    }

    setBusy(true);
    setMessage("Salvando palpites...");

    try {
      for (const match of matchesToSave) {
        const draft = drafts[match.id] ?? { homeGuess: 0, awayGuess: 0, qualifiedTeamGuess: "" };
        await post({
          action: "saveGuess",
          participantId: selectedParticipantId,
          matchId: match.id,
          homeGuess: draft.homeGuess,
          awayGuess: draft.awayGuess,
          qualifiedTeamGuess: draft.qualifiedTeamGuess,
          accessCode,
        });
      }

      await load();
      setMessage(
        activeTab === "brasil"
          ? "Palpites dos jogos do Brasil salvos e bloqueados."
          : "Palpites dos jogos selecionados salvos e bloqueados."
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar.");
    } finally {
      setBusy(false);
    }
  }

  function changeTab(tab: GuessTab) {
    setActiveTab(tab);
    setSearch("");
    setGroupFilter("todos");
  }

  async function deleteGuess(guess: Guess) {
    if (!selectedParticipantId || guess.participantId !== selectedParticipantId) {
      setMessage("Entre como esse participante para apagar o palpite.");
      return;
    }

    send(
      {
        action: "deleteGuess",
        participantId: selectedParticipantId,
        guessId: guess.id,
        accessCode,
      },
      "Palpite apagado."
    );
  }

  async function deleteViewedParticipantGuesses() {
    if (!selectedParticipantId || viewedParticipantId !== selectedParticipantId) {
      setMessage("Entre como esse participante para apagar os palpites dele.");
      return;
    }

    send(
      {
        action: "deleteParticipantGuesses",
        participantId: selectedParticipantId,
        accessCode,
      },
      "Todos os palpites desse participante foram apagados."
    );
  }

  function saveBonusPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedParticipantId) {
      setMessage("Entre como participante antes de salvar os bônus.");
      return;
    }

    send(
      {
        action: "saveBonusPrediction",
        participantId: selectedParticipantId,
        accessCode,
        championGuess,
        topScorerGuess,
      },
      "Previsões extras salvas."
    );
  }

  function updateBonusResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    send(
      {
        action: "updateBonusResults",
        champion: championResult,
        topScorer: topScorerResult,
        bonusFinalized,
      },
      "Resultados extras atualizados."
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6f4] text-[#18211f]">
      <section className="border-b border-[#d7dfd9] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div className="flex flex-col justify-between gap-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1d6b57]">
                  Copa 2026 em família
                </p>
                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-6xl">
                  Bolão da Copa
                </h1>
              </div>
              <div className="hidden h-20 w-20 place-items-center rounded-full bg-[#1d6b57] text-4xl text-white shadow-sm sm:grid">
                26
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <SummaryCard label="Participantes" value={data.participants.length} />
              <SummaryCard label="Jogos" value={data.matches.length} />
              <SummaryCard label="Palpites" value={data.guesses.length} />
              <SummaryCard label="Líder" value={leader?.name ?? "-"} />
            </div>
          </div>

          <form
            onSubmit={addParticipant}
            className="rounded-lg border border-[#d7dfd9] bg-white p-5 shadow-sm"
          >
            <label className="text-sm font-semibold text-[#405047]" htmlFor="name">
              Novo participante
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px]">
              <input
                id="name"
                className="min-h-12 flex-1 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome da pessoa"
              />
              <input
                className="min-h-12 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={accessCode}
                onChange={(event) => setAccessCode(event.target.value)}
                placeholder="PIN"
                type="password"
                inputMode="numeric"
              />
              <button
                disabled={busy || !name.trim() || accessCode.trim().length < 4}
                className="min-h-12 rounded-md bg-[#1d6b57] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aa79f] sm:col-span-2"
              >
                Adicionar
              </button>
            </div>
            <p className="mt-4 text-sm text-[#5e6a63]">{message}</p>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black">Ranking</h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-[#d7dfd9] bg-white">
              {data.participants.length === 0 ? (
                <p className="p-5 text-[#5e6a63]">Adicione a primeira pessoa da família.</p>
              ) : (
                data.participants.map((participant, index) => (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => setViewedParticipantId(participant.id)}
                    className={`grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-[#e7ede9] p-4 text-left last:border-b-0 ${
                      viewedParticipantId === participant.id ? "bg-[#e7f4ef]" : "bg-white"
                    }`}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f0c44c] font-black">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{participant.name}</p>
                      <p className="text-sm text-[#5e6a63]">
                        {participant.exact} exatos · {participant.trend} tendências · {participant.guesses} palpites
                      </p>
                    </div>
                    <strong className="text-2xl">{participant.total}</strong>
                  </button>
                ))
              )}
            </div>
          </div>

          <ParticipantGuessesPanel
            data={data}
            viewedParticipant={viewedParticipant}
            loggedParticipantId={selectedParticipantId}
            onDeleteGuess={deleteGuess}
            onDeleteAll={deleteViewedParticipantGuesses}
            busy={busy}
          />

          <form
            onSubmit={saveBonusPrediction}
            className="rounded-lg border border-[#d7dfd9] bg-white p-5"
          >
            <h2 className="text-xl font-black">Previsões extras</h2>
            <p className="mt-1 text-sm text-[#5e6a63]">
              Campeão vale 20 pontos. Artilheiro vale 15 pontos.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className="min-h-12 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={championGuess}
                onChange={(event) => setChampionGuess(event.target.value)}
                placeholder="Campeão da Copa"
                disabled={Date.now() >= FIRST_BRAZIL_MATCH_DATE.getTime()}
              />
              <input
                className="min-h-12 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={topScorerGuess}
                onChange={(event) => setTopScorerGuess(event.target.value)}
                placeholder="Artilheiro"
                disabled={Date.now() >= FIRST_BRAZIL_MATCH_DATE.getTime()}
              />
            </div>
            <button
              disabled={
                busy ||
                !selectedParticipantId ||
                accessCode.trim().length < 4 ||
                Date.now() >= FIRST_BRAZIL_MATCH_DATE.getTime()
              }
              className="mt-4 min-h-12 w-full rounded-md bg-[#1d6b57] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
            >
              Salvar previsões extras
            </button>
          </form>

          <form
            onSubmit={updateResult}
            className="rounded-lg border border-[#d7dfd9] bg-white p-5"
          >
            <h2 className="text-xl font-black">Resultado oficial</h2>
            <p className="mt-1 text-sm text-[#5e6a63]">
              Use somente depois que a partida acontecer. Antes da data do jogo, o sistema não deixa fechar resultado.
            </p>
            <div className="mt-4 grid grid-cols-[1fr_72px_72px] items-end gap-3">
              <label className="text-sm font-semibold">
                Jogo
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                  value={selectedMatch?.id ?? ""}
                  onChange={(event) => setSelectedMatchId(Number(event.target.value))}
                >
                  {allMatchesByDay.map((day) => (
                    <optgroup key={day.dayKey} label={day.label}>
                      {day.matches.map((match) => (
                        <option key={match.id} value={match.id}>
                          {match.homeTeam} x {match.awayTeam}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <ScoreInput label="Casa" value={homeScore} onChange={setHomeScore} />
              <ScoreInput label="Fora" value={awayScore} onChange={setAwayScore} />
            </div>
            {selectedMatch && isKnockoutMatch(selectedMatch) && hasDefinedTeams(selectedMatch) && (
              <label className="mt-3 block text-sm font-semibold">
                Classificado
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                  value={qualifiedTeam}
                  onChange={(event) => setQualifiedTeam(event.target.value)}
                >
                  <option value="">Sem classificado</option>
                  <option value={selectedMatch.homeTeam}>{selectedMatch.homeTeam}</option>
                  <option value={selectedMatch.awayTeam}>{selectedMatch.awayTeam}</option>
                </select>
              </label>
            )}
            {selectedMatch && !hasMatchStarted(selectedMatch) && (
              <p className="mt-3 rounded-md bg-[#fff4d2] px-3 py-2 text-sm font-bold text-[#7a5a00]">
                Esse jogo ainda não aconteceu. Resultado oficial só depois da partida.
              </p>
            )}
            {selectedMatch && !hasDefinedTeams(selectedMatch) && (
              <p className="mt-3 rounded-md bg-[#fff4d2] px-3 py-2 text-sm font-bold text-[#7a5a00]">
                Placar bloqueado até os dois times estarem definidos.
              </p>
            )}

            <button
              disabled={
                busy ||
                !selectedMatch ||
                !hasDefinedTeams(selectedMatch) ||
                !hasMatchStarted(selectedMatch)
              }
              className="mt-4 min-h-12 w-full rounded-md bg-[#18211f] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
            >
              Fechar resultado
            </button>

            {selectedMatch && hasOfficialResult(selectedMatch) && (
              <button
                type="button"
                onClick={clearResult}
                disabled={busy}
                className="mt-3 min-h-12 w-full rounded-md border border-[#c23d2f] px-5 font-bold text-[#c23d2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Limpar resultado lançado por engano
              </button>
            )}
          </form>

          <form
            onSubmit={updateBonusResults}
            className="rounded-lg border border-[#d7dfd9] bg-white p-5"
          >
            <h2 className="text-xl font-black">Resultado das previsões extras</h2>
            <p className="mt-1 text-sm text-[#5e6a63]">
              Só marque a pontuação dos bônus depois da Copa terminar.
            </p>
            <div className="mt-4 grid gap-3">
              <input
                className="min-h-12 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={championResult}
                onChange={(event) => setChampionResult(event.target.value)}
                placeholder="Campeão oficial"
              />
              <input
                className="min-h-12 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={topScorerResult}
                onChange={(event) => setTopScorerResult(event.target.value)}
                placeholder="Artilheiro oficial"
              />
              <label className="flex items-start gap-3 rounded-md border border-[#d7dfd9] bg-[#f8faf8] p-3 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={bonusFinalized}
                  onChange={(event) => setBonusFinalized(event.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>Liberar pontuação dos bônus de campeão e artilheiro</span>
              </label>
            </div>
            <button
              disabled={busy}
              className="mt-4 min-h-12 w-full rounded-md bg-[#18211f] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
            >
              Atualizar bônus oficiais
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={saveVisibleGuesses}
            className="rounded-lg border border-[#d7dfd9] bg-white p-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-2xl font-black">Fazer palpites</h2>
                <p className="mt-1 text-sm text-[#5e6a63]">
                  Exato 10 · vencedor + gols do ganhador 5 · saldo 3 · tendência 2.
                </p>
              </div>
              <div className="rounded-lg bg-[#e7f4ef] px-4 py-3 text-sm font-bold text-[#1d6b57]">
                {tabGuessCount} de {tabMatches.length} palpites
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#d7dfd9] bg-[#f8faf8] p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
                <label className="text-sm font-semibold">
                  Participante
                  <select
                    className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                    value={loginParticipantId ?? ""}
                    onChange={(event) => setLoginParticipantId(Number(event.target.value))}
                  >
                    {data.participants.length === 0 && <option value="">Adicione um participante</option>}
                    {data.participants.map((participant) => (
                      <option key={participant.id} value={participant.id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold">
                  PIN
                  <input
                    className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value)}
                    type="password"
                    inputMode="numeric"
                    placeholder="4 dígitos"
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={login}
                    disabled={busy || !loginParticipantId || accessCode.trim().length < 4}
                    className="min-h-12 rounded-md bg-[#1d6b57] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
                  >
                    Entrar
                  </button>
                  {selectedParticipantId && (
                    <button
                      type="button"
                      onClick={logout}
                      className="min-h-12 rounded-md border border-[#b8c6bd] px-4 font-bold text-[#405047]"
                    >
                      Sair
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-[#1d6b57]">
                {selectedParticipant
                  ? `Você está lançando como ${selectedParticipant.name}.`
                  : loginParticipant?.hasLogin
                    ? "Entre com o PIN dessa pessoa antes de salvar."
                  : "Primeiro acesso: esse PIN será definido para essa pessoa."}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 rounded-lg bg-[#f3f6f4] p-1">
              <button
                type="button"
                onClick={() => changeTab("brasil")}
                className={`min-h-11 rounded-md px-3 text-sm font-black transition ${
                  activeTab === "brasil" ? "bg-[#1d6b57] text-white shadow-sm" : "text-[#405047]"
                }`}
              >
                🇧🇷 Jogos do Brasil
              </button>
              <button
                type="button"
                onClick={() => changeTab("todos")}
                className={`min-h-11 rounded-md px-3 text-sm font-black transition ${
                  activeTab === "todos" ? "bg-[#1d6b57] text-white shadow-sm" : "text-[#405047]"
                }`}
              >
                🌎 Todos os jogos
              </button>
            </div>

            {activeTab === "brasil" && brazilMatches.length > 0 && (
              <div className="mt-4 grid gap-2 rounded-lg border border-[#1d6b57] bg-[#e7f4ef] p-4 sm:grid-cols-3">
                {brazilMatches.map((match) => (
                  <button
                    type="button"
                    key={match.id}
                    onClick={() => setSelectedMatchId(match.id)}
                    className="rounded-md bg-white px-3 py-2 text-left text-sm font-bold text-[#1d6b57] shadow-sm"
                  >
                    Brasil x {getBrazilOpponent(match)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_190px]">
              <input
                className="min-h-12 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar seleção ou fase"
              />
              <select
                className="min-h-12 rounded-md border border-[#b8c6bd] px-3"
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value)}
              >
                <option value="todos">Todas as fases</option>
                {groupOptions.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[#5e6a63]">
              <span>Mostrando {filteredMatches.length} de {tabMatches.length} jogos</span>
              <span>
                {activeTab === "brasil"
                  ? "Brasil: Marrocos, Haiti e Escócia"
                  : "Calendário completo por dia"}
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              {filteredMatches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#b8c6bd] p-5 text-center text-[#5e6a63]">
                  Nenhum jogo encontrado.
                </div>
              ) : (
                matchesByDay.map((day) => (
                  <section key={day.dayKey} className="rounded-lg border border-[#d7dfd9] bg-[#f8faf8] p-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-lg font-black capitalize">{day.label}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#5e6a63]">
                        {day.matches.length} jogos
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {day.matches.map((match) => {
                        const draft = drafts[match.id] ?? { homeGuess: 0, awayGuess: 0, qualifiedTeamGuess: "" };
                        const existingGuess = findGuess(data.guesses, selectedParticipantId, match.id);
                        const alreadyGuessed = Boolean(existingGuess);
                        const teamsDefined = hasDefinedTeams(match);
                        const locked =
                          busy ||
                          !selectedParticipantId ||
                          alreadyGuessed ||
                          !teamsDefined ||
                          getMatchStatus(match) !== "open";
                        const brazilMatch = isBrazilMatch(match);

                        return (
                          <div
                            key={match.id}
                            className={`rounded-lg border p-4 transition ${
                              brazilMatch ? "border-[#1d6b57] bg-[#e7f4ef]" : "border-[#d7dfd9] bg-white"
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-[#1d6b57]">{match.groupName}</p>
                                <p className="mt-1 text-sm text-[#5e6a63]">{formatDate(match.matchDate)}</p>
                              </div>
                              <span className="rounded-full bg-[#18211f] px-3 py-1 text-xs font-bold text-white">
                                {statusLabel(match)}
                              </span>
                            </div>

                            {brazilMatch && (
                              <p className="mt-3 rounded-md bg-[#1d6b57] px-3 py-2 text-sm font-black text-white">
                                Brasil contra {getBrazilOpponent(match)}
                              </p>
                            )}

                            <div className="mt-4 grid grid-cols-[1fr_72px_28px_72px_1fr] items-center gap-2">
                              <strong className="truncate text-right">{match.homeTeam}</strong>
                              <ScoreInput
                                label=""
                                value={draft.homeGuess}
                                disabled={locked}
                                onChange={(value) => updateDraft(match.id, "homeGuess", value)}
                              />
                              <span className="text-center font-black">x</span>
                              <ScoreInput
                                label=""
                                value={draft.awayGuess}
                                disabled={locked}
                                onChange={(value) => updateDraft(match.id, "awayGuess", value)}
                              />
                              <strong className="truncate">{match.awayTeam}</strong>
                            </div>

                            {isKnockoutMatch(match) && teamsDefined && (
                              <label className="mt-3 block text-sm font-semibold">
                                Quem classifica? +2 pontos
                                <select
                                  className="mt-2 min-h-11 w-full rounded-md border border-[#b8c6bd] px-3"
                                  value={draft.qualifiedTeamGuess}
                                  disabled={locked}
                                  onChange={(event) => updateQualifiedDraft(match.id, event.target.value)}
                                >
                                  <option value="">Escolha no mata-mata</option>
                                  <option value={match.homeTeam}>{match.homeTeam}</option>
                                  <option value={match.awayTeam}>{match.awayTeam}</option>
                                </select>
                              </label>
                            )}

                            {!teamsDefined && (
                              <p className="mt-3 rounded-md bg-[#fff4d2] px-3 py-2 text-sm font-bold text-[#7a5a00]">
                                Placar bloqueado até os dois times estarem definidos.
                              </p>
                            )}

                            {alreadyGuessed && (
                              <p className="mt-3 rounded-md bg-[#fff4d2] px-3 py-2 text-sm font-bold text-[#7a5a00]">
                                Palpite enviado por {selectedParticipant?.name}. Não pode mais alterar.
                              </p>
                            )}

                            {getMatchStatus(match) === "locked" && !alreadyGuessed && teamsDefined && (
                              <p className="mt-3 rounded-md bg-[#edf1ee] px-3 py-2 text-sm font-bold text-[#5e6a63]">
                                Jogo bloqueado porque faltam menos de {GUESS_DEADLINE_MINUTES} minutos.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            <button
              disabled={busy || !selectedParticipantId || saveableVisibleCount === 0}
              className="mt-5 min-h-12 w-full rounded-md bg-[#c23d2f] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#c9a7a2]"
            >
              {activeTab === "brasil" ? "Salvar palpites do Brasil" : "Salvar palpites dos jogos exibidos"}
            </button>
          </form>

          <GuessesPanel
            data={data}
            selectedMatch={selectedMatch}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={setSelectedMatchId}
          />
        </div>
      </section>
    </main>
  );
}

function GuessesPanel({
  data,
  selectedMatch,
  selectedMatchId,
  setSelectedMatchId,
}: {
  data: BolaoData;
  selectedMatch: Match | undefined;
  selectedMatchId: number | null;
  setSelectedMatchId: (value: number) => void;
}) {
  const allMatchesByDay = useMemo(() => {
    const groups = new Map<string, Match[]>();

    data.matches.forEach((match) => {
      const dayKey = new Date(match.matchDate).toISOString().slice(0, 10);
      groups.set(dayKey, [...(groups.get(dayKey) ?? []), match]);
    });

    return Array.from(groups.entries()).map(([dayKey, matches]) => ({
      dayKey,
      label: formatDay(matches[0].matchDate),
      matches,
    }));
  }, [data.matches]);

  return (
    <div className="rounded-lg border border-[#d7dfd9] bg-white p-5">
      <h2 className="text-2xl font-black">Painel de palpites por jogo</h2>
      <p className="mt-1 text-sm text-[#5e6a63]">
        Veja o palpite que cada pessoa deu para a partida escolhida.
      </p>

      <label className="mt-4 block text-sm font-semibold">
        Escolha o jogo
        <select
          className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
          value={selectedMatchId ?? ""}
          onChange={(event) => setSelectedMatchId(Number(event.target.value))}
        >
          {allMatchesByDay.map((day) => (
            <optgroup key={day.dayKey} label={day.label}>
              {day.matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.homeTeam} x {match.awayTeam}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {selectedMatch && (
        <div className="mt-4 overflow-hidden rounded-lg border border-[#e7ede9]">
          <div className="bg-[#f3f6f4] p-4">
            <p className="text-sm font-bold text-[#1d6b57]">{selectedMatch.groupName}</p>
            <h3 className="mt-1 text-xl font-black">
              {selectedMatch.homeTeam} x {selectedMatch.awayTeam}
            </h3>
            <p className="mt-1 text-sm text-[#5e6a63]">
              {formatDate(selectedMatch.matchDate)} · {statusLabel(selectedMatch)}
            </p>

            {selectedMatch.homeScore !== null && selectedMatch.awayScore !== null ? (
              <div className="mt-4 inline-flex items-center gap-3 rounded-lg bg-[#f0c44c] px-4 py-3 font-black text-[#18211f]">
                <span>
                  {hasMatchStarted(selectedMatch)
                    ? "Resultado oficial"
                    : "Resultado lançado antes da data"}
                </span>
                <span className="text-2xl">
                  {selectedMatch.homeScore} x {selectedMatch.awayScore}
                </span>
              </div>
            ) : (
              <div className="mt-4 inline-flex rounded-lg bg-[#edf1ee] px-4 py-3 text-sm font-bold text-[#5e6a63]">
                Resultado oficial ainda não informado
              </div>
            )}
          </div>

          {data.participants.length === 0 ? (
            <p className="p-4 text-[#5e6a63]">Nenhum participante cadastrado.</p>
          ) : (
            data.participants.map((participant) => {
              const guess = data.guesses.find(
                (item) => item.participantId === participant.id && item.matchId === selectedMatch.id
              );
              const result = guess ? getGuessResult(guess, selectedMatch) : null;

              return (
                <div
                  key={participant.id}
                  className={`grid grid-cols-[1fr_auto] items-center gap-3 border-t border-[#e7ede9] p-4 ${result?.rowClassName ?? "bg-white"}`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold">{participant.name}</p>
                    <p className="text-sm text-[#5e6a63]">
                      {participant.exact} exatos · {participant.trend} tendências · {participant.total} pontos
                    </p>
                  </div>
                  {guess && result ? (
                    <div className="text-right">
                      <strong className={`rounded-md px-3 py-2 text-lg ${result.className}`}>
                        {guess.homeGuess} x {guess.awayGuess}
                      </strong>
                      <p className="mt-2 text-xs font-black text-[#18211f]">
                        {result.label}{result.points !== null ? ` · ${result.points} pts` : ""}
                      </p>
                      {guess.qualifiedTeamGuess && (
                        <p className="mt-2 text-xs font-bold text-[#1d6b57]">
                          Classifica: {guess.qualifiedTeamGuess}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="rounded-md bg-[#edf1ee] px-3 py-2 text-sm font-bold text-[#5e6a63]">
                      Sem palpite
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ParticipantGuessesPanel({
  data,
  viewedParticipant,
  loggedParticipantId,
  onDeleteGuess,
  onDeleteAll,
  busy,
}: {
  data: BolaoData;
  viewedParticipant: Participant | undefined;
  loggedParticipantId: number | null;
  onDeleteGuess: (guess: Guess) => void;
  onDeleteAll: () => void;
  busy: boolean;
}) {
  const participantGuesses = useMemo(() => {
    if (!viewedParticipant) return [];

    return data.guesses
      .filter((guess) => guess.participantId === viewedParticipant.id)
      .map((guess) => ({
        guess,
        match: data.matches.find((match) => match.id === guess.matchId),
      }))
      .filter((item): item is { guess: Guess; match: Match } => Boolean(item.match))
      .sort((a, b) => new Date(a.match.matchDate).getTime() - new Date(b.match.matchDate).getTime());
  }, [data.guesses, data.matches, viewedParticipant]);

  if (!viewedParticipant) {
    return (
      <div className="rounded-lg border border-[#d7dfd9] bg-white p-5 text-[#5e6a63]">
        Clique em um nome no ranking para ver os palpites.
      </div>
    );
  }

  const canDelete = loggedParticipantId === viewedParticipant.id;

  return (
    <div className="rounded-lg border border-[#d7dfd9] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black">Palpites de {viewedParticipant.name}</h2>
          <p className="mt-1 text-sm text-[#5e6a63]">
            {viewedParticipant.exact} exatos · {viewedParticipant.trend} tendências · {viewedParticipant.total} pontos · {participantGuesses.length} palpites
          </p>
        </div>
        {canDelete && participantGuesses.length > 0 && (
          <button
            type="button"
            onClick={onDeleteAll}
            disabled={busy}
            className="min-h-10 rounded-md border border-[#c23d2f] px-3 text-sm font-bold text-[#c23d2f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Apagar todos
          </button>
        )}
      </div>

      {participantGuesses.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#edf1ee] p-4 text-sm font-bold text-[#5e6a63]">
          Essa pessoa ainda não salvou palpites.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {participantGuesses.map(({ guess, match }) => {
            const result = getGuessResult(guess, match);

            return (
            <div
              key={guess.id}
              className={`rounded-lg border border-[#e7ede9] p-4 ${result.rowClassName}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#1d6b57]">{match.groupName}</p>
                  <p className="mt-1 font-black">
                    {match.homeTeam} x {match.awayTeam}
                  </p>
                  <p className="mt-1 text-sm text-[#5e6a63]">{formatDate(match.matchDate)}</p>
                </div>
                <div className="text-right">
                  <strong className={`rounded-md px-3 py-2 text-lg ${result.className}`}>
                    {guess.homeGuess} x {guess.awayGuess}
                  </strong>
                  <p className="mt-2 text-xs font-black text-[#18211f]">
                    {result.label}{result.points !== null ? ` · ${result.points} pts` : ""}
                  </p>
                </div>
              </div>
              {guess.qualifiedTeamGuess && (
                <p className="mt-3 rounded-md bg-[#e7f4ef] px-3 py-2 text-sm font-bold text-[#1d6b57]">
                  Classifica: {guess.qualifiedTeamGuess}
                </p>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDeleteGuess(guess)}
                  disabled={busy}
                  className="mt-3 min-h-10 rounded-md border border-[#c23d2f] px-3 text-sm font-bold text-[#c23d2f] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Apagar este palpite
                </button>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#d7dfd9] bg-white p-4">
      <p className="text-sm text-[#5e6a63]">{label}</p>
      <strong className="mt-1 block truncate text-3xl">{value}</strong>
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-2 text-center text-lg font-black outline-none focus:border-[#1d6b57] disabled:cursor-not-allowed disabled:bg-[#edf1ee]"
        type="number"
        min="0"
        max="20"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
