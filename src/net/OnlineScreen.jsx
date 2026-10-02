// Écran « Jouer ensemble » : créer ou rejoindre une partie, inviter ses amis, choisir le jeu
import { useEffect, useState } from "react";
import {
  Copy,
  Crown,
  LogOut,
  Mail,
  MessageSquare,
  QrCode as QrIcon,
  Share2,
  Users,
  X,
} from "lucide-react";
import { useLang, useStored } from "../lib/core.js";
import {
  createRoom,
  endGame,
  inviteLink,
  joinRoom,
  kick,
  leaveRoom,
  resumeSession,
  savedSession,
  sendAction,
  startGame,
  useRoom,
} from "./room.js";
import { NET_GAMES, netGame } from "./games/index.js";
import QrCode from "./QrCode.jsx";
import NetPoker from "./views/NetPoker.jsx";
import NetCards from "./views/NetCards.jsx";
import NetDice from "./views/NetDice.jsx";
import NetConnect4 from "./views/NetConnect4.jsx";
import "./online.css";

import NetYams from "./views/NetYams.jsx";

import NetNaval from "./views/NetNaval.jsx";

const VIEWS = {
  poker: NetPoker,
  cards: NetCards,
  dice: NetDice,
  connect4: NetConnect4,
  yams: NetYams,
  naval: NetNaval,
};

// Lien d'invitation reçu (?join=CODE&h=empreinte), déposé par App au démarrage
export const PENDING_JOIN_KEY = "bgh_pending_join";

// Lu une seule fois (mis en cache) : le mode strict de React appelle les initialiseurs deux fois
let pendingCache;
function readPendingJoin() {
  if (pendingCache === undefined) {
    try {
      const raw = sessionStorage.getItem(PENDING_JOIN_KEY);
      sessionStorage.removeItem(PENDING_JOIN_KEY);
      pendingCache = raw ? JSON.parse(raw) : null;
    } catch {
      pendingCache = null;
    }
  }
  return pendingCache;
}

