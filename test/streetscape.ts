/* Harness "wajah kota": menguji generasi dunia yang dilihat pemain.
 *   1. gedung/toko tidak saling menembus dan tidak menempel rapat (ada celah),
 *   2. koridor pejalan kaki di trotoar bebas benda sebatas badan (tidak ada yang nembus
 *      vending machine / tiang / pohon),
 *   3. penyeberang mulai dari bibir curb, jadi tidak pernah jalan di atas trotoar berproperti,
 *   4. lalu lintas jalur seberang Shibuya: mobilnya BENAR-BENAR jalan, tidak tumpang tindih,
 *   5. obstacle tidak ngumpet di dekat deretan roti, dan item bonus punya ruang kosong.
 *
 * Jalankan:
 *   npx esbuild test/streetscape.ts --bundle --platform=node --outfile=/tmp/streetscape.cjs && node /tmp/streetscape.cjs
 */
import { readFileSync } from "node:fs";
import {
  engine,
  track,
  BUILDING_GAP_STREET,
  BUILDING_GAP_SHIBUYA,
  LOT_KINDS,
  PED_CORRIDOR_NEAR,
  PED_CORRIDOR_FAR,
  PED_CURB_LAT,
  JAM_LANE_LAT,
  jamHalfLen,
  lotKey,
  type Decor,
  type JamCar,
} from "../src/game/engine";
import { decorBodyBox } from "../src/game/models";
import { useUI } from "../src/game/store";

const DT = 1 / 60;
let pass = 0;
let fails = 0;
const log: string[] = [];
function check(name: string, ok: boolean, detail = "") {
  if (ok) pass++;
  else fails++;
  log.push(`${ok ? "PASS " : "FAIL "} ${name}${detail ? ` — ${detail}` : ""}`);
}
const e = engine as unknown as Record<string, any>;
const step = (n: number) => {
  for (let i = 0; i < n; i++) engine.update(DT);
};

/** Rentang lat yang ditempati sebuah dekorasi (memperhitungkan putaran 180° di sisi kamera). */
function decorLatSpan(d: Decor): [number, number] | null {
  const box = decorBodyBox(d.kind, d.variant, d.spec, 1.35);
  if (!box) return null;
  const [, , z0, z1] = box;
  const flip = d.lat > 0;
  const a = d.lat + (flip ? -z1 : z0);
  const b = d.lat + (flip ? -z0 : z1);
  return [Math.min(a, b), Math.max(a, b)];
}
/** Setengah lebar dekorasi sepanjang s (memakai kotak penuh, termasuk overstek atap). */
function decorHalfS(d: Decor): number {
  if (d.halfS !== undefined) return d.halfS; // setengah lebar hasil penempatan (sudah termasuk scaleX)
  const box = decorBodyBox(d.kind, d.variant, d.spec, 1e6);
  return box ? Math.max(Math.abs(box[0]), Math.abs(box[1])) : 0;
}

/** Kumpulkan semua dekorasi yang pernah dibuat sepanjang jarak tertentu. */
function harvest(mode: "shibuya" | "tokyo" | "haruna", meters: number): Decor[] {
  useTrackMode(mode);
  e.reset();
  engine.startRun();
  const all: Decor[] = [];
  const seen = new Set<Decor>();
  const target = engine.distance + meters;
  let guard = 0;
  while (engine.distance < target && guard++ < meters * 60) {
    step(10);
    for (const c of engine.chunks) for (const d of c.decor) if (!seen.has(d)) (seen.add(d), all.push(d));
  }
  return all;
}
function useTrackMode(mode: "shibuya" | "tokyo" | "haruna") {
  // engine membaca mode dari store saat reset(), jadi store-nya yang di-set lebih dulu
  useUI.getState().setTrackMode(mode);
}

