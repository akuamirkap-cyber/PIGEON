/* Harness ukuran hewan: KUCING 1.7x dan AYAM 1.2x.
 *
 * Memastikan tiga hal tetap sinkron setelah ukuran objek diperbesar:
 *   1. skala model yang digambar World.tsx (`CAT_SCALE` / `CHICKEN_SCALE`) memang 1.7x / 1.2x,
 *   2. hitbox clearance di engine (`CHICKEN_HIT`, `CAT_CLEAR_H`) masih menutupi tinggi model,
 *   3. radius ragdoll ikut membesar, jadi hewan yang ter-`YEET` mendarat DI aspal, bukan terbenam.
 *
 * Jalankan:
 *   npx esbuild test/animalSize.ts --bundle --platform=node --outfile=/tmp/animalSize.cjs && node /tmp/animalSize.cjs
 */
import {
  engine,
  GRAVITY,
  JUMP_V,
  CAT_SIZE_BOOST,
  CHICKEN_SIZE_BOOST,
  CAT_MODEL_SCALE,
  CHICKEN_MODEL_SCALE,
  CAT_MODEL_H,
  CHICKEN_MODEL_H,
  CAT_SCALE,
  CHICKEN_SCALE,
  CAT_HEIGHT,
  CHICKEN_HEIGHT,
  CHICKEN_HIT,
  CAT_CLEAR_H,
  type Mover,
} from "../src/game/engine";
import { catWalkParts, catSleepingParts, chickenParts } from "../src/game/models";

type AnyEngine = {
  newMover: (k: string, s: number, lane: number, lat: number) => Mover;
  nextObstacleS: number;
  nextRoadworkS: number;
  nextCrossingS: number;
  nextOverpassS: number;
  nextNosS: number;
  nextIntersectionS: number;
};

const DT = 1 / 60;
const step = (n: number) => { for (let i = 0; i < n; i++) engine.update(DT); };
const e = engine as unknown as AnyEngine;

