// Moteur de dés 3D : rendu three.js + physique cannon-es.
// Les dés sont lancés pour vrai, rebondissent, et le résultat est lu
// sur la face (ou la pointe, pour le D4) tournée vers le haut.
import * as THREE from "three";
import * as CANNON from "cannon-es";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { DIE_RADIUS, getDefinition, getDieGeometry, getDieMaterials } from "./diceGeometry.js";

const GRAVITY = -60;
const FIXED_STEP = 1 / 120;
const MAX_ROLL_TIME = 7000;

// ---------- Son d'impact synthétisé (aucun fichier audio) ----------
let audioCtx = null;
let noiseBuffer = null;

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  const length = Math.floor(audioCtx.sampleRate * 0.06);
  noiseBuffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
  return audioCtx;
}

function playClack(strength, onTable) {
  if (!audioCtx || audioCtx.state !== "running") return;
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuffer;
  src.playbackRate.value = 0.8 + Math.random() * 0.5;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  // Sur le tapis : son plus sourd ; dé contre dé : son plus sec
  filter.frequency.value = onTable ? 1300 + Math.random() * 500 : 3200 + Math.random() * 1500;
  filter.Q.value = onTable ? 1.2 : 3;
  const gain = audioCtx.createGain();
  gain.gain.value = Math.min(0.9, strength) * (onTable ? 0.55 : 0.8);
  src.connect(filter).connect(gain).connect(audioCtx.destination);
  src.start();
}

