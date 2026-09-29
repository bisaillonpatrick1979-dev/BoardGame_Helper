// Chiffrement des parties en réseau (WebCrypto, intégré au navigateur)
// Chaque téléphone a une paire de clés ECDH P-256. L'hôte et chaque joueur en tirent
// une clé secrète commune (AES-GCM 256) : les cartes privées d'un joueur ne peuvent
// être lues que par lui, et personne ne peut envoyer une action au nom d'un autre.
const subtle = globalThis.crypto?.subtle;
const ECDH = { name: "ECDH", namedCurve: "P-256" };

export const cryptoAvailable = () => Boolean(subtle);

// ---------- Base64 ----------
export function b64(buffer) {
  const bytes = new Uint8Array(buffer);
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function unb64(text) {
  const s = atob(text);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) bytes[i] = s.charCodeAt(i);
  return bytes;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

// ---------- Clés ----------
// Nouvelle paire de clés ; la clé privée est exportée (JWK) pour pouvoir reprendre la partie après un rechargement
export async function newKeys() {
  const pair = await subtle.generateKey(ECDH, true, ["deriveKey"]);
  const pub = b64(await subtle.exportKey("raw", pair.publicKey));
  const privJwk = await subtle.exportKey("jwk", pair.privateKey);
  return { priv: pair.privateKey, pub, privJwk };
}

export async function loadKeys(saved) {
  const priv = await subtle.importKey("jwk", saved.privJwk, ECDH, false, ["deriveKey"]);
  return { priv, pub: saved.pub, privJwk: saved.privJwk };
}

// Clé secrète partagée entre ma clé privée et la clé publique de l'autre
export async function sharedKey(priv, pubB64) {
  const pub = await subtle.importKey("raw", unb64(pubB64), ECDH, false, []);
  return subtle.deriveKey({ name: "ECDH", public: pub }, priv, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

// Empreinte courte de la clé publique de l'hôte (mise dans le lien d'invitation)
export async function fingerprint(pubB64) {
  const hash = new Uint8Array(await subtle.digest("SHA-256", unb64(pubB64)));
  return Array.from(hash.slice(0, 5), (x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- Messages ----------
// « aad » lie le message à son sens et à son destinataire (impossible de le rejouer ailleurs)
export async function seal(key, obj, aad) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(aad) }, key, enc.encode(JSON.stringify(obj)));
  return { iv: b64(iv), ct: b64(ct) };
}

export async function open(key, box, aad) {
  const plain = await subtle.decrypt({ name: "AES-GCM", iv: unb64(box.iv), additionalData: enc.encode(aad) }, key, unb64(box.ct));
  return JSON.parse(dec.decode(plain));
}

// ---------- Hasard ----------
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O, 1/I/L (faciles à confondre)

export function randomCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function randomId() {
  return b64(crypto.getRandomValues(new Uint8Array(9))).replace(/[+/=]/g, "x");
}

export const isValidCode = (code) => new RegExp(`^[${CODE_ALPHABET}]{6}$`).test(code);
