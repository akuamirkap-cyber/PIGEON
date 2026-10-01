import { useState } from "react";
import { useUI, WHEEL_COLORS } from "../game/store";
import { engine } from "../game/engine";
import { getSkin, SKINS } from "../game/skins";
import { sfx, unlockAudio } from "../game/audio";
import { BreadIcon } from "./BreadIcon";
import { LockIcon } from "./LockIcon";
import { SkinsPanel } from "./SkinsPanel";
import { TricksPanel } from "./TricksPanel";
import { PigeonIcon } from "./PigeonIcon";

function Arrow({ dir, onClick }: { dir: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir < 0 ? "Previous skin" : "Next skin"}
      className="pointer-events-auto flex h-[13cqw] w-[13cqw] items-center justify-center rounded-full bg-white shadow-[0_4px_0_rgba(0,0,0,0.18)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.18)]"
    >
      <svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="#1f2430" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir < 0 ? "translateX(-6%)" : "translateX(6%)" }}>
        {dir < 0 ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  );
}

function Dots({ current }: { current: string }) {
  const unlocked = useUI((s) => s.unlocked);
  return (
    <div className="flex items-center gap-[1.4cqw]">
      {SKINS.map((k) => {
        const active = k.id === current;
        const open = unlocked.includes(k.id);
        return (
          <div
            key={k.id}
            className={`h-[1.9cqw] rounded-full transition-all duration-200 ${active ? "w-[5.5cqw] bg-[#2ec4b6]" : open ? "w-[1.9cqw] bg-white" : "w-[1.9cqw] bg-[#1f2430]/30"}`}
          />
        );
      })}
    </div>
  );
}

/** Compact setting pill: shows the current value and cycles to the next one on tap. */
function CyclePill({
  label,
  value,
  onTap,
  accent,
  dot,
}: {
  label: string;
  value: string;
  onTap: () => void;
  /** warna aksen saat nilai aktif (non-default) */
  accent?: string;
  /** warna bulatan kecil di kiri (untuk indikator warna ban) */
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        sfx.click();
        onTap();
      }}
      className="pointer-events-auto flex min-h-[46px] flex-1 flex-col items-center justify-center rounded-2xl bg-white/95 px-1.5 py-1.5 leading-none shadow-[0_3px_0_rgba(0,0,0,0.12)] transition-transform active:translate-y-[2px] active:shadow-none"
    >
      <span className="font-body text-[2.1cqw] font-extrabold tracking-[0.14em] text-[#1f2430]/55">{label}</span>
      <span className="mt-1 flex max-w-full items-center gap-1 font-display text-[3.1cqw] leading-none text-[#1f2430]">
        {dot && <span className="h-[2.6cqw] w-[2.6cqw] shrink-0 rounded-full border border-black/20" style={{ background: dot }} />}
        <span className="truncate px-0.5" style={accent ? { color: accent } : undefined}>
          {value}
        </span>
      </span>
    </button>
  );
}