// ---------- Texture de tapis de jeu (feutre) ----------
function makeFeltTexture(hex) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    image.data[i] += n;
    image.data[i + 1] += n;
    image.data[i + 2] += n;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeVignetteTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.18, size / 2, size / 2, size * 0.5);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export class DiceEngine {
  constructor(host, options = {}) {
    this.host = host;
    this.options = options;
    this.dice = [];
    this.rolling = false;
    this.needsRender = true;
    this.disposed = false;
    this.sound = options.sound !== false;
    this.lastSoundAt = 0;
    this.lastVibrateAt = 0;

    this.initRenderer();
    this.initScene();
    this.initPhysics();
    this.initInput();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();

    this.clock = performance.now();
    this.accumulator = 0;
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------- Initialisation ----------
  initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.className = "diceCanvas";
    this.host.appendChild(renderer.domElement);
    this.renderer = renderer;
  }

  initScene() {
    const scene = new THREE.Scene();
    this.scene = scene;

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = this.envTexture;
    scene.environmentIntensity = 0.55;

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.5, 200);

    // Lumière principale avec ombres douces
    const key = new THREE.DirectionalLight(0xfff4e5, 2.4);
    key.position.set(7, 22, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -16;
    key.shadow.camera.right = 16;
    key.shadow.camera.top = 16;
    key.shadow.camera.bottom = -16;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.radius = 5;
    key.shadow.bias = -0.0008;
    scene.add(key);

    const fill = new THREE.HemisphereLight(0xdde8ff, 0x1a1208, 0.55);
    scene.add(fill);

    const rim = new THREE.PointLight(0x88aaff, 40, 60);
    rim.position.set(-12, 10, -10);
    scene.add(rim);

    // Tapis de jeu
    this.feltMaterial = new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), this.feltMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    this.setFelt(this.options.felt || "#16325c");

    // Vignette pour assombrir les bords du tapis
    const vignette = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: makeVignetteTexture(), transparent: true, depthWrite: false })
    );
    vignette.rotation.x = -Math.PI / 2;
    vignette.position.y = 0.01;
    scene.add(vignette);
    this.vignette = vignette;

    // Anneau lumineux pour les dés gardés
    this.holdRingGeometry = new THREE.RingGeometry(0.9, 1.08, 48);
    this.holdRingMaterial = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.9, depthWrite: false });
  }

  initPhysics() {
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, GRAVITY, 0) });
    world.allowSleep = true;
    world.broadphase = new CANNON.SAPBroadphase(world);
    world.solver.iterations = 14;
    world.defaultContactMaterial.friction = 0.3;

    this.diceMaterial = new CANNON.Material("dice");
    this.floorMaterial = new CANNON.Material("floor");
    this.wallMaterial = new CANNON.Material("wall");
    world.addContactMaterial(new CANNON.ContactMaterial(this.diceMaterial, this.floorMaterial, { friction: 0.32, restitution: 0.35 }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.diceMaterial, this.diceMaterial, { friction: 0.12, restitution: 0.45 }));
    world.addContactMaterial(new CANNON.ContactMaterial(this.diceMaterial, this.wallMaterial, { friction: 0.05, restitution: 0.6 }));

    const floor = new CANNON.Body({ mass: 0, material: this.floorMaterial, shape: new CANNON.Plane() });
    floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(floor);
    this.floorBody = floor;

    // Murs invisibles (repositionnés selon la taille de l'écran)
    this.walls = [0, 1, 2, 3, 4].map(() => {
      const wall = new CANNON.Body({ mass: 0, material: this.wallMaterial, shape: new CANNON.Plane() });
      world.addBody(wall);
      return wall;
    });
    this.world = world;
  }

  initInput() {
    const canvas = this.renderer.domElement;
    this.raycaster = new THREE.Raycaster();
    this.pointer = null;

    this.onPointerDown = (event) => {
      ensureAudio();
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
      this.pointer = { x: event.clientX, y: event.clientY, t: performance.now() };
    };

    this.onPointerUp = (event) => {
      if (!this.pointer) return;
      const dx = event.clientX - this.pointer.x;
      const dy = event.clientY - this.pointer.y;
      const dt = Math.max(16, performance.now() - this.pointer.t);
      const dist = Math.hypot(dx, dy);
      this.pointer = null;

      if (dist > 28) {
        // Glisser = lancer dans la direction du geste
        const speed = dist / dt;
        this.roll({ direction: new THREE.Vector3(dx, 0, dy).normalize(), power: Math.min(1.6, 0.7 + speed * 0.5) });
        return;
      }

      // Toucher un dé = le garder / le relâcher ; toucher le tapis = lancer
      const hit = this.pick(event.clientX, event.clientY);
      if (hit) {
        this.toggleHold(hit);
      } else {
        this.roll();
      }
    };

    this.onPointerCancel = () => {
      this.pointer = null;
    };

    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
  }

  // ---------- Réglages ----------
  setFelt(hex) {
    if (this.feltMaterial.map) this.feltMaterial.map.dispose();
    this.feltMaterial.map = makeFeltTexture(hex);
    this.feltMaterial.needsUpdate = true;
    this.needsRender = true;
  }

  setSound(enabled) {
    this.sound = enabled;
  }

  // Remplace tous les dés (type, nombre, couleur)
  setDice(sides, count, palette) {
    this.clearDice();
    const scale = count <= 4 ? 1 : count <= 8 ? 0.86 : 0.74;
    const radius = DIE_RADIUS[sides] * scale;
    const { geometry, verts, def } = getDieGeometry(sides, radius);
    const materials = getDieMaterials(sides, palette);
    const shape = new CANNON.ConvexPolyhedron({
      vertices: verts.map((v) => new CANNON.Vec3(v.x, v.y, v.z)),
      faces: def.faces
    });

    for (let i = 0; i < count; i += 1) {
      const mesh = new THREE.Mesh(geometry, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      const body = new CANNON.Body({
        mass: 1,
        material: this.diceMaterial,
        shape,
        linearDamping: 0.18,
        angularDamping: 0.14,
        allowSleep: true,
        sleepSpeedLimit: 0.25,
        sleepTimeLimit: 0.25
      });
      this.world.addBody(body);

      const ring = new THREE.Mesh(this.holdRingGeometry, this.holdRingMaterial);
      ring.rotation.x = -Math.PI / 2;
      ring.scale.setScalar(radius * 1.25);
      ring.visible = false;
      this.scene.add(ring);

      const die = { index: i, sides, def, radius, mesh, body, ring, held: false, value: 1 };
      body.addEventListener("collide", (e) => this.handleCollision(die, e));
      this.dice.push(die);

      // Posé à plat sur une valeur au hasard
      this.placeResting(die, 0, 0, 1 + Math.floor(Math.random() * sides));
    }

    this.layoutGrid();
    this.syncMeshes();
    this.needsRender = true;
    this.emitResult(true);
  }

  // Range les dés en grille au centre du tapis (sans changer leur valeur)
  layoutGrid() {
    const count = this.dice.length;
    if (!count) return;
    const radius = this.dice[0].radius;
    const cols = Math.min(count, count <= 8 ? 4 : 5);
    const rows = Math.ceil(count / cols);
    const spacing = radius * 2.3;
    this.dice.forEach((die, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const rowCount = Math.min(cols, count - row * cols);
      die.body.position.x = (col - (rowCount - 1) / 2) * spacing;
      die.body.position.z = this.bounds.centerZ + (row - (rows - 1) / 2) * spacing;
    });
  }

  // Remet les dés sur le tapis si l'écran a changé de taille
  keepInside() {
    if (this.rolling || !this.dice.length) return;
    const b = this.bounds;
    const outside = this.dice.some((d) => {
      const p = d.body.position;
      return Math.abs(p.x) > b.halfW - d.radius || Math.abs(p.z - b.centerZ) > b.halfD - d.radius;
    });
    if (outside) {
      this.layoutGrid();
      this.syncMeshes();
    }
  }

  // Pose un dé à plat avec la valeur demandée vers le haut
  placeResting(die, x, z, value) {
    const { def, body } = die;
    const up = new THREE.Vector3(0, 1, 0);
    let localDir;
    if (def.mode === "vertex") {
      localDir = def.verts[def.vertexValues.indexOf(value)].clone().normalize();
    } else {
      localDir = def.normals[def.faceValues.indexOf(value)].clone();
    }
    const q = new THREE.Quaternion().setFromUnitVectors(localDir, up);
    const yaw = new THREE.Quaternion().setFromAxisAngle(up, Math.random() * Math.PI * 2);
    q.premultiply(yaw);

    // Hauteur pour que le point le plus bas touche le tapis
    let minY = Infinity;
    def.verts.forEach((v) => {
      const p = v.clone().multiplyScalar(die.radius).applyQuaternion(q);
      minY = Math.min(minY, p.y);
    });

    body.position.set(x, -minY + 0.001, z);
    body.quaternion.set(q.x, q.y, q.z, q.w);
    body.velocity.setZero();
    body.angularVelocity.setZero();
    body.sleep();
    die.value = value;
  }

  clearDice() {
    this.dice.forEach((die) => {
      this.scene.remove(die.mesh);
      this.scene.remove(die.ring);
      this.world.removeBody(die.body);
    });
    this.dice = [];
    this.rolling = false;
  }

  // ---------- Lancer ----------
  roll({ direction, power = 1 } = {}) {
    if (this.dice.length === 0) return false;
    const active = this.dice.filter((d) => !d.held);
    if (active.length === 0) return false;

    ensureAudio();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();

    const b = this.bounds;
    // Direction par défaut : vers le fond, avec un angle au hasard
    const dir = direction
      ? direction.clone()
      : new THREE.Vector3(Math.sin((Math.random() - 0.5) * 1.2), 0, -Math.cos((Math.random() - 0.5) * 1.2)).normalize();

    active.forEach((die, n) => {
      const { body } = die;
      body.wakeUp();
      // On ramasse les dés du côté d'où part le lancer, puis on les projette
      const spread = (n - (active.length - 1) / 2) * die.radius * 2.1;
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      const startX = THREE.MathUtils.clamp(-dir.x * b.halfW * 0.55 + side.x * spread, -b.halfW + die.radius, b.halfW - die.radius);
      const startZ = b.centerZ + THREE.MathUtils.clamp(-dir.z * b.halfD * 0.55 + side.z * spread, -b.halfD + die.radius, b.halfD - die.radius);
      body.position.set(startX, 2.5 + Math.random() * 2 + die.radius, startZ);

      const q = new CANNON.Quaternion();
      q.setFromEuler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      body.quaternion.copy(q);

      const speed = (11 + Math.random() * 5) * power;
      const jitter = (Math.random() - 0.5) * 0.5;
      const vx = (dir.x + side.x * jitter) * speed;
      const vz = (dir.z + side.z * jitter) * speed;
      body.velocity.set(vx, -2 - Math.random() * 4, vz);
      const spin = 24 * power;
      body.angularVelocity.set((Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin);
    });

    this.rolling = true;
    this.rollStartedAt = performance.now();
    this.calmFrames = 0;
    this.nudges = 0;
    this.options.onRollStart?.();
    if (navigator.vibrate) navigator.vibrate(30);
    return true;
  }

  handleCollision(die, event) {
    if (!this.rolling) return;
    const impact = Math.abs(event.contact.getImpactVelocityAlongNormal());
    if (impact < 1.5) return;
    const now = performance.now();
    if (this.sound && now - this.lastSoundAt > 22) {
      this.lastSoundAt = now;
      const onTable = event.body === this.floorBody || this.walls.includes(event.body);
      playClack(impact / 18, onTable);
    }
    if (impact > 9 && navigator.vibrate && now - this.lastVibrateAt > 90) {
      this.lastVibrateAt = now;
      navigator.vibrate(8);
    }
  }

  // ---------- Garder un dé (pour relancer seulement les autres) ----------
  toggleHold(die) {
    if (this.rolling) return;
    die.held = !die.held;
    const { body } = die;
    if (die.held) {
      body.type = CANNON.Body.STATIC;
      body.mass = 0;
    } else {
      body.type = CANNON.Body.DYNAMIC;
      body.mass = 1;
    }
    body.updateMassProperties();
    body.velocity.setZero();
    body.angularVelocity.setZero();
    this.needsRender = true;
    if (navigator.vibrate) navigator.vibrate(15);
    this.syncMeshes();
    this.emitResult(true);
  }

  releaseAll() {
    this.dice.forEach((die) => die.held && this.toggleHold(die));
  }

  pick(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.dice.map((d) => d.mesh), false);
    if (!hits.length) return null;
    return this.dice.find((d) => d.mesh === hits[0].object) || null;
  }

  // ---------- Lecture du résultat ----------
  readDie(die) {
    const q = new THREE.Quaternion(die.body.quaternion.x, die.body.quaternion.y, die.body.quaternion.z, die.body.quaternion.w);
    const { def } = die;
    let best = -Infinity;
    let value = 1;
    if (def.mode === "vertex") {
      def.verts.forEach((v, i) => {
        const y = v.clone().normalize().applyQuaternion(q).y;
        if (y > best) {
          best = y;
          value = def.vertexValues[i];
        }
      });
    } else {
      def.normals.forEach((n, i) => {
        const y = n.clone().applyQuaternion(q).y;
        if (y > best) {
          best = y;
          value = def.faceValues[i];
        }
      });
    }
    return { value, flat: best > 0.93 };
  }

  checkSettled(now) {
    const active = this.dice.filter((d) => !d.held);
    const calm = active.every((d) => {
      const b = d.body;
      return b.sleepState === CANNON.Body.SLEEPING || (b.velocity.length() < 0.08 && b.angularVelocity.length() < 0.12);
    });
    this.calmFrames = calm ? this.calmFrames + 1 : 0;
    const timeout = now - this.rollStartedAt > MAX_ROLL_TIME;
    if (this.calmFrames < 12 && !timeout) return;

    // Un dé coincé sur une arête ? On lui donne une petite pichenette
    const cocked = active.filter((d) => !this.readDie(d).flat);
    if (cocked.length && this.nudges < 3 && !timeout) {
      this.nudges += 1;
      this.calmFrames = 0;
      cocked.forEach((d) => {
        d.body.wakeUp();
        d.body.velocity.set((Math.random() - 0.5) * 4, 7, (Math.random() - 0.5) * 4);
        d.body.angularVelocity.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      });
      return;
    }

    this.rolling = false;
    this.emitResult(false);
  }

  emitResult(silent) {
    this.dice.forEach((d) => {
      d.value = this.readDie(d).value;
    });
    this.options.onResult?.({
      values: this.dice.map((d) => d.value),
      held: this.dice.map((d) => d.held),
      silent
    });
    this.updateLabels();
  }

  // Positions écran des dés (pour les étiquettes de résultat)
  updateLabels() {
    const rect = this.host.getBoundingClientRect();
    const labels = this.dice.map((d) => {
      const p = d.mesh.position.clone();
      p.y += d.radius * 1.35;
      p.project(this.camera);
      return {
        value: d.value,
        held: d.held,
        x: ((p.x + 1) / 2) * rect.width,
        y: ((1 - p.y) / 2) * rect.height
      };
    });
    this.options.onLabels?.(labels);
  }

  // ---------- Boucle ----------
  syncMeshes() {
    this.dice.forEach((d) => {
      d.mesh.position.set(d.body.position.x, d.body.position.y, d.body.position.z);
      d.mesh.quaternion.set(d.body.quaternion.x, d.body.quaternion.y, d.body.quaternion.z, d.body.quaternion.w);
      d.ring.visible = d.held;
      d.ring.position.set(d.body.position.x, 0.02, d.body.position.z);
    });
  }

  loop(now) {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.clock) / 1000);
    this.clock = now;

    if (this.rolling) {
      this.world.step(FIXED_STEP, dt, 10);
      this.syncMeshes();
      this.checkSettled(now);
      this.needsRender = true;
    }

    if (this.needsRender) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = this.rolling;
    }
  }

  resize() {
    const width = this.host.clientWidth || 300;
    const height = this.host.clientHeight || 300;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.aspect = aspect;

    // Hauteur de caméra pour voir un tapis assez large, même en portrait
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const wantHalfW = 5.6;
    const wantHalfD = 4.4;
    const camHeight = Math.max(wantHalfW / (t * aspect), wantHalfD / t);
    this.camera.position.set(0, camHeight, camHeight * 0.28);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();

    // Limites visibles du tapis (intersection des coins de l'écran avec le sol)
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pts = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ].map(([x, y]) => {
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const out = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(ground, out);
      return out;
    });
    const halfW = Math.min(Math.abs(pts[0].x), Math.abs(pts[1].x)) - 0.45;
    const minZ = Math.max(pts[2].z, pts[3].z) + 2.9;
    const maxZ = Math.min(pts[0].z, pts[1].z) - 0.6;
    const centerZ = (minZ + maxZ) / 2;
    const halfD = (maxZ - minZ) / 2;
    this.bounds = { halfW, halfD, centerZ };

    // Murs : gauche, droite, fond, devant, plafond
    const [left, right, back, front, ceiling] = this.walls;
    left.position.set(-halfW, 0, 0);
    left.quaternion.setFromEuler(0, Math.PI / 2, 0);
    right.position.set(halfW, 0, 0);
    right.quaternion.setFromEuler(0, -Math.PI / 2, 0);
    back.position.set(0, 0, minZ);
    back.quaternion.setFromEuler(0, 0, 0);
    front.position.set(0, 0, maxZ);
    front.quaternion.setFromEuler(0, Math.PI, 0);
    ceiling.position.set(0, 14, 0);
    ceiling.quaternion.setFromEuler(Math.PI / 2, 0, 0);

    this.vignette.scale.set(halfW * 2.6, halfD * 2.9, 1);
    this.vignette.position.z = centerZ;

    this.keepInside();
    this.needsRender = true;
    this.renderer.render(this.scene, this.camera);
    this.updateLabels();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerCancel);
    this.clearDice();
    if (this.feltMaterial.map) this.feltMaterial.map.dispose();
    this.envTexture.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}

export { getDefinition };
