/**
 * Canvas painters for the distant scenery (Mount Fuji + layered hills).
 * Pure 2D canvas, no three.js — flat colours and crisp shapes on purpose (the earlier vertex-colour
 * gradients blended green/pink/blue into mud). Everything here is deterministic.
 */

export const MIST_HEX = "#dbeeff";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Mount Fuji                                                          */
/* ------------------------------------------------------------------ */

/**
 * Fuji as a flat illustration: symmetric concave cone with a slightly flat crater rim, periwinkle rock,
 * a jagged white snow cap with long fingers running down the gullies, soft radial ridges, a shaded right
 * flank, two wisps of cloud and a hazy foot that melts into the mist colour.
 */
export function paintFuji(W = 1600, H = 400): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const R = rng(3776);

  const cx = W / 2;
  const top = 36;
  const bot = H + 8;
  const hwTop = 40 * (W / 1600);
  // Fuji is a BROAD cone: flanks ~30° from horizontal (half-width ≈ 1.4–1.55× the height), slightly concave,
  // with a flat crater rim. t = 0 at the summit, 1 at the bottom of the canvas.
  const hw = (t: number) => hwTop + 569 * (W / 1600) * Math.pow(t, 1.35);
  const yOf = (t: number) => top + (bot - top) * t;
  const wob = (t: number, s: number) => (Math.sin(t * 23 + s * 2.1) * 2.6 + Math.sin(t * 57 + s) * 1.3 + Math.sin(t * 11 + s * 4) * 3.4) * Math.min(1, t * 3);
  const STEPS = 90;

  const mountainPath = () => {
    const p = new Path2D();
    p.moveTo(cx - hwTop, top + 9);
    p.quadraticCurveTo(cx - hwTop * 0.7, top - 1, cx - hwTop * 0.3, top);
    p.quadraticCurveTo(cx - hwTop * 0.05, top + 5, cx + hwTop * 0.2, top + 1);
    p.quadraticCurveTo(cx + hwTop * 0.65, top - 3, cx + hwTop, top + 10);
    for (let i = 1; i <= STEPS; i++) {
      const t = i / STEPS;
      p.lineTo(cx + hw(t) + wob(t, 1), yOf(t));
    }
    for (let i = STEPS; i >= 1; i--) {
      const t = i / STEPS;
      p.lineTo(cx - hw(t) - wob(t, -1), yOf(t));
    }
    p.closePath();
    return p;
  };
  const mountain = mountainPath();

  g.save();
  g.clip(mountain);

  // rock: one hue, darker at the summit, hazier toward the foot
  const rock = g.createLinearGradient(0, top, 0, bot);
  rock.addColorStop(0, "#5c7cb6");
  rock.addColorStop(0.45, "#7b98c8");
  rock.addColorStop(0.8, "#a9c0e0");
  rock.addColorStop(1, "#d3e3f4");
  g.fillStyle = rock;
  g.fillRect(0, 0, W, H);

  // shaded right flank (a soft diagonal ridge running down from just right of the summit)
  g.beginPath();
  g.moveTo(cx + hwTop * 0.1, top - 4);
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    g.lineTo(cx + hw(t) * (0.1 + 0.1 * t), yOf(t));
  }
  g.lineTo(W, bot);
  g.lineTo(W, 0);
  g.closePath();
  g.fillStyle = "rgba(36,58,128,0.24)";
  g.fill();
  // and a lighter lit rim on the far left edge
  g.beginPath();
  g.moveTo(cx - hwTop, top + 6);
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    g.lineTo(cx - hw(t) * 0.94 - wob(t, -1) * 0.6, yOf(t));
  }
  for (let i = STEPS; i >= 0; i--) {
    const t = i / STEPS;
    g.lineTo(cx - hw(t) - wob(t, -1) - 6, yOf(t));
  }
  g.closePath();
  g.fillStyle = "rgba(255,255,255,0.10)";
  g.fill();

  // radial ridges / gullies (narrow wedges that fan out from the summit)
  const ridges: { u: number; t1: number; w1: number; dark: boolean }[] = [];
  for (let i = 0; i < 26; i++) {
    const u = (R() * 2 - 1) * 0.95;
    ridges.push({ u, t1: 0.55 + R() * 0.45, w1: 4 + R() * 14, dark: R() < 0.62 });
  }
  const drawRidges = (t0: number, darkCol: string, lightCol: string) => {
    for (const r of ridges) {
      const a = { x: cx + r.u * hw(t0), y: yOf(t0) };
      const b = { x: cx + r.u * hw(r.t1), y: yOf(r.t1) };
      g.beginPath();
      g.moveTo(a.x - 0.8, a.y);
      g.lineTo(a.x + 0.8, a.y);
      g.lineTo(b.x + r.w1 / 2, b.y);
      g.lineTo(b.x - r.w1 / 2, b.y);
      g.closePath();
      g.fillStyle = r.dark ? darkCol : lightCol;
      g.fill();
    }
  };
  drawRidges(0.16, "rgba(38,62,132,0.17)", "rgba(255,255,255,0.10)");

  // ---- snow cap ----
  const snowHw = hw(0.34);
  const fingers = [-0.88, -0.63, -0.4, -0.15, 0.12, 0.37, 0.62, 0.87].map((u, i) => ({ x: cx + u * snowHw, w: (26 + ((i * 7) % 5) * 3) * (W / 1600), d: [0.075, 0.105, 0.06, 0.125, 0.07, 0.11, 0.06, 0.09][i] }));
  const snowT = (x: number) => {
    let t = 0.3 + 0.022 * Math.sin(x * 0.03) + 0.016 * Math.sin(x * 0.083 + 1) + 0.01 * Math.sin(x * 0.19 + 2);
    for (const f of fingers) {
      const k = 1 - Math.abs(x - f.x) / f.w;
      if (k > 0) t += f.d * Math.pow(k, 1.35);
    }
    return t;
  };
  const snowY = (x: number) => {
    const t = snowT(x);
    const dx = (x - cx) / Math.max(1, hw(Math.min(1, t)));
    const bulge = 12 * Math.max(0, 1 - dx * dx); // ring seen from slightly above
    return yOf(t) + bulge;
  };
  const snowPath = () => {
    const p = new Path2D();
    p.moveTo(0, 0);
    p.lineTo(W, 0);
    for (let x = W; x >= 0; x -= 2) p.lineTo(x, snowY(x));
    p.closePath();
    return p;
  };
  const snow = snowPath();
  g.fillStyle = "#ffffff";
  g.fill(snow);

  g.save();
  g.clip(snow);
  // snow shading: right flank + bluish gullies + a couple of soft shadow patches
  g.beginPath();
  g.moveTo(cx + hwTop * 0.1, top - 4);
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    g.lineTo(cx + hw(t) * (0.1 + 0.1 * t), yOf(t));
  }
  g.lineTo(W, bot);
  g.lineTo(W, 0);
  g.closePath();
  g.fillStyle = "rgba(120,150,214,0.33)";
  g.fill();
  drawRidges(0.03, "rgba(112,142,210,0.34)", "rgba(255,255,255,0.0)");
  g.fillStyle = "rgba(150,176,228,0.22)";
  g.beginPath();
  g.ellipse(cx - 60, top + 62, 46, 12, -0.25, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(cx + 80, top + 100, 60, 14, 0.2, 0, Math.PI * 2);
  g.fill();
  g.restore();

  // hazy foot: same mist colour as the world haze
  const mist = g.createLinearGradient(0, H * 0.68, 0, H);
  mist.addColorStop(0, "rgba(219,238,255,0)");
  mist.addColorStop(1, "rgba(219,238,255,1)");
  g.fillStyle = mist;
  g.fillRect(0, H * 0.68, W, H * 0.32);
  g.restore();

  // two flat wisps of cloud drifting across the slope
  const wisp = (x: number, y: number, w: number, h: number) => {
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 6; i++) {
      const k = i / 5;
      g.beginPath();
      g.ellipse(x + (k - 0.5) * w * 0.8, y - Math.sin(k * Math.PI) * h * 0.45, w * (0.16 + 0.1 * Math.sin(k * Math.PI)), h * (0.5 + 0.3 * Math.sin(k * Math.PI)), 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#e6eff9";
    g.beginPath();
    g.ellipse(x, y + h * 0.28, w * 0.46, h * 0.2, 0, 0, Math.PI * 2);
    g.fill();
  };
  wisp(cx - 330, top + 235, 330, 38);
  wisp(cx + 370, top + 165, 270, 32);
  return c;
}

/* ------------------------------------------------------------------ */
/* Layered hills, sakura groves, pagoda and fields (360° panorama)      */
/* ------------------------------------------------------------------ */

/** Vertical layout of the panorama (world units, at the cylinder radius): top = +TOP_Y, bottom = -BOT_Y. */
export const PANO = { topY: 14, botY: 50 };

interface Palette {
  base: string;
  mid: string;
  hi: string;
}
const GREENS: Palette[] = [
  { base: "#3f8f57", mid: "#58a96c", hi: "#82c98f" },
  { base: "#4a9a5d", mid: "#66b676", hi: "#8fd39b" },
  { base: "#3a8450", mid: "#4f9f63", hi: "#74be82" },
];
const PINKS: Palette[] = [
  { base: "#e37ea9", mid: "#f6a4c6", hi: "#ffd2e3" },
  { base: "#ea8fb6", mid: "#f9b4d1", hi: "#ffdcea" },
  { base: "#dd77a3", mid: "#f39cc0", hi: "#ffc9de" },
];

export function paintHills(W = 4096, H = 512): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const R = rng(20240607);
  const TAU = Math.PI * 2;
  const pxPerUnit = H / (PANO.topY + PANO.botY);
  const yUnits = (u: number) => (PANO.topY - u) * pxPerUnit; // world height (units) -> canvas y
  const s = W / 4096; // feature scale

  const harm = (x: number, terms: [number, number, number][]) => terms.reduce((acc, [k, a, p]) => acc + a * Math.sin((TAU * k * x) / W + p), 0);

  // wrap-aware drawing: draw again at x±W when a shape crosses the seam
  const wrap = (x: number, r: number, draw: (xx: number) => void) => {
    draw(x);
    if (x - r < 0) draw(x + W);
    if (x + r > W) draw(x - W);
  };

  const fillLayer = (crest: (x: number) => number, color: string, rim?: { color: string; w: number }) => {
    g.beginPath();
    g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, crest(x));
    g.lineTo(W, H);
    g.closePath();
    g.fillStyle = color;
    g.fill();
    if (rim) {
      g.beginPath();
      for (let x = 0; x <= W; x += 4) (x === 0 ? g.moveTo : g.lineTo).call(g, x, crest(x) + rim.w / 2);
      g.lineWidth = rim.w;
      g.strokeStyle = rim.color;
      g.stroke();
    }
  };

  const crown = (x: number, y: number, r: number, pal: Palette) => {
    wrap(x, r, (xx) => {
      if (r > 11 * s) {
        g.fillStyle = "#6b4a2b";
        g.fillRect(xx - r * 0.09, y + r * 0.6, r * 0.18, r * 0.5);
      }
      g.fillStyle = pal.base;
      g.beginPath();
      g.arc(xx, y, r, 0, TAU);
      g.fill();
      g.fillStyle = pal.mid;
      g.beginPath();
      g.arc(xx - r * 0.1, y - r * 0.12, r * 0.86, 0, TAU);
      g.fill();
      g.fillStyle = pal.hi;
      g.beginPath();
      g.arc(xx - r * 0.3, y - r * 0.34, r * 0.42, 0, TAU);
      g.fill();
    });
  };

  // pinkness field: discrete groves (threshold, not a gradient)
  const pinkAt = (x: number, seed: number) => harm(x, [[7 + seed, 1, seed], [13 + seed * 2, 0.8, seed * 2.3], [29, 0.5, seed * 1.1]]) > 0.75;

  const treeLine = (crest: (x: number) => number, rMin: number, rMax: number, gap: number, dy: number, seed: number) => {
    for (let x = 0; x < W; ) {
      const r = (rMin + R() * (rMax - rMin)) * s;
      const y = crest(x) + dy * s + (R() - 0.5) * 3 * s;
      const pink = pinkAt(x, seed) ? R() < 0.92 : R() < 0.04;
      const pal = pink ? PINKS[Math.floor(R() * PINKS.length)] : GREENS[Math.floor(R() * GREENS.length)];
      crown(x, y, r, pal);
      x += r * gap;
    }
  };

  /* --- far ridge: pale blue-teal, no detail --- */
  const farCrest = (x: number) => yUnits(0.2) + harm(x, [[3, -22 * s, 0.4], [5, 13 * s, 1.3], [9, 9 * s, 2.1], [17, 5 * s, 0.7], [33, 2.5 * s, 3]]);
  fillLayer(farCrest, "#a9cdd3", { color: "#c6dfe3", w: 5 * s });
  // a lighter haze over the ridge
  g.fillStyle = "rgba(219,238,255,0.35)";
  g.fillRect(0, yUnits(0.2) - 40 * s, W, H);

  /* --- mid hills: soft green with a scalloped tree line and a few pink groves + a pagoda --- */
  const midCrest = (x: number) => yUnits(-3.2) + harm(x, [[4, -20 * s, 2], [6, 12 * s, 0.6], [11, 8 * s, 1.7], [19, 4 * s, 2.9], [37, 2.5 * s, 0.2]]);
  fillLayer(midCrest, "#93cf9f", { color: "#aee0b4", w: 6 * s });
  treeLine(midCrest, 6, 9.5, 1.15, 3, 1);
  // pagoda on the mid hills
  const pagoda = (x: number, baseY: number, k: number) => {
    wrap(x, 40 * k, (xx) => {
      const tiers = 5;
      let y = baseY;
      g.fillStyle = "#7d8792";
      g.fillRect(xx - 22 * k, y - 5 * k, 44 * k, 5 * k);
      for (let i = 0; i < tiers; i++) {
        const w = (26 - i * 3.6) * k;
        const bh = 7.5 * k;
        y -= bh;
        g.fillStyle = i % 2 ? "#efe6d0" : "#b3271b";
        g.fillRect(xx - w / 2, y, w, bh);
        // roof: dark tile, upturned corners
        const rw = w + 9 * k;
        g.fillStyle = "#44505c";
        g.beginPath();
        g.moveTo(xx - rw / 2 - 2 * k, y + 1 * k);
        g.lineTo(xx - rw / 2 + 3 * k, y - 4 * k);
        g.lineTo(xx + rw / 2 - 3 * k, y - 4 * k);
        g.lineTo(xx + rw / 2 + 2 * k, y + 1 * k);
        g.closePath();
        g.fill();
        y -= 4 * k;
      }
      g.fillStyle = "#44505c";
      g.fillRect(xx - 1 * k, y - 12 * k, 2 * k, 12 * k);
      g.fillStyle = "#ffd21f";
      g.fillRect(xx - 3 * k, y - 8 * k, 6 * k, 1.5 * k);
    });
  };
  {
    const px = W * 0.234;
    pagoda(px, midCrest(px) + 14 * s, 1.2 * s);
    treeLine((x) => (Math.abs(x - px) < 80 * s ? midCrest(x) : 9999), 7, 10, 1.1, 8, 3);
  }

  /* --- near forest: big round crowns, distinct sakura groves --- */
  const nearCrest = (x: number) => yUnits(-10.5) + harm(x, [[5, -12 * s, 0.9], [8, 8 * s, 2.2], [14, 5 * s, 0.3], [27, 3 * s, 1.4]]);
  fillLayer(nearCrest, "#6cba77", { color: "#8ad393", w: 6 * s });
  treeLine(nearCrest, 13, 21, 1.05, 6, 2);
  treeLine(nearCrest, 12, 18, 1.15, 26, 5);

  /* --- fields: flat horizontal bands with a little wave, small trees in rows --- */
  const fieldTop = yUnits(-16.2);
  {
    let y = fieldTop;
    let i = 0;
    while (y < H) {
      const bandH = (7 + i * i * 1.15) * s;
      g.fillStyle = i % 2 ? "#79c47f" : "#6cba77";
      g.beginPath();
      g.moveTo(0, y + bandH);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin((TAU * 23 * x) / W + i * 1.7) * 1.2 * s + Math.sin((TAU * 41 * x) / W + i) * 0.8 * s);
      g.lineTo(W, y + bandH);
      g.closePath();
      g.fill();
      y += bandH;
      i++;
    }
  }
  const rowTrees = (y: number, r: number, gap: number, seed: number) => {
    for (let x = R() * 30; x < W; ) {
      const rr = r * (0.85 + R() * 0.3) * s;
      const pink = pinkAt(x, seed) ? R() < 0.9 : R() < 0.03;
      crown(x, y, rr, pink ? PINKS[Math.floor(R() * 3)] : GREENS[Math.floor(R() * 3)]);
      x += rr * gap * (1 + R() * 1.4);
    }
  };
  rowTrees(fieldTop + 24 * s, 8, 2.2, 4);
  rowTrees(fieldTop + 62 * s, 11.5, 2.6, 6);

  // mist: only the lowest part fades to the world haze colour so the far road end melts into it
  const m0 = yUnits(-25);
  const m1 = yUnits(-38);
  const mist = g.createLinearGradient(0, m0, 0, m1);
  mist.addColorStop(0, "rgba(219,238,255,0)");
  mist.addColorStop(1, "rgba(219,238,255,1)");
  g.fillStyle = mist;
  g.fillRect(0, m0, W, m1 - m0);
  g.fillStyle = MIST_HEX;
  g.fillRect(0, m1, W, H - m1);
  return c;
}
