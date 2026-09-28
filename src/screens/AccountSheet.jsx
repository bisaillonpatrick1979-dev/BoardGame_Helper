// Feuille du compte : connexion, inscription, profil, statistiques, suppression
import { useEffect, useState } from "react";
import { Cloud, CloudOff, LogOut, RefreshCw, Trash2, X } from "lucide-react";
import { useAuth } from "../lib/auth.jsx";
import { authErrorMessage, deleteAccount, saveDisplayName, supabase } from "../lib/cloud.js";
import { STATS_KEY, useLang, useStored } from "../lib/core.js";
import { GAMES } from "./GamesScreen.jsx";

function SignInForm() {
  const { t, lang } = useLang();
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    const redirect = window.location.origin;
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirect }
        });
        if (err) throw err;
        if (!data.session) {
          setInfo(t("Compte créé! Ouvre le courriel de confirmation, puis reviens te connecter.", "Account created! Open the confirmation email, then come back and sign in."));
          setMode("signin");
        }
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirect });
        if (err) throw err;
        setInfo(t("Courriel envoyé. Suis le lien pour choisir un nouveau mot de passe.", "Email sent. Follow the link to choose a new password."));
      }
    } catch (err) {
      setError(authErrorMessage(err, lang));
    }
    setBusy(false);
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <p className="muted">
        {t(
          "Crée un compte gratuit pour sauvegarder tes scores, statistiques et réglages, et les retrouver sur tous tes appareils.",
          "Create a free account to save your scores, stats and settings, and find them on all your devices."
        )}
      </p>
      {mode !== "reset" && (
        <div className="segmented">
          <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
            {t("Connexion", "Sign in")}
          </button>
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
            {t("Créer un compte", "Sign up")}
          </button>
        </div>
      )}
      <input type="email" required autoComplete="email" placeholder={t("Courriel", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
      {mode !== "reset" && (
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder={t("Mot de passe (6 caractères min.)", "Password (6+ characters)")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      )}
      {error && <div className="formError">{error}</div>}
      {info && <div className="formInfo">{info}</div>}
      <button className="bigAction" type="submit" disabled={busy}>
        {busy ? "…" : mode === "signin" ? t("Se connecter", "Sign in") : mode === "signup" ? t("Créer mon compte", "Create account") : t("Envoyer le lien", "Send link")}
      </button>
      <button type="button" className="linkButton" onClick={() => setMode(mode === "reset" ? "signin" : "reset")}>
        {mode === "reset" ? t("← Retour", "← Back") : t("Mot de passe oublié?", "Forgot password?")}
      </button>
    </form>
  );
}

function NewPasswordForm() {
  const { t, lang } = useLang();
  const { setRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) setError(authErrorMessage(err, lang));
    else setRecovery(false);
  }

  return (
    <form className="authForm" onSubmit={submit}>
      <p>{t("Choisis ton nouveau mot de passe.", "Choose your new password.")}</p>
      <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <div className="formError">{error}</div>}
      <button className="bigAction" type="submit" disabled={busy}>
        {t("Enregistrer", "Save")}
      </button>
    </form>
  );
}

function SyncBadge() {
  const { t, lang } = useLang();
  const { sync } = useAuth();
  const time = sync.at ? sync.at.toLocaleTimeString(lang === "fr" ? "fr-CA" : "en-CA", { hour: "2-digit", minute: "2-digit" }) : "";
  const label = {
    idle: "",
    syncing: t("Synchronisation…", "Syncing…"),
    ok: `${t("Sauvegardé", "Saved")} ${time}`,
    offline: t("Hors ligne — sera sauvegardé plus tard", "Offline — will save later"),
    error: t("Erreur de sauvegarde, nouvel essai bientôt", "Save error, retrying soon")
  }[sync.status];
  const Icon = sync.status === "offline" || sync.status === "error" ? CloudOff : sync.status === "syncing" ? RefreshCw : Cloud;
  return (
    <div className={`syncBadge ${sync.status}`}>
      <Icon size={16} />
      <span>{label}</span>
    </div>
  );
}