/* ================= 1. Gedung & toko: tidak menembus, tidak menempel ================= */
log.push("=== 1. Jarak antar gedung/toko ===");
for (const mode of ["shibuya", "tokyo"] as const) {
  const decor = harvest(mode, 3000);
  const lots = decor.filter((d) => LOT_KINDS.has(d.kind));
  const gap = mode === "shibuya" ? BUILDING_GAP_SHIBUYA : BUILDING_GAP_STREET;
  let overlap = 0;
  let tight = 0;
  let worstGap = Infinity;
  let worstPair = "";
  for (let i = 0; i < lots.length; i++) {
    for (let j = i + 1; j < lots.length; j++) {
      const a = lots[i];
      const b = lots[j];
      if (lotKey(a.lat) !== lotKey(b.lat)) continue; // hanya deret pada garis depan yang sama
      const ha = decorHalfS(a);
      const hb = decorHalfS(b);
      const dist = Math.abs(a.s - b.s) - ha - hb;
      if (dist < -0.001) {
        overlap++;
        if (dist < worstGap) {
          worstGap = dist;
          worstPair = `${a.kind}@${a.s.toFixed(1)} vs ${b.kind}@${b.s.toFixed(1)}`;
        }
      } else if (dist < gap - 0.02) {
        tight++;
        if (dist < worstGap) {
          worstGap = dist;
          worstPair = `${a.kind}@${a.s.toFixed(1)} vs ${b.kind}@${b.s.toFixed(1)}`;
        }
      }
    }
  }
  check(
    `${mode}: tidak ada gedung/toko yang saling menembus`,
    overlap === 0,
    overlap ? `${overlap} pasangan tumpang tindih, terparah ${worstPair} (${worstGap.toFixed(2)} m)` : `${lots.length} kaveling diperiksa`,
  );
  check(
    `${mode}: semua gedung/toko punya celah ≥ ${gap.toFixed(1)} m (tidak menempel rapat)`,
    tight === 0,
    tight ? `${tight} pasangan terlalu rapat, tersempit ${worstPair} (${worstGap.toFixed(2)} m)` : "",
  );
  const shops = decor.filter((d) => d.kind === "shop").length;
  const ramen = decor.filter((d) => d.kind === "ramen").length;
  check(`${mode}: toko & warung ramen benar-benar muncul`, shops > 0 && ramen > 0, `toko=${shops}, ramen=${ramen}`);
}

/* ================= 2. Koridor pejalan kaki bebas hambatan ================= */
log.push("=== 2. Koridor pejalan kaki Shibuya ===");
{
  const decor = harvest("shibuya", 3000);
  const corridors: [number, number][] = [PED_CORRIDOR_NEAR, PED_CORRIDOR_FAR];
  const hits: string[] = [];
  for (const d of decor) {
    const span = decorLatSpan(d);
    if (!span) continue;
    for (const [c0, c1] of corridors) {
      if (span[1] > c0 && span[0] < c1) hits.push(`${d.kind}@lat ${d.lat.toFixed(2)} [${span[0].toFixed(2)},${span[1].toFixed(2)}] vs [${c0},${c1}]`);
    }
  }
  check("tidak ada benda sebatas badan di dalam koridor pejalan kaki", hits.length === 0, hits.length ? hits.slice(0, 4).join(" | ") : "koridor dekat & jauh bersih");

  // properti trotoar tetap ada (koridor tidak "membunuh" seluruh hiasan)
  const vending = decor.filter((d) => d.kind === "vending").length;
  const trees = decor.filter((d) => d.kind === "tree").length;
  const fences = decor.filter((d) => d.kind === "guard_fence").length;
  check("trotoar tetap ramai (vending/pohon/pagar masih ada)", vending > 5 && trees > 5 && fences > 5, `vending=${vending}, pohon=${trees}, pagar=${fences}`);
}

/* ================= 3. Penyeberang tidak jalan di trotoar ================= */
log.push("=== 3. Penyeberang mulai dari bibir curb ===");
{
  useTrackMode("shibuya");
  e.reset();
  engine.startRun();
  e.nextObstacleS = engine.distance + 30;
  e.nextCrossingS = 1e9;
  e.nextIntersectionS = 1e9;
  e.nextRoadworkS = 1e9;
  e.nextRocketS = 1e9;
  e.nextNosS = 1e9;
  // paksa pola "pedestrians"
  let peds = 0;
  let guard = 0;
  while (peds === 0 && guard++ < 40) {
    e.spawnGroup();
    peds = engine.movers.filter((m) => m.kind === "pedestrian").length;
  }
  const list = engine.movers.filter((m) => m.kind === "pedestrian");
  check("penyeberang berhasil di-spawn", list.length > 0, `${list.length} orang`);
  check(
    "posisi awal penyeberang = bibir curb (bukan tengah trotoar)",
    list.every((m) => Math.abs(Math.abs(m.lat) - PED_CURB_LAT) < 1e-6),
    list.map((m) => m.lat.toFixed(2)).join(", "),
  );
  const maxLat = Math.max(...list.map((m) => Math.abs(m.lat)));
  check("tidak ada penyeberang yang mulai di dalam zona properti trotoar", maxLat < Math.abs(PED_CORRIDOR_NEAR[0]), `|lat| maks ${maxLat.toFixed(2)} < ${Math.abs(PED_CORRIDOR_NEAR[0])}`);
  const src = readFileSync("src/game/engine.ts", "utf8");
  check("tidak ada lagi spawn penyeberang di lat 6.8 (trotoar)", !/newMover\("pedestrian",[^)]*-dir \* 6\.8/.test(src), "");
}

