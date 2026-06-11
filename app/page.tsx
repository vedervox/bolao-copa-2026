"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Participant = {
  id: number;
  name: string;
  avatar: string;
  total: number;
  exact: number;
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
};

type Guess = {
  id: number;
  participantId: number;
  matchId: number;
  homeGuess: number;
  awayGuess: number;
};

type BolaoData = {
  participants: Participant[];
  matches: Match[];
  guesses: Guess[];
};

const emptyData: BolaoData = {
  participants: [],
  matches: [],
  guesses: [],
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const [data, setData] = useState<BolaoData>(emptyData);
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [homeGuess, setHomeGuess] = useState(1);
  const [awayGuess, setAwayGuess] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Carregando bolao...");

  async function load() {
    const response = await fetch("/api/bolao", { cache: "no-store" });
    const nextData = (await response.json()) as BolaoData & { error?: string };
    if (!response.ok) throw new Error(nextData.error ?? "Nao foi possivel carregar.");
    setData(nextData);
    setSelectedParticipantId((current) => current ?? nextData.participants[0]?.id ?? null);
    setSelectedMatchId((current) => current ?? nextData.matches[0]?.id ?? null);
    setMessage("Tudo pronto para os palpites.");
  }

  useEffect(() => {
    load().catch((error) => setMessage(error instanceof Error ? error.message : "Erro ao carregar."));
  }, []);

  const selectedMatch = useMemo(
    () => data.matches.find((match) => match.id === selectedMatchId) ?? data.matches[0],
    [data.matches, selectedMatchId]
  );

  const selectedGuess = useMemo(
    () =>
      data.guesses.find(
        (guess) =>
          guess.participantId === selectedParticipantId && guess.matchId === selectedMatch?.id
      ),
    [data.guesses, selectedMatch?.id, selectedParticipantId]
  );

  useEffect(() => {
    if (selectedGuess) {
      setHomeGuess(selectedGuess.homeGuess);
      setAwayGuess(selectedGuess.awayGuess);
    }
  }, [selectedGuess]);

  useEffect(() => {
    if (
      selectedMatch &&
      selectedMatch.homeScore !== null &&
      selectedMatch.awayScore !== null
    ) {
      setHomeScore(selectedMatch.homeScore);
      setAwayScore(selectedMatch.awayScore);
    }
  }, [selectedMatch]);

  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setMessage("Salvando...");
    try {
      const response = await fetch("/api/bolao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string; participant?: Participant };
      if (!response.ok) throw new Error(result.error ?? "Nao foi possivel salvar.");
      if (result.participant) setSelectedParticipantId(result.participant.id);
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
    send({ action: "addParticipant", name }, `${name.trim()} entrou no bolao.`);
    setName("");
  }

  function saveGuess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(
      {
        action: "saveGuess",
        participantId: selectedParticipantId,
        matchId: selectedMatch?.id,
        homeGuess,
        awayGuess,
      },
      "Palpite salvo."
    );
  }

  function updateResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(
      {
        action: "updateResult",
        matchId: selectedMatch?.id,
        homeScore,
        awayScore,
      },
      "Resultado atualizado e ranking recalculado."
    );
  }

  const leader = data.participants[0];

  return (
    <main className="min-h-screen bg-[#f3f6f4] text-[#18211f]">
      <section className="border-b border-[#d7dfd9] bg-[#ffffff]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
          <div className="flex flex-col justify-between gap-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1d6b57]">
                  Copa 2026 em familia
                </p>
                <h1 className="mt-2 text-4xl font-black leading-tight sm:text-6xl">
                  Bolao da Copa
                </h1>
              </div>
              <div className="hidden h-20 w-20 place-items-center rounded-full bg-[#1d6b57] text-4xl text-white shadow-sm sm:grid">
                26
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[#d7dfd9] bg-white p-4">
                <p className="text-sm text-[#5e6a63]">Participantes</p>
                <strong className="mt-1 block text-3xl">{data.participants.length}</strong>
              </div>
              <div className="rounded-lg border border-[#d7dfd9] bg-white p-4">
                <p className="text-sm text-[#5e6a63]">Palpites</p>
                <strong className="mt-1 block text-3xl">{data.guesses.length}</strong>
              </div>
              <div className="rounded-lg border border-[#d7dfd9] bg-white p-4">
                <p className="text-sm text-[#5e6a63]">Lider</p>
                <strong className="mt-1 block truncate text-3xl">{leader?.name ?? "-"}</strong>
              </div>
            </div>
          </div>

          <form onSubmit={addParticipant} className="rounded-lg border border-[#d7dfd9] bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-[#405047]" htmlFor="name">
              Novo participante
            </label>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="name"
                className="min-h-12 flex-1 rounded-md border border-[#b8c6bd] px-4 outline-none focus:border-[#1d6b57]"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nome da pessoa"
              />
              <button
                disabled={busy || !name.trim()}
                className="min-h-12 rounded-md bg-[#1d6b57] px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-[#9aa79f]"
              >
                Adicionar
              </button>
            </div>
            <p className="mt-4 text-sm text-[#5e6a63]">{message}</p>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-black">Ranking</h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-[#d7dfd9] bg-white">
              {data.participants.length === 0 ? (
                <p className="p-5 text-[#5e6a63]">Adicione a primeira pessoa da familia.</p>
              ) : (
                data.participants.map((participant, index) => (
                  <div
                    key={participant.id}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-[#e7ede9] p-4 last:border-b-0"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f0c44c] font-black">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{participant.name}</p>
                      <p className="text-sm text-[#5e6a63]">
                        {participant.exact} cravados · {participant.guesses} palpites
                      </p>
                    </div>
                    <strong className="text-2xl">{participant.total}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <form onSubmit={updateResult} className="rounded-lg border border-[#d7dfd9] bg-white p-5">
            <h2 className="text-xl font-black">Resultado oficial</h2>
            <p className="mt-1 text-sm text-[#5e6a63]">
              Atualize depois do jogo para recalcular os pontos.
            </p>
            <div className="mt-4 grid grid-cols-[1fr_72px_72px] items-end gap-3">
              <label className="text-sm font-semibold">
                Jogo
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                  value={selectedMatch?.id ?? ""}
                  onChange={(event) => setSelectedMatchId(Number(event.target.value))}
                >
                  {data.matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.homeTeam} x {match.awayTeam}
                    </option>
                  ))}
                </select>
              </label>
              <ScoreInput label="Casa" value={homeScore} onChange={setHomeScore} />
              <ScoreInput label="Fora" value={awayScore} onChange={setAwayScore} />
            </div>
            <button
              disabled={busy || !selectedMatch}
              className="mt-4 min-h-12 w-full rounded-md bg-[#18211f] px-5 font-bold text-white disabled:bg-[#9aa79f]"
            >
              Fechar resultado
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <form onSubmit={saveGuess} className="rounded-lg border border-[#d7dfd9] bg-white p-5">
            <h2 className="text-2xl font-black">Fazer palpite</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm font-semibold">
                Participante
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                  value={selectedParticipantId ?? ""}
                  onChange={(event) => setSelectedParticipantId(Number(event.target.value))}
                >
                  {data.participants.map((participant) => (
                    <option key={participant.id} value={participant.id}>
                      {participant.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Partida
                <select
                  className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-3"
                  value={selectedMatch?.id ?? ""}
                  onChange={(event) => setSelectedMatchId(Number(event.target.value))}
                >
                  {data.matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {match.homeTeam} x {match.awayTeam}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedMatch && (
              <div className="mt-5 rounded-lg bg-[#e7f4ef] p-4">
                <p className="text-sm font-semibold text-[#1d6b57]">{selectedMatch.groupName}</p>
                <div className="mt-3 grid grid-cols-[1fr_72px_28px_72px_1fr] items-center gap-2">
                  <strong className="truncate text-right">{selectedMatch.homeTeam}</strong>
                  <ScoreInput label="" value={homeGuess} onChange={setHomeGuess} />
                  <span className="text-center font-black">x</span>
                  <ScoreInput label="" value={awayGuess} onChange={setAwayGuess} />
                  <strong className="truncate">{selectedMatch.awayTeam}</strong>
                </div>
              </div>
            )}

            <button
              disabled={busy || !selectedParticipantId || !selectedMatch}
              className="mt-4 min-h-12 w-full rounded-md bg-[#c23d2f] px-5 font-bold text-white disabled:bg-[#c9a7a2]"
            >
              Salvar palpite
            </button>
          </form>

          <div>
            <h2 className="text-2xl font-black">Jogos</h2>
            <div className="mt-3 grid gap-3">
              {data.matches.map((match) => (
                <button
                  key={match.id}
                  onClick={() => setSelectedMatchId(match.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selectedMatch?.id === match.id
                      ? "border-[#1d6b57] bg-white shadow-sm"
                      : "border-[#d7dfd9] bg-[#ffffff]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#5e6a63]">{formatDate(match.matchDate)}</p>
                    <span className="rounded-full bg-[#18211f] px-3 py-1 text-xs font-bold text-white">
                      {match.status === "finished" ? "encerrado" : "aberto"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <strong className="truncate text-right">{match.homeTeam}</strong>
                    <span className="rounded-md bg-[#f0c44c] px-3 py-2 font-black">
                      {match.homeScore ?? "-"} x {match.awayScore ?? "-"}
                    </span>
                    <strong className="truncate">{match.awayTeam}</strong>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        className="mt-2 min-h-12 w-full rounded-md border border-[#b8c6bd] px-2 text-center text-lg font-black outline-none focus:border-[#1d6b57]"
        type="number"
        min="0"
        max="20"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