// ---------- Accueil : créer / rejoindre ----------
function Start({ players }) {
  const { t } = useLang();
  const room = useRoom();
  const defaultName =
    players?.[0]?.name && !/^Joueur \d|^Player \d/.test(players[0].name)
      ? players[0].name
      : "";
  const [name, setName] = useStored("bgh2_net_name", defaultName);
  const [pending] = useState(readPendingJoin);
  const [joinCode, setJoinCode] = useState(pending?.code || "");
  const [busy, setBusy] = useState(false);
  const saved = savedSession();
  const cleanCode = joinCode
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

  async function run(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      console.warn(e);
    }
    setBusy(false);
  }

  const messages = {
    kicked: t(
      "L'hôte t'a retiré de la partie.",
      "The host removed you from the game.",
    ),
    full: t(
      "Cette partie est pleine (10 personnes maximum).",
      "This game is full (10 people max).",
    ),
    ended: t("L'hôte a fermé la partie.", "The host closed the game."),
    notfound: t(
      "Partie introuvable. Vérifie le code, ou demande à l'hôte de garder l'app ouverte.",
      "Game not found. Check the code, or ask the host to keep the app open.",
    ),
    error: t(
      "Connexion impossible. Vérifie ton Internet et réessaie.",
      "Can't connect. Check your Internet and try again.",
    ),
  };
  const notice =
    messages[room.status] ||
    (room.error === "code"
      ? t(
          "Le code a 6 caractères (lettres et chiffres).",
          "The code has 6 characters (letters and digits).",
        )
      : null);

  return (
    <div className="game online onStart">
      <div className="onHero">
        <div className="onPhones" aria-hidden="true">
          📱📱📱
        </div>
        <h2>
          {t(
            "Jouez ensemble, chacun sur son téléphone",
            "Play together, each on your own phone",
          )}
        </h2>
        <p>
          {t(
            "Crée une partie et envoie le lien à tes amis par texto ou courriel. Ils n'ont rien à installer : le lien s'ouvre dans leur navigateur.",
            "Create a game and text or email the link to your friends. Nothing to install: the link opens in their browser.",
          )}
        </p>
      </div>

      {notice && <div className="onNotice">{notice}</div>}

      <label className="onField">
        <span>{t("Ton nom", "Your name")}</span>
        <input
          value={name}
          maxLength={20}
          placeholder={t("Ex. : Patrick", "E.g. Sam")}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      {pending ? (
        <div className="onCard onJoinCard highlight">
          <div className="onCardTitle">
            <Users size={18} /> {t("Tu es invité!", "You're invited!")}{" "}
            <b className="onCode small">{pending.code}</b>
          </div>
          <button
            className="bigAction"
            disabled={busy || !name.trim()}
            onClick={() =>
              run(async () => {
                pendingCache = null;
                await joinRoom(pending.code, name, { pin: pending.pin });
              })
            }
          >
            {name.trim()
              ? t("Rejoindre la partie", "Join the game")
              : t("Écris ton nom ↑", "Enter your name ↑")}
          </button>
        </div>
      ) : (
        <>
          <button
            className="bigAction onCreate"
            disabled={busy || !name.trim()}
            onClick={() => run(() => createRoom(name))}
          >
            {name.trim()
              ? `✨ ${t("Créer une partie", "Create a game")}`
              : t("Écris ton nom ↑", "Enter your name ↑")}
          </button>

          <div className="onCard">
            <div className="onCardTitle">
              {t("Tu as reçu un code?", "Got a code?")}
            </div>
            <div className="onJoinRow">
              <input
                className="onCodeInput"
                value={cleanCode}
                placeholder="ABC234"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button
                className="bigAction compact"
                disabled={busy || cleanCode.length !== 6 || !name.trim()}
                onClick={() => run(() => joinRoom(cleanCode, name))}
              >
                {t("Rejoindre", "Join")}
              </button>
            </div>
          </div>
        </>
      )}

      {saved && room.status !== "connecting" && (
        <button
          className="onResume"
          disabled={busy}
          onClick={() => run(resumeSession)}
        >
          ↩︎ {t("Reprendre la partie", "Resume game")} <b>{saved.code}</b>{" "}
          {saved.role === "host"
            ? t("(tu es l'hôte)", "(you're the host)")
            : ""}
        </button>
      )}

      {room.status === "connecting" && (
        <div className="onConnecting">{t("Connexion…", "Connecting…")}</div>
      )}
    </div>
  );
}

// ---------- Invitation : partager le lien ----------
function Invite() {
  const { t } = useLang();
  const room = useRoom();
  const [qr, setQr] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = inviteLink();
  const text = t(
    `Viens jouer avec moi sur Board Game Helper! Code : ${room.code}`,
    `Come play with me on Board Game Helper! Code: ${room.code}`,
  );
  const full = `${text}\n${link}`;

  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: "Board Game Helper", text, url: link });
      else copy();
    } catch {
      // Partage annulé
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(t("Copie ce lien :", "Copy this link:"), link);
    }
  }

  return (
    <div className="onCard onInvite">
      <div className="onInviteTop">
        <div>
          <small>{t("Code de la partie", "Game code")}</small>
          <button
            className="onCode"
            onClick={copy}
            aria-label={t("Copier", "Copy")}
          >
            {room.code}
          </button>
        </div>
        <button
          className={`iconButton onQrBtn ${qr ? "active" : ""}`}
          onClick={() => setQr(!qr)}
          aria-label="QR"
        >
          <QrIcon size={22} />
        </button>
      </div>
      {qr && (
        <div className="onQr">
          <QrCode text={link} size={180} />
          <small>
            {t(
              "Tes amis scannent avec la caméra de leur téléphone",
              "Friends scan it with their phone camera",
            )}
          </small>
        </div>
      )}
      <div className="onShareRow">
        <button className="onShare" onClick={share}>
          <Share2 size={18} />
          <span>{t("Partager", "Share")}</span>
        </button>
        <a className="onShare" href={`sms:?&body=${encodeURIComponent(full)}`}>
          <MessageSquare size={18} />
          <span>{t("Texto", "Text")}</span>
        </a>
        <a
          className="onShare"
          href={`mailto:?subject=${encodeURIComponent(t("Partie de Board Game Helper", "Board Game Helper game"))}&body=${encodeURIComponent(full)}`}
        >
          <Mail size={18} />
          <span>{t("Courriel", "Email")}</span>
        </a>
        <button className="onShare" onClick={copy}>
          <Copy size={18} />
          <span>{copied ? t("Copié!", "Copied!") : t("Copier", "Copy")}</span>
        </button>
      </div>
    </div>
  );
}