/** Track mode selector: Mount Haruna, Tokyo City, and Shibuya Scramble. */
function TrackModeRow() {
  const trackMode = useUI((s) => s.trackMode);
  const setTrackMode = useUI((s) => s.setTrackMode);
  const addPopup = useUI((s) => s.addPopup);

  const selectTrack = (mode: "haruna" | "tokyo" | "shibuya") => {
    if (mode === trackMode) return;
    unlockAudio();
    setTrackMode(mode);
    engine.setTrackMode(mode);
    if (mode === "haruna") {
      sfx.unlock();
      addPopup("TRACK: MT. HARUNA", "#ff9f1c", "Gunma Touge Downhill & Hairpins");
    } else if (mode === "shibuya") {
      sfx.click();
      addPopup("TRACK: SHIBUYA SCRAMBLE", "#c77dff", "Daylight, neon, and busy crosswalks");
    } else {
      sfx.click();
      addPopup("TRACK: TOKYO CITY", "#2ec4b6", "City Streets & Crossings");
    }
  };

  const cell = (mode: "haruna" | "tokyo" | "shibuya", title: string, badge: string, activeBg: string, activeShadow: string) => {
    const active = trackMode === mode;
    return (
      <button
        type="button"
        onClick={() => selectTrack(mode)}
        className={`pointer-events-auto flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl font-display text-[3.2cqw] leading-none transition-all active:translate-y-[1px] ${
          active ? `${activeBg} text-[#1f2430] shadow-[0_3px_0_${activeShadow}]` : "text-[#1f2430]/60"
        }`}
      >
        <span>{title}</span>
        <span className={`rounded px-1 py-0.5 font-body text-[1.9cqw] font-black ${active ? "bg-black/15" : "bg-black/10"}`}>{badge}</span>
      </button>
    );
  };

  return (
    <div className="flex w-full items-center gap-1 rounded-2xl bg-[#1f2430]/25 p-1 backdrop-blur-[3px]">
      {cell("haruna", "HARUNA", "GUNMA", "bg-[#ffc46b]", "#c9700a")}
      {cell("tokyo", "TOKYO", "CITY", "bg-[#7ce0d4]", "#1f9a8f")}
      {cell("shibuya", "SHIBUYA", "CITY", "bg-[#d5a8ff]", "#8b3fd6")}
    </div>
  );
}

/**
 * Setelan cepat dalam grid rapi (mobile friendly):
 * SPEED, CURVE, BOARD, weather/light/time, Crossy Road camera, TURN, and wheel-color controls.
 */
function SettingsRow() {
  const speed = useUI((s) => s.speedMode);
  const setSpeed = useUI((s) => s.setSpeedMode);
  const turn = useUI((s) => s.turnMode);
  const setTurn = useUI((s) => s.setTurnMode);
  const cameraMode = useUI((s) => s.cameraMode);
  const setCameraMode = useUI((s) => s.setCameraMode);
  const deck = useUI((s) => s.deckOverride);
  const setDeck = useUI((s) => s.setDeckOverride);
  const curve = useUI((s) => s.worldCurve);
  const setCurve = useUI((s) => s.setWorldCurve);
  const wheel = useUI((s) => s.wheelColor);
  const setWheel = useUI((s) => s.setWheelColor);
  const weather = useUI((s) => s.weather);
  const toggleWeather = useUI((s) => s.toggleWeather);
  const nightBright = useUI((s) => s.nightBright);
  const cycleNightBright = useUI((s) => s.cycleNightBright);
  const shibuyaTime = useUI((s) => s.shibuyaTime);
  const cycleShibuyaTime = useUI((s) => s.cycleShibuyaTime);
  const addPopup = useUI((s) => s.addPopup);
  const [tips, setTips] = useState(false);

  const toggleDeck = () => {
    const next = deck === "baguette" ? "default" : "baguette";
    setDeck(next);
    engine.skinPop();
    if (next === "baguette") {
      sfx.unlock();
      addPopup("PAPAN ROTI BAGUETTE!", "#ff9f1c", "Free Baguette Skateboard");
    } else {
      sfx.click();
      addPopup("PAPAN STANDAR", "#2ec4b6", "Classic Pro Deck");
    }
  };

  const toggleCurve = () => {
    const next = curve === "subway" ? "flat" : "subway";
    setCurve(next);
    if (next === "subway") {
      sfx.unlock();
      addPopup("SUBWAY CURVE", "#4cc9f0", "World Curvature ON");
    } else {
      sfx.click();
      addPopup("FLAT WORLD", "#a0aec0", "World Curvature OFF");
    }
  };

  const cycleWheel = () => {
    const idx = WHEEL_COLORS.findIndex((w) => w.id === wheel);
    const next = WHEEL_COLORS[(idx + 1) % WHEEL_COLORS.length];
    setWheel(next.id);
    engine.skinPop();
    if (next.id === "auto") sfx.click();
    else sfx.unlock();
  };

  const wheelDot = WHEEL_COLORS.find((w) => w.id === wheel)?.hex;
  const wheelLabel = WHEEL_COLORS.find((w) => w.id === wheel)?.label ?? "HITAM";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex w-full gap-1.5">
        <CyclePill label="SPEED" value={speed === 1 ? "NORMAL" : `${speed}×`} accent={speed > 1 ? "#c9700a" : undefined} onTap={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1)} />
        <CyclePill label="CURVE" value={curve === "subway" ? "SUBWAY" : "FLAT"} onTap={toggleCurve} />
        <CyclePill label="BOARD" value={deck === "baguette" ? "ROTI" : "PRO"} accent={deck === "baguette" ? "#c9700a" : undefined} onTap={toggleDeck} />
      </div>
      <div className="flex w-full gap-1.5">
        <CyclePill
          label="CUACA"
          value={weather === "cloudy" ? "BERAWAN" : "CERAH"}
          accent={weather === "cloudy" ? "#6b7f93" : undefined}
          onTap={() => {
            toggleWeather();
            sfx.click();
            addPopup(weather === "sunny" ? "SIANG BERAWAN ☁️" : "SIANG CERAH ☀️", weather === "sunny" ? "#8fa3b8" : "#ffc46b", weather === "sunny" ? "langit lembut keperakan" : "matahari penuh");
          }}
        />
        <CyclePill
          label="LAMPU"
          value={nightBright === 0 ? "REDUP" : nightBright === 1 ? "PAS" : "TERANG"}
          accent={nightBright === 2 ? "#c9a13d" : undefined}
          onTap={() => {
            cycleNightBright();
            sfx.click();
          }}
        />
        <CyclePill
          label="WAKTU"
          value={shibuyaTime.toUpperCase()}
          accent={shibuyaTime !== "malam" ? "#d98b3d" : undefined}
          onTap={() => {
            cycleShibuyaTime();
            sfx.click();
          }}
        />
      </div>
      <div className="flex w-full gap-1.5">
        <CyclePill label="KAMERA" value={cameraMode === "crossy" ? "CROSSY" : "CHASE"} accent={cameraMode === "crossy" ? "#168879" : undefined} onTap={() => setCameraMode(cameraMode === "crossy" ? "chase" : "crossy")} />
        <CyclePill label="TURN" value={turn === "new" ? "STEER" : "SLIDE"} onTap={() => setTurn(turn === "new" ? "old" : "new")} />
        <CyclePill label="BAN" value={wheelLabel} dot={wheelDot} onTap={cycleWheel} />
        <button
          type="button"
          onClick={() => {
            sfx.click();
            setTips((v) => !v);
          }}
          aria-label="Cara main"
          className={`pointer-events-auto flex min-h-[46px] w-[16%] shrink-0 items-center justify-center rounded-2xl font-display text-[4cqw] leading-none shadow-[0_3px_0_rgba(0,0,0,0.12)] transition-transform active:translate-y-[2px] active:shadow-none ${
            tips ? "bg-[#1f2430] text-white" : "bg-white/95 text-[#1f2430]"
          }`}
        >
          ?
        </button>
      </div>
      {tips && (
        <div className="rounded-2xl bg-white/90 px-3 py-2 text-center font-body text-[2.7cqw] font-extrabold leading-snug text-[#1f2430]/75 backdrop-blur-[2px]">
          Swipe ↔ pindah jalur · tap / ↑ lompat · SPRINT = kayuh cepat · NOS kalau penuh
        </div>
      )}
    </div>
  );
}

function MainMenu() {
  const best = useUI((s) => s.best);
  const wallet = useUI((s) => s.wallet);
  const previewId = useUI((s) => s.preview);
  const unlocked = useUI((s) => s.unlocked);
  const cycleSkin = useUI((s) => s.cycleSkin);
  const unlockSkin = useUI((s) => s.unlockSkin);
  const setMenuView = useUI((s) => s.setMenuView);
  const [shakeKey, setShakeKey] = useState(0);
  const skin = getSkin(previewId);
  const isUnlocked = unlocked.includes(skin.id);
  const affordable = wallet >= skin.cost;

  const setPreview = useUI((s) => s.setPreview);
  const equippedId = useUI((s) => s.skin);
  const start = () => {
    unlockAudio();
    sfx.click();
    if (!isUnlocked) setPreview(equippedId);
    engine.startRun();
  };
  const cycle = (dir: -1 | 1) => {
    unlockAudio();
    sfx.click();
    cycleSkin(dir);
    engine.skinPop();
  };
  const unlock = () => {
    unlockAudio();
    if (unlockSkin(skin.id)) {
      sfx.unlock();
      engine.skinPop();
    } else {
      sfx.deny();
      setShakeKey((k) => k + 1);
    }
  };
  const open = (v: "skins" | "tricks" | "exit") => {
    unlockAudio();
    sfx.click();
    engine.faceCamera();
    setMenuView(v);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* ── top bar: wallet · best · (mute lives in HUD) ── */}
      <div className="absolute left-[4%] top-[3.5%] flex h-10 items-center gap-1.5 rounded-full bg-[#1f2430]/55 px-3 shadow-[0_3px_0_rgba(0,0,0,0.18)] backdrop-blur-[2px]">
        <BreadIcon size={22} />
        <span className="font-display txt-outline-sm text-[4.6cqw] leading-none text-white">{wallet}</span>
      </div>
      {best > 0 && (
        <div className="absolute left-1/2 top-[3.5%] flex h-10 -translate-x-1/2 items-center rounded-full bg-[#1f2430]/55 px-3 font-display text-[3.4cqw] leading-none text-[#ffd60a] shadow-[0_3px_0_rgba(0,0,0,0.18)] backdrop-blur-[2px]">
          BEST {best}
        </div>
      )}

      {/* ── title ── */}
      <div className="absolute left-0 right-0 top-[10.5%] flex flex-col items-center">
        <div className="rounded-full bg-[#1f2430]/80 px-3 py-0.5 font-body text-[2.7cqw] font-extrabold tracking-[0.3em] text-white">VOXEL SKATE RUNNER</div>
        <div className="font-display txt-outline mt-1.5 text-[12cqw] leading-none text-white" style={{ transform: "rotate(-3deg)" }}>
          PIGEON
        </div>
        <div className="font-display txt-outline -mt-1 text-[16cqw] leading-none text-[#ffd60a]" style={{ transform: "rotate(-3deg)" }}>
          SK8
        </div>
      </div>

      {/* ── character stage: 3D pigeon on the turntable sits between the arrows ── */}
      <div className="absolute left-[4%] right-[4%] top-[44%] flex -translate-y-1/2 items-center justify-between">
        <Arrow dir={-1} onClick={() => cycle(-1)} />
        <Arrow dir={1} onClick={() => cycle(1)} />
      </div>
      <div className="absolute left-0 right-0 top-[63%] flex flex-col items-center gap-[1.2cqw]">
        <div
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-display text-[4.4cqw] leading-none shadow-[0_4px_0_rgba(0,0,0,0.18)] ${
            isUnlocked ? "bg-white text-[#1f2430]" : "bg-[#1f2430] text-white"
          }`}
        >
          {!isUnlocked && <LockIcon size={16} color="#ffd60a" />}
          {skin.name.toUpperCase()}
        </div>
        <div className="font-body text-[3cqw] font-extrabold text-[#1f2430]/70">{isUnlocked ? skin.tagline : `Locked · collect bread to unlock`}</div>
        <Dots current={skin.id} />
      </div>

      {/* ── buttons ── */}
      <div className="absolute bottom-[3%] left-[6%] right-[6%] flex flex-col gap-1.5">
        {/* panel setelan: satu kartu rapi biar tidak berantakan di layar HP */}
        <div className="flex flex-col gap-1.5 rounded-[24px] bg-black/15 p-1.5 backdrop-blur-[2px]">
          <TrackModeRow />
          <SettingsRow />
        </div>
        {isUnlocked ? (
          <button
            type="button"
            onClick={start}
            className="pointer-events-auto relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#3ddbc9] to-[#22b3a5] py-[3.6cqw] font-display text-[7.6cqw] leading-none text-white shadow-[0_6px_0_#1f9a8f] active:translate-y-[4px] active:shadow-[0_2px_0_#1f9a8f]"
          >
            <span className="relative z-10">START</span>
            <span className="shine pointer-events-none absolute inset-y-0 w-[22%] -rotate-12 bg-white/25 blur-[2px]" />
          </button>
        ) : (
          <div key={shakeKey} className={shakeKey ? "shake" : undefined}>
            <button
              type="button"
              onClick={unlock}
              className={`pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl py-[3.2cqw] font-display text-[5.6cqw] leading-none ${
                affordable
                  ? "bg-[#ffd60a] text-[#1f2430] shadow-[0_6px_0_#c9a400] active:translate-y-[4px] active:shadow-[0_2px_0_#c9a400]"
                  : "bg-[#d9dde3] text-[#6b7280] shadow-[0_6px_0_#b3b9c2]"
              }`}
            >
              {affordable ? "UNLOCK" : "NEED"}
              <span className="flex items-center gap-1">
                <BreadIcon size={24} />
                {skin.cost}
              </span>
            </button>
          </div>
        )}
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={() => open("skins")}
            className="pointer-events-auto flex-1 rounded-2xl bg-[#ffd60a] py-[2.6cqw] font-display text-[4.4cqw] leading-none text-[#1f2430] shadow-[0_5px_0_#c9a400] active:translate-y-[3px] active:shadow-[0_2px_0_#c9a400]"
          >
            SKINS
          </button>
          <button
            type="button"
            onClick={() => open("tricks")}
            className="pointer-events-auto flex-1 rounded-2xl bg-[#c77dff] py-[2.6cqw] font-display text-[4.4cqw] leading-none text-white shadow-[0_5px_0_#8f4fcf] active:translate-y-[3px] active:shadow-[0_2px_0_#8f4fcf]"
          >
            TRICKS
          </button>
          <button
            type="button"
            onClick={() => open("exit")}
            className="pointer-events-auto flex-1 rounded-2xl bg-[#ef4b4b] py-[2.6cqw] font-display text-[4.4cqw] leading-none text-white shadow-[0_5px_0_#b83232] active:translate-y-[3px] active:shadow-[0_2px_0_#b83232]"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

function ExitDialog() {
  const setMenuView = useUI((s) => s.setMenuView);
  const skin = getSkin(useUI((s) => s.skin));
  const stay = () => {
    sfx.click();
    setMenuView("main");
  };
  const exit = () => {
    sfx.click();
    setMenuView("bye");
    try {
      window.close();
    } catch {
      /* browsers usually block this */
    }
  };
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex select-none items-center justify-center bg-black/40" onClick={stay}>
      <div className="card-in w-[78%] rounded-[28px] bg-white px-5 pb-5 pt-6 text-center shadow-[0_10px_0_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center">
          <PigeonIcon skin={skin} size={88} />
        </div>
        <div className="mt-2 font-display text-[6.5cqw] leading-none text-[#1f2430]">LEAVE THE PARK?</div>
        <div className="mt-2 font-body text-[3.4cqw] font-bold text-[#6b7280]">Your bread and skins are saved.</div>
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={stay}
            className="flex-1 rounded-2xl bg-[#2ec4b6] py-3 font-display text-[4.6cqw] text-white shadow-[0_5px_0_#1f9a8f] active:translate-y-[3px] active:shadow-[0_2px_0_#1f9a8f]"
          >
            STAY
          </button>
          <button
            type="button"
            onClick={exit}
            className="flex-1 rounded-2xl bg-[#ef4b4b] py-3 font-display text-[4.6cqw] text-white shadow-[0_5px_0_#b83232] active:translate-y-[3px] active:shadow-[0_2px_0_#b83232]"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  );
}

function ByeScreen() {
  const setMenuView = useUI((s) => s.setMenuView);
  const best = useUI((s) => s.best);
  const skin = getSkin(useUI((s) => s.skin));
  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex select-none flex-col items-center justify-center bg-[#151823] px-8 text-center">
      <div className="flex justify-center">
        <PigeonIcon skin={skin} size={120} />
      </div>
      <div className="font-display mt-4 text-[9cqw] leading-none text-white">THANKS FOR</div>
      <div className="font-display text-[9cqw] leading-none text-[#ffd60a]">PLAYING!</div>
      <div className="mt-4 font-body text-[3.6cqw] font-bold text-white/60">Coo coo. See you on the next ride.</div>
      {best > 0 && <div className="mt-2 font-display text-[4cqw] text-[#2ec4b6]">BEST {best}</div>}
      <button
        type="button"
        onClick={() => {
          sfx.click();
          setMenuView("main");
        }}
        className="mt-8 rounded-2xl bg-[#2ec4b6] px-8 py-3.5 font-display text-[5cqw] text-white shadow-[0_5px_0_#1f9a8f] active:translate-y-[3px] active:shadow-[0_2px_0_#1f9a8f]"
      >
        BACK TO MENU
      </button>
    </div>
  );
}

export function Menu() {
  const phase = useUI((s) => s.phase);
  const view = useUI((s) => s.menuView);
  if (phase !== "menu") return null;
  return (
    <>
      {view === "main" && <MainMenu />}
      {view === "skins" && <SkinsPanel />}
      {view === "tricks" && <TricksPanel />}
      {view === "exit" && (
        <>
          <MainMenu />
          <ExitDialog />
        </>
      )}
      {view === "bye" && <ByeScreen />}
    </>
  );
}