let fails = 0;
const log: string[] = [];
function check(label: string, ok: boolean, detail = "") {
  if (!ok) fails++;
  log.push(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}
/** Tinggi model = titik tertinggi part, dihitung dari geometry aslinya (bukan angka hafalan). */
const topOf = (parts: { y: number; h: number }[]) => parts.reduce((m, p) => Math.max(m, p.y + p.h / 2), 0);

/* ---------- 1. Angka ukuran ---------- */
const chickenTop = topOf(chickenParts());
const catWalkTop = topOf(catWalkParts(0));
const catSleepTop = topOf(catSleepingParts(0));
const apex = (JUMP_V * JUMP_V) / (2 * GRAVITY);

log.push("=== Ukuran hewan ===");
check("permintaan: ayam 1.2x", CHICKEN_SIZE_BOOST === 1.2, `boost=${CHICKEN_SIZE_BOOST}`);
check("permintaan: kucing 1.7x", CAT_SIZE_BOOST === 1.7, `boost=${CAT_SIZE_BOOST}`);
check(
  "CHICKEN_MODEL_H cocok dengan chickenParts()",
  Math.abs(chickenTop - CHICKEN_MODEL_H) < 1e-6,
  `model=${chickenTop.toFixed(3)} vs konstanta=${CHICKEN_MODEL_H}`,
);
check(
  "CAT_MODEL_H cocok dengan catWalkParts()",
  Math.abs(catWalkTop - CAT_MODEL_H) < 1e-6,
  `model=${catWalkTop.toFixed(3)} vs konstanta=${CAT_MODEL_H}`,
);
check(
  "skala akhir = ukuran dasar x boost",
  Math.abs(CHICKEN_SCALE - CHICKEN_MODEL_SCALE * 1.2) < 1e-9 && Math.abs(CAT_SCALE - CAT_MODEL_SCALE * 1.7) < 1e-9,
  `ayam ${CHICKEN_MODEL_SCALE}->${CHICKEN_SCALE.toFixed(3)} (${CHICKEN_HEIGHT.toFixed(2)} m), ` +
    `kucing ${CAT_MODEL_SCALE}->${CAT_SCALE.toFixed(3)} (${CAT_HEIGHT.toFixed(2)} m, loaf di atap mobil ${(catSleepTop * CAT_SCALE).toFixed(2)} m)`,
);

/* ---------- 2. Hitbox vs model (merpati tidak boleh nembus badan hewan) ---------- */
check(
  "hitbox ayam menutupi modelnya",
  CHICKEN_HIT >= chickenTop * CHICKEN_SCALE,
  `CHICKEN_HIT=${CHICKEN_HIT.toFixed(3)} >= ${(chickenTop * CHICKEN_SCALE).toFixed(3)}`,
);
check(
  "clearance kucing menutupi modelnya",
  CAT_CLEAR_H >= catWalkTop * CAT_SCALE,
  `CAT_CLEAR_H=${CAT_CLEAR_H} >= ${(catWalkTop * CAT_SCALE).toFixed(3)}`,
);
check(
  "keduanya masih bisa dilompati (puncak lompatan)",
  CHICKEN_HIT < apex && CAT_CLEAR_H < apex,
  `ayam ${CHICKEN_HIT.toFixed(2)} m, kucing ${CAT_CLEAR_H} m, apex ${apex.toFixed(2)} m`,
);

/* ---------- 3. Simulasi kontak & lompatan ---------- */
function quiet() {
  e.nextObstacleS = 1e9;
  e.nextRoadworkS = 1e9;
  e.nextCrossingS = 1e9;
  e.nextOverpassS = 1e9;
  e.nextNosS = 1e9;
  e.nextIntersectionS = 1e9;
  engine.obstacles = [];
  engine.breads = [];
  engine.movers = [];
  engine.crossings = [];
  engine.trains = [];
  engine.intersections = [];
  engine.crossCars = [];
}

/** Pasang satu hewan diam tepat di depan merpati. */
function standStill(kind: "cat" | "chicken", ahead: number): Mover {
  engine.startRun();
  quiet();
  const m = e.newMover(kind, engine.distance + ahead, -1, 0);
  m.phase = kind === "cat" ? "hop" : "wait";
  m.speed = 0;
  m.pause = 30;
  m.delay = 999;
  engine.movers.push(m);
  return m;
}

log.push("=== Kontak badan: YEET + ragdoll ===");
for (const kind of ["cat", "chicken"] as const) {
  const m = standStill(kind, 3);
  let frames = 0;
  while (m.phase !== "hit" && frames < 300) { step(1); frames++; }
  const boost = kind === "cat" ? CAT_SIZE_BOOST : CHICKEN_SIZE_BOOST;
  check(`${kind} ter-YEET saat ditabrak`, m.phase === "hit", `setelah ${(frames / 60).toFixed(2)}s`);
  const rag = m.rag;
  check(
    `${kind} ragdoll radius ikut boost`,
    !!rag && Math.abs(rag.radius - 0.22 * boost) < 1e-9,
    `radius=${rag ? rag.radius.toFixed(3) : "-"} (0.22 x ${boost})`,
  );
  step(180);
  check(
    `${kind} ragdoll mendarat di atas aspal`,
    !!rag && rag.rest && Math.abs(rag.h - rag.radius) < 0.03,
    `h=${rag ? rag.h.toFixed(3) : "-"} radius=${rag ? rag.radius.toFixed(3) : "-"}`,
  );
}

log.push("=== Lompatan bersih di atas hewan ===");
for (const [kind, clearH] of [["chicken", CHICKEN_HIT], ["cat", CAT_CLEAR_H]] as const) {
  const m = standStill(kind, 4);
  let passed = false;
  for (let i = 0; i < 400 && engine.phase === "playing"; i++) {
    engine.player.h = clearH + 0.05; // anggap merpati sedang di puncak lompatan
    engine.player.vh = 0;
    step(1);
    if (m.s - engine.distance < -0.5) { passed = true; break; }
  }
  check(`${kind} dilewati tanpa YEET pada h=${(clearH + 0.05).toFixed(2)} m`, passed && m.phase !== "hit", `mover phase=${m.phase}`);
}

log.push("");
log.push(fails === 0 ? `SEMUA CEK LOLOS (${log.filter((l) => l.startsWith("PASS")).length} pass)` : `${fails} CEK GAGAL`);
console.log(log.join("\n"));
if (fails > 0) process.exitCode = 1;