function Profile() {
  const { t, lang } = useLang();
  const { user, profile, setProfile } = useAuth();
  const [stats] = useStored(STATS_KEY, {});
  const [name, setName] = useState(profile?.display_name || "");
  useEffect(() => {
    if (profile?.display_name && !name) setName(profile.display_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totals = Object.values(stats || {}).reduce((acc, s) => ({ played: acc.played + s.played, wins: acc.wins + s.wins }), { played: 0, wins: 0 });

  return (
    <div className="profile">
      <div className="profileHead">
        <span className="avatar big" style={{ "--hue": 220 }}>
          {(profile?.display_name || user.email || "?").slice(0, 1).toUpperCase()}
        </span>
        <div className="profileId">
          <input
            value={name}
            placeholder={t("Ton nom de joueur", "Your player name")}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== profile?.display_name) {
                saveDisplayName(user.id, name.trim());
                setProfile({ ...profile, display_name: name.trim() });
              }
            }}
          />
          <small>{user.email}</small>
        </div>
        <span className={`planBadge ${profile?.premium ? "premium" : ""}`}>{profile?.premium ? "Premium" : t("Gratuit", "Free")}</span>
      </div>

      <SyncBadge />

      <h3 className="sheetLabel">{t("Mes statistiques", "My stats")}</h3>
      <div className="statTotals">
        <div>
          <strong>{totals.played}</strong>
          <small>{t("parties", "games")}</small>
        </div>
        <div>
          <strong>{totals.wins}</strong>
          <small>{t("victoires", "wins")}</small>
        </div>
        <div>
          <strong>{totals.played ? Math.round((totals.wins / totals.played) * 100) : 0}%</strong>
          <small>{t("réussite", "win rate")}</small>
        </div>
      </div>
      <div className="statList">
        {GAMES.filter((g) => stats?.[g.id]).map((g) => {
          const s = stats[g.id];
          return (
            <div key={g.id} className="statRow">
              <span>{g.emoji}</span>
              <span className="statName">{g.name[lang]}</span>
              <span>
                {s.wins}/{s.played}
              </span>
              {s.best !== null && s.best !== undefined && <span className="statBest">🏆 {s.best}</span>}
            </div>
          );
        })}
        {!totals.played && <p className="muted">{t("Joue une partie pour voir tes statistiques ici.", "Play a game to see your stats here.")}</p>}
      </div>

      <button className="bigAction secondary" onClick={() => supabase.auth.signOut()}>
        <LogOut size={18} />
        {t("Se déconnecter", "Sign out")}
      </button>

      {!confirmDelete ? (
        <button className="linkButton danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} /> {t("Supprimer mon compte", "Delete my account")}
        </button>
      ) : (
        <div className="dangerBox">
          <p>{t("Toutes tes sauvegardes seront effacées pour toujours. Continuer?", "All your saves will be erased forever. Continue?")}</p>
          {error && <div className="formError">{error}</div>}
          <div className="actionRow">
            <button className="bigAction secondary" onClick={() => setConfirmDelete(false)}>
              {t("Annuler", "Cancel")}
            </button>
            <button
              className="bigAction dangerBg"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await deleteAccount();
                } catch (err) {
                  setError(err.message);
                }
                setBusy(false);
              }}
            >
              {t("Supprimer", "Delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountSheet({ onClose }) {
  const { t } = useLang();
  const { user, recovery } = useAuth();
  return (
    <div className="sheetBackdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheetHeader">
          <h2>{user ? t("Mon compte", "My account") : t("Compte", "Account")}</h2>
          <button className="iconButton" onClick={onClose} aria-label={t("Fermer", "Close")}>
            <X size={22} />
          </button>
        </div>
        {recovery ? <NewPasswordForm /> : user ? <Profile /> : <SignInForm />}
        <a className="linkButton small" href="/confidentialite.html" target="_blank" rel="noreferrer">
          {t("Politique de confidentialité", "Privacy policy")}
        </a>
      </div>
    </div>
  );
}