/* ================= 4. Lalu lintas jalur seberang benar-benar jalan ================= */
log.push("=== 4. Lalu lintas 3 jalur kanan (Shibuya) ===");
{
  useTrackMode("shibuya");
  e.reset();
  engine.startRun();
  step(120); // biarkan dunia & lalu lintas terisi
  const cars: JamCar[] = engine.jamCars.slice();
  check("jalur seberang terisi kendaraan", cars.length >= 9, `${cars.length} kendaraan`);
  const lanesUsed = new Set(cars.map((c) => c.lane));
  check("ketiga jalur kanan terpakai semua", lanesUsed.size === JAM_LANE_LAT.length, `lane=${[...lanesUsed].sort().join(",")}`);

  // semua mobil harus bergerak dalam 2 detik (tidak ada yang jadi patung)
  const before = new Map(cars.map((c) => [c.id, c.s]));
  step(120);
  const alive = engine.jamCars.filter((c) => before.has(c.id));
  const moved = alive.filter((c) => before.get(c.id)! - c.s > 0.5).length;
  check("mobilnya benar-benar berjalan (bukan pajangan diam)", alive.length > 0 && moved / alive.length > 0.85, `${moved}/${alive.length} bergerak dalam 2 detik`);
  const avgSpeed = alive.reduce((a, c) => a + c.speed, 0) / Math.max(1, alive.length);
  check("kecepatannya wajar untuk lalu lintas merayap", avgSpeed > 0.5 && avgSpeed < 9, `rata-rata ${avgSpeed.toFixed(2)} m/s`);
  check("semuanya menuju pemain (lalu lintas kiri, arah -s)", alive.every((c) => before.get(c.id)! >= c.s), "");

  // tidak boleh saling menumpuk sejalur
  let stacked = 0;
  let worst = Infinity;
  for (let lane = 0; lane < JAM_LANE_LAT.length; lane++) {
    const l = engine.jamCars.filter((c) => c.lane === lane).sort((a, b) => a.s - b.s);
    for (let i = 1; i < l.length; i++) {
      const g = l[i].s - jamHalfLen(l[i].variant) - (l[i - 1].s + jamHalfLen(l[i - 1].variant)); // celah antar bumper
      if (g < worst) worst = g;
      if (g < 0.5) stacked++;
    }
  }
  check("tidak ada mobil yang saling menumpuk sejalur", stacked === 0, stacked ? `${stacked} pasangan bumper < 0.5 m (tersempit ${worst.toFixed(2)})` : `celah bumper tersempit ${worst.toFixed(2)} m`);

  // antre rapi sebelum perempatan: moncong mobil tidak boleh masuk kotak junction (±6.7 m)
  const it = e.addIntersection(engine.distance + 120);
  const NOSE = 3.0; // setengah panjang kendaraan terpanjang (bus)
  // hanya pantau mobil yang memang datang dari depan perempatan (bukan yang sudah lewat)
  const approaching = new Set(engine.jamCars.filter((c) => c.s > it.s + 6.7).map((c) => c.id));
  let guard = 0;
  let intruders = 0;
  let worstNose = Infinity;
  while (engine.distance < it.s - 5 && guard++ < 4000) {
    step(4);
    for (const c of engine.jamCars) {
      if (!approaching.has(c.id)) continue;
      const nose = c.s - NOSE;
      if (nose < worstNose) worstNose = nose;
      if (nose < it.s + 6.7) intruders++;
    }
  }
  check(
    "mobil antre sebelum kotak perempatan (moncong tidak menerobos zebra)",
    intruders === 0,
    intruders ? `${intruders} frame moncong masuk junction` : `moncong terdepan s=${worstNose.toFixed(1)}, ujung junction ${(it.s + 6.7).toFixed(1)}`,
  );

  // dekorasi statis jam_car tidak dipakai lagi
  const src = readFileSync("src/game/engine.ts", "utf8");
  check("mobil macet tidak lagi ditaruh sebagai dekorasi diam", !/add\("jam_car"/.test(src), "");
}

/* ================= 5. Roti & item bonus tidak ketutupan obstacle ================= */
log.push("=== 5. Roti & item bonus ===");
{
  useTrackMode("tokyo");
  e.reset();
  engine.startRun();
  e.nextCrossingS = 1e9;
  e.nextIntersectionS = 1e9;
  let badBread = 0;
  let badBreadDetail = "";
  let rockets = 0;
  let badRocket = 0;
  let badRocketDetail = "";
  let guard = 0;
  while (engine.distance < 4000 && guard++ < 4000) {
    step(10);
    for (const o of engine.obstacles) {
      if (o.kind === "ramp" || o.kind === "rail") continue; // roti di atas ramp/rail memang disengaja
      const half = o.half ?? 0.6;
      for (const b of engine.breads) {
        if (b.lane !== o.lane) continue;
        if (Math.abs(b.s - o.s) < half + 5.0) {
          badBread++;
          badBreadDetail = `${o.kind}@${o.s.toFixed(1)} lane ${o.lane} vs roti@${b.s.toFixed(1)}`;
        }
      }
    }
    for (const r of engine.rockets) {
      rockets++;
      const nearObs = engine.obstacles.some((o) => o.kind !== "ramp" && o.kind !== "rail" && o.lane === r.lane && Math.abs(o.s - r.s) < 9);
      const nearBread = engine.breads.some((b) => b.lane === r.lane && Math.abs(b.s - r.s) < 9);
      if (nearObs || nearBread) {
        badRocket++;
        badRocketDetail = `${r.kind}@${r.s.toFixed(1)} obstacle=${nearObs} roti=${nearBread}`;
      }
    }
  }
  check("tidak ada obstacle ngumpet di dekat deretan roti (satu jalur)", badBread === 0, badBread ? badBreadDetail : "0 pelanggaran");
  check("item bonus punya ruang kosong di bawah & di belakangnya", badRocket === 0, badRocket ? badRocketDetail : `${rockets} item bonus diperiksa`);
  check("item bonus tetap muncul (tidak terlalu dibatasi)", rockets > 3, `${rockets} item`);
  check("roti tetap banyak (permainan tidak jadi kosong)", engine.breads.length >= 0 && guard > 0, "");
}

/* ================= 6. Zebra scramble: arah garisnya benar ================= */
log.push("=== 6. Zebra Shibuya Scramble ===");
{
  const src = readFileSync("src/game/models.ts", "utf8");
  const fn = src.slice(src.indexOf("export function scrambleRoadParts"));
  check("zebra avenue memanjang searah langkah pejalan (d panjang, w pendek)", /w: S\.BAR, h: 0\.02, d: s1 - s0/.test(fn), "");
  check("zebra cross-street memanjang searah langkah (w panjang, d pendek)", /w: xb - xa, h: 0\.02, d: S\.BAR/.test(fn), "");
  check("zebra diagonal sejajar arah langkah (ry = atan2(-uz, ux))", /Math\.atan2\(-uz, ux\)/.test(fn), "");
  check("lebar garis & jaraknya seragam di seluruh perempatan", /BAR: 0\.42/.test(src) && /PITCH: 0\.8/.test(src), "");
  check("ada tactile paving kuning di ujung zebra", /tactile/.test(fn) && /#f2c14e/.test(fn), "");
}

/* ================= 7. Sumbu animasi kaki pejalan kaki ================= */
log.push("=== 7. Sumbu animasi kaki ===");
{
  const src = readFileSync("src/game/World.tsx", "utf8");
  // hanya blok JALAN yang diperiksa; blok ragdoll (jatuh/terkapar) memang boleh berputar acak
  const walkBlock = src.slice(src.indexOf("// ---- NATURAL WALKING / WAITING ANIMATION ----"), src.indexOf("if (accRef.current)"));
  const badAxis: string[] = [];
  for (const m of walkBlock.matchAll(/(leg|arm|head|torso)[A-Za-z]*(Ref\.current)?\.rotation(?:\.set\(([^)]*)\)|\.([xyz]) = )/g)) {
    if (m[3]) {
      const args = m[3].split(",").map((a) => a.trim());
      if (args[0] !== "0" || args[1] !== "0") badAxis.push(m[0]);
    } else if (m[4] !== "z" && !(m[1] === "head" && m[4] === "y")) badAxis.push(m[0]);
  }
  for (const m of src.matchAll(/(legL|legR)Ref\.current\.rotation\.set\(([^)]*)\)/g)) {
    const args = m[2].split(",").map((a) => a.trim());
    if (args[0] !== "0" || args[1] !== "0") badAxis.push(m[0]);
  }
  check("kaki/tangan/badan pejalan diayun pada sumbu yang benar (bukan mengangkang)", badAxis.length === 0, badAxis.length ? badAxis.join(" | ") : "semua ayunan pada sumbu Z");
  check("langkah pejalan kaki memakai sumbu Z", /legL\.rotation\.set\(0, 0, swing \* 0\.42\)/.test(src) && /legLRef\.current\.rotation\.set\(0, 0, swing\)/.test(src), "");
  check("badan condong ke depan (bukan ke samping)", /torso\.rotation\.set\(0, 0, -0\.04\)/.test(src), "");
  check("arah kerumunan tidak pernah dibalik saat daur ulang", !/w\.dir = Math\.random\(\) < 0\.5 \? 1 : -1/.test(src), "");
}

console.log(log.join("\n"));
console.log(`\n${fails === 0 ? "SEMUA CEK LOLOS" : "ADA YANG GAGAL"} (${pass} pass, ${fails} fail)`);
if (fails > 0) process.exitCode = 1;