// ---------- Liste des joueurs ----------
function Members({ view, isHost, meId }) {
  const { t } = useLang();
  const { members, hostId } = view.lobby;
  return (
    <div className="onMembers">
      {members.map((m) => (
        <div key={m.id} className={`onMember ${m.online ? "" : "away"}`}>
          <i className="onDot" />
          <span className="onMemberName">
            {m.name}
            {m.id === meId && <small> ({t("toi", "you")})</small>}
          </span>
          {m.id === hostId && <Crown size={15} className="onCrown" />}
          {isHost && m.id !== meId && (
            <button
              className="iconButton small"
              onClick={() => kick(m.id)}
              aria-label={t("Retirer", "Remove")}
            >
              <X size={15} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------- Salon : choix du jeu ----------
function Lobby({ view, isHost, me }) {
  const { t, lang } = useLang();
  const [pick, setPick] = useStored("bgh2_net_pick", "poker");
  const [pokerOpts, setPokerOpts] = useStored("bgh2_net_poker", {
    variant: "holdem",
    limit: "nl",
    bots: 0,
  });
  const [cardOpts, setCardOpts] = useStored("bgh2_net_cards", {
    decks: 1,
    jokers: false,
  });
  const onlineCount = view.lobby.members.filter((m) => m.online).length;
  const def = netGame(pick) || NET_GAMES[0];
  const humans = Math.min(onlineCount, def.max);
  const enough = humans >= def.min;
  const opts = pick === "poker" ? pokerOpts : pick === "cards" ? cardOpts : {};

  return (
    <div className="game online onLobby">
      <Invite />
      <div className="onSectionTitle">
        <Users size={16} /> {t("À la table", "At the table")} · {onlineCount}
      </div>
      <Members view={view} isHost={isHost} meId={me.id} />

      {isHost ? (
        <>
          <div className="onSectionTitle">
            {t("Choisis le jeu", "Pick a game")}
          </div>
          <div className="onGames">
            {NET_GAMES.map((g) => (
              <button
                key={g.id}
                className={`onGame ${pick === g.id ? "active" : ""}`}
                onClick={() => setPick(g.id)}
              >
                <span className="onGameEmoji">{g.emoji}</span>
                <strong>{g.name[lang]}</strong>
                <small>{g.desc[lang]}</small>
              </button>
            ))}
          </div>

          {pick === "poker" && (
            <div className="onOpts">
              <div className="segmented small">
                <button
                  className={pokerOpts.variant !== "omaha" ? "active" : ""}
                  onClick={() =>
                    setPokerOpts({ ...pokerOpts, variant: "holdem" })
                  }
                >
                  Hold'em
                </button>
                <button
                  className={pokerOpts.variant === "omaha" ? "active" : ""}
                  onClick={() =>
                    setPokerOpts({ ...pokerOpts, variant: "omaha" })
                  }
                >
                  Omaha
                </button>
              </div>
              <div className="segmented small">
                <button
                  className={pokerOpts.limit !== "pl" ? "active" : ""}
                  onClick={() => setPokerOpts({ ...pokerOpts, limit: "nl" })}
                >
                  {t("Sans limite", "No-limit")}
                </button>
                <button
                  className={pokerOpts.limit === "pl" ? "active" : ""}
                  onClick={() => setPokerOpts({ ...pokerOpts, limit: "pl" })}
                >
                  Pot-limit
                </button>
              </div>
              <div className="optionRow">
                <span>🤖 {t("Ordis en plus", "Extra bots")}</span>
                <div className="stepper small">
                  <button
                    onClick={() =>
                      setPokerOpts({
                        ...pokerOpts,
                        bots: Math.max(0, (pokerOpts.bots || 0) - 1),
                      })
                    }
                  >
                    −
                  </button>
                  <strong>{pokerOpts.bots || 0}</strong>
                  <button
                    onClick={() =>
                      setPokerOpts({
                        ...pokerOpts,
                        bots: Math.min(5, (pokerOpts.bots || 0) + 1),
                      })
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}
          {pick === "cards" && (
            <div className="onOpts">
              <div className="segmented small">
                <button
                  className={cardOpts.decks !== 2 ? "active" : ""}
                  onClick={() => setCardOpts({ ...cardOpts, decks: 1 })}
                >
                  {t("1 paquet", "1 deck")}
                </button>
                <button
                  className={cardOpts.decks === 2 ? "active" : ""}
                  onClick={() => setCardOpts({ ...cardOpts, decks: 2 })}
                >
                  {t("2 paquets", "2 decks")}
                </button>
              </div>
              <button
                className={`chipButton ${cardOpts.jokers ? "accent" : ""}`}
                onClick={() =>
                  setCardOpts({ ...cardOpts, jokers: !cardOpts.jokers })
                }
              >
                🃏 Jokers {cardOpts.jokers ? "✓" : ""}
              </button>
            </div>
          )}

          <button
            className="bigAction onStartBtn"
            disabled={!enough}
            onClick={() => startGame(def.id, opts)}
          >
            {enough
              ? `${t("Lancer", "Start")} ${def.name[lang]} · ${humans} ${humans > 1 ? t("joueurs", "players") : t("joueur", "player")}`
              : t(
                  `Il faut ${def.min} joueurs connectés`,
                  `Needs ${def.min} connected players`,
                )}
          </button>
        </>
      ) : (
        <div className="onWaitHost">
          <span className="onPulse" />
          {t(
            "L'hôte choisit le jeu… Garde l'app ouverte!",
            "The host is picking a game… Keep the app open!",
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Écran principal ----------
export default function OnlineScreen({ players }) {
  const { t } = useLang();
  const room = useRoom();
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Garde l'écran allumé pendant une partie (si le téléphone le permet)
  useEffect(() => {
    if (!room.view || !("wakeLock" in navigator)) return undefined;
    let lock = null;
    navigator.wakeLock
      .request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => lock?.release?.().catch(() => {});
  }, [Boolean(room.view)]);

  const inRoom =
    room.view && ["lobby", "playing", "hostgone"].includes(room.status);
  if (!inRoom) return <Start players={players} />;

  const view = room.view;
  const gameId = view.lobby.game;
  const GameView = gameId ? VIEWS[gameId] : null;
  const onlineCount = view.lobby.members.filter((m) => m.online).length;

  return (
    <div className="onRoom">
      <div className="onBar">
        <span className="onBarCode">{room.code}</span>
        <span className="onBarCount">
          <Users size={14} /> {onlineCount}
        </span>
        {room.status === "hostgone" && (
          <span className="onBarWarn">
            {t("L'hôte est déconnecté…", "Host disconnected…")}
          </span>
        )}
        <span className="onBarSpacer" />
        {gameId && room.isHost && (
          <button className="chipButton" onClick={endGame}>
            {t("Salon", "Lobby")}
          </button>
        )}
        {confirmLeave ? (
          <>
            <button
              className="chipButton accent"
              onClick={() => leaveRoom(true)}
            >
              {room.isHost
                ? t("Fermer pour tous", "Close for all")
                : t("Quitter", "Leave")}
            </button>
            <button
              className="iconButton small"
              onClick={() => setConfirmLeave(false)}
              aria-label={t("Annuler", "Cancel")}
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <button
            className="iconButton small"
            onClick={() => setConfirmLeave(true)}
            aria-label={t("Quitter", "Leave")}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
      {GameView ? (
        <GameView
          view={view.game}
          send={sendAction}
          online={room.online}
          me={room.me}
          isHost={room.isHost}
          onNewTable={() => startGame(gameId, view.lobby.opts)}
        />
      ) : (
        <Lobby view={view} isHost={room.isHost} me={room.me} />
      )}
    </div>
  );
}
