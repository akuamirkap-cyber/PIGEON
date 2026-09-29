import { useState } from "react";
import { useUI } from "../game/store";
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
function CyclePill({ label, value, onTap, tone }: { label: string; value: string; onTap: () => void; tone: "orange" | "teal" }) {
  const bg = tone === "orange" ? "bg-[#ff9f1c] shadow-[0_3px_0_#c9700a]" : "bg-[#2ec4b6] shadow-[0_3px_0_#1f9a8f]";
  return (
    <button
      type="button"
      onClick={() => {
        unlockAudio();
        sfx.click();
        onTap();
      }}
      className={`pointer-events-auto flex flex-1 flex-col items-center justify-center rounded-2xl px-1.5 py-1.5 leading-none text-[#1f2430] active:translate-y-[2px] active:shadow-none ${bg}`}
    >
      <span className="font-body text-[2.1cqw] font-extrabold tracking-[0.12em] text-[#1f2430]/75">{label}</span>
      <span className="mt-1 font-display text-[3.1cqw] truncate max-w-full px-0.5">{value}</span>
    </button>
  );
}

/** Track mode selector: Mountain Haruna (Gunma Touge) vs Tokyo City. */
function TrackModeRow() {
  const trackMode = useUI((s) => s.trackMode);
  const setTrackMode = useUI((s) => s.setTrackMode);
  const addPopup = useUI((s) => s.addPopup);

  const selectTrack = (mode: "haruna" | "tokyo") => {
    if (mode === trackMode) return;
    unlockAudio();
    setTrackMode(mode);
    engine.setTrackMode(mode);
    if (mode === "haruna") {
      sfx.unlock();
      addPopup("TRACK: MT. HARUNA ⛰️", "#ff9f1c", "Gunma Touge Downhill & Hairpins");
    } else {
      sfx.click();
      addPopup("TRACK: TOKYO CITY 🏙️", "#2ec4b6", "Shibuya Streets & Crossings");
    }
  };

  return (
    <div className="flex w-full items-center gap-1 rounded-2xl bg-black/40 p-1 backdrop-blur-[4px] shadow-[0_3px_0_rgba(0,0,0,0.2)]">
      <button
        type="button"
        onClick={() => selectTrack("haruna")}
        className={`pointer-events-auto flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 font-display text-[3.4cqw] leading-none transition-all active:translate-y-[1px] ${
          trackMode === "haruna"
            ? "bg-[#ff9f1c] text-[#1f2430] shadow-[0_3px_0_#c9700a]"
            : "text-white/70 hover:text-white"
        }`}
      >
        <span>⛰️</span>
        <span>MT. HARUNA</span>
        <span className={`rounded px-1 py-0.5 font-body text-[2cqw] font-black ${trackMode === "haruna" ? "bg-black/20 text-[#1f2430]" : "bg-white/10 text-white/60"}`}>GUNMA</span>
      </button>
      <button
        type="button"
        onClick={() => selectTrack("tokyo")}
        className={`pointer-events-auto flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 font-display text-[3.4cqw] leading-none transition-all active:translate-y-[1px] ${
          trackMode === "tokyo"
            ? "bg-[#2ec4b6] text-white shadow-[0_3px_0_#1f9a8f]"
            : "text-white/70 hover:text-white"
        }`}
      >
        <span>🏙️</span>
        <span>TOKYO CITY</span>
        <span className={`rounded px-1 py-0.5 font-body text-[2cqw] font-black ${trackMode === "tokyo" ? "bg-black/20 text-white" : "bg-white/10 text-white/60"}`}>SHIBUYA</span>
      </button>
    </div>
  );
}

/** Skate speed (NORMAL / 2× / 3×), world curve (SUBWAY / FLAT), board (CLASSIC / 🥖 BAGUETTE), and turning style. */
function SettingsRow() {
  const speed = useUI((s) => s.speedMode);
  const setSpeed = useUI((s) => s.setSpeedMode);
  const turn = useUI((s) => s.turnMode);
  const setTurn = useUI((s) => s.setTurnMode);
  const deck = useUI((s) => s.deckOverride);
  const setDeck = useUI((s) => s.setDeckOverride);
  const curve = useUI((s) => s.worldCurve);
  const setCurve = useUI((s) => s.setWorldCurve);
  const addPopup = useUI((s) => s.addPopup);

  const toggleDeck = () => {
    const next = deck === "baguette" ? "default" : "baguette";
    setDeck(next);
    engine.skinPop();
    if (next === "baguette") {
      sfx.unlock();
      addPopup("PAPAN ROTI BAGUETTE! 🥖", "#ff9f1c", "Free Baguette Skateboard");
    } else {
      sfx.click();
      addPopup("PAPAN STANDAR 🛹", "#2ec4b6", "Classic Pro Deck");
    }
  };

  const toggleCurve = () => {
    const next = curve === "subway" ? "flat" : "subway";
    setCurve(next);
    if (next === "subway") {
      sfx.unlock();
      addPopup("SUBWAY CURVE 🌍", "#4cc9f0", "World Curvature ON");
    } else {
      sfx.click();
      addPopup("FLAT WORLD 📏", "#a0aec0", "World Curvature OFF");
    }
  };

  return (
    <div className="flex w-full gap-1.5">
      <CyclePill label="SPEED" value={speed === 1 ? "NORMAL" : `${speed}×`} tone="orange" onTap={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 3 : 1)} />
      <CyclePill label="CURVE" value={curve === "subway" ? "SUBWAY 🌍" : "FLAT 📏"} tone="teal" onTap={toggleCurve} />
      <CyclePill label="BOARD" value={deck === "baguette" ? "🥖 ROTI" : "🛹 PRO"} tone={deck === "baguette" ? "orange" : "teal"} onTap={toggleDeck} />
      <CyclePill label="TURN" value={turn === "new" ? "STEER" : "SLIDE"} tone="orange" onTap={() => setTurn(turn === "new" ? "old" : "new")} />
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
      <div className="absolute left-[4%] top-[3.5%] flex h-10 items-center gap-1.5 rounded-full bg-black/25 px-3 backdrop-blur-[2px]">
        <BreadIcon size={22} />
        <span className="font-display txt-outline-sm text-[4.6cqw] leading-none text-white">{wallet}</span>
      </div>
      {best > 0 && (
        <div className="absolute left-1/2 top-[3.5%] flex h-10 -translate-x-1/2 items-center rounded-full bg-black/25 px-3 font-display text-[3.4cqw] leading-none text-[#ffd60a] txt-outline-sm backdrop-blur-[2px]">
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
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-display text-[4.4cqw] leading-none shadow-[0_3px_0_rgba(0,0,0,0.15)] ${
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
      <div className="absolute bottom-[3.5%] left-[7%] right-[7%] flex flex-col gap-1.5">
        <TrackModeRow />
        <SettingsRow />
        <div className="hidden rounded-xl bg-white/85 px-3 py-1 text-center font-body text-[2.6cqw] font-extrabold leading-snug text-[#1f2430]/80 [@media(min-height:700px)]:block">
          Swipe ↔ lanes · ↑ / tap = jump · S = next freestyle · SPRINT button (Shift) = kick faster, NOS when full
        </div>
        {isUnlocked ? (
          <button
            type="button"
            onClick={start}
            className="pointer-events-auto w-full rounded-2xl bg-[#2ec4b6] py-[3.2cqw] font-display text-[7cqw] leading-none text-white shadow-[0_6px_0_#1f9a8f] active:translate-y-[4px] active:shadow-[0_2px_0_#1f9a8f]"
          >
            START
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
