import { useUI } from "../game/store";
import { BreadIcon } from "./BreadIcon";
import { engine } from "../game/engine";
import { TRICKS } from "../game/tricks";
import { unlockAudio } from "../game/audio";

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      {muted ? (
        <>
          <path d="M18 9l4 6" />
          <path d="M22 9l-4 6" />
        </>
      ) : (
        <>
          <path d="M16.5 8.5a5 5 0 010 7" />
          <path d="M19 6a8.5 8.5 0 010 12" />
        </>
      )}
    </svg>
  );
}

export function HUD() {
  const phase = useUI((s) => s.phase);
  const score = useUI((s) => s.score);
  const bread = useUI((s) => s.bread);
  const dist = useUI((s) => s.dist);
  const popups = useUI((s) => s.popups);
  const muted = useUI((s) => s.muted);
  const toggleMute = useUI((s) => s.toggleMute);
  const nos = useUI((s) => s.nos);
  const nosActive = useUI((s) => s.nosActive);
  const cycleIndex = useUI((s) => s.cycleIndex);
  const tricksOn = useUI((s) => s.tricksOn);
  const speedMode = useUI((s) => s.speedMode);
  const trackMode = useUI((s) => s.trackMode);
  const inRun = phase === "playing" || phase === "crashed";
  const enabled = TRICKS.filter((t) => tricksOn[t.kind]);
  const nextTrick = enabled.length ? enabled[cycleIndex % enabled.length] : null;
  const nosReady = nos >= 100 && !nosActive;
  const sprint = useUI((s) => s.sprint);
  const sprintLevel = useUI((s) => s.sprintLevel);
  const sprinting = sprint > 0.02 || sprintLevel > 0;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 select-none">
      {/* score */}
      {inRun && (
        <div className="absolute left-0 right-0 top-[3.5%] flex flex-col items-center gap-1">
          <div className="font-display txt-outline text-[11cqw] leading-none text-white">{score}</div>
          <div className="rounded-full bg-black/25 px-2.5 py-0.5 font-display text-[3.2cqw] leading-none text-white txt-outline-sm backdrop-blur-[2px]">{dist} m</div>
        </div>
      )}
      {/* bread counter */}
      {inRun && (
        <div className="absolute left-[4%] top-[3.5%] flex h-10 items-center gap-1.5 rounded-full bg-black/25 px-3 backdrop-blur-[2px]">
          <BreadIcon size={22} />
          <span className="font-display text-[4.6cqw] leading-none text-white txt-outline-sm">{bread}</span>
        </div>
      )}
      {/* mute */}
      <button
        type="button"
        onClick={toggleMute}
        className="pointer-events-auto absolute right-[4%] top-[3.5%] flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-[2px] active:scale-95"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        <SpeakerIcon muted={muted} />
      </button>
      {/* speed mode badge */}
      {inRun && speedMode > 1 && (
        <div className="absolute right-[4%] top-[10.5%] rounded-full bg-[#ff9f1c] px-2.5 py-1 font-display text-[3.2cqw] leading-none text-[#1f2430] shadow-[0_3px_0_#c9700a]">{speedMode}× SKATE</div>
      )}
      {/* track mode badge */}
      {inRun && (
        <div className="absolute left-[4%] top-[10.5%] rounded-full bg-black/35 px-2.5 py-1 font-display text-[2.8cqw] leading-none text-white/90 backdrop-blur-[2px]">
          {trackMode === "haruna" ? "⛰️ MT. HARUNA TOUGE" : trackMode === "shibuya" ? "🌃 SHIBUYA NIGHT" : "🏙️ TOKYO CITY"}
        </div>
      )}

      {/* NOS meter + button (right side, thumb reach) */}
      {phase === "playing" && (
        <div className="absolute bottom-[5%] right-[4%] flex flex-col items-center gap-2">
          <div className="relative h-[26cqw] w-[6cqw] overflow-hidden rounded-full bg-black/30 ring-2 ring-white/40 backdrop-blur-[2px]">
            <div
              className={`absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-150 ${nosActive ? "nos-burn" : nosReady ? "nos-ready" : "bg-[#4cc9f0]"}`}
              style={{ height: `${nosActive ? 100 : nos}%` }}
            />
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              unlockAudio();
              engine.input("boost"); // Sprint kicks (+40, +50, +70)
            }}
            className={`pointer-events-auto flex h-[15cqw] w-[15cqw] flex-col items-center justify-center rounded-full font-display leading-none shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-[2px] active:shadow-none transition-all duration-150 ${
              nosReady
                ? "nos-ready text-[#1f2430]"
                : nosActive
                  ? "nos-burn text-white"
                  : sprintLevel >= 3
                    ? "bg-[#ff9f1c] text-white ring-4 ring-[#ffe066]"
                    : sprintLevel === 2
                      ? "bg-[#3a86ff] text-white ring-3 ring-[#a0c4ff]"
                      : sprintLevel === 1
                        ? "bg-[#2ec4b6] text-white ring-2 ring-[#cbf3f0]"
                        : "bg-black/35 text-white/90 ring-2 ring-white/40"
            }`}
            style={
              sprinting && !nosActive
                ? {
                    boxShadow: `0 0 ${Math.round(8 + sprint * 18)}px ${
                      sprintLevel >= 3 ? "rgba(255,159,28,0.7)" : sprintLevel === 2 ? "rgba(58,134,255,0.7)" : "rgba(46,196,182,0.7)"
                    }, 0 4px 0 rgba(0,0,0,0.25)`,
                  }
                : undefined
            }
            aria-label={nosReady || nosActive ? "Activate NOS" : "Sprint kick (+40, +50, +70)"}
          >
            {nosReady || nosActive ? (
              <span className="text-[4.2cqw]">NOS</span>
            ) : sprintLevel > 0 ? (
              <>
                <span className="text-[3.8cqw] font-black tracking-tight drop-shadow-md">
                  {sprintLevel === 1 ? "+40" : sprintLevel === 2 ? "+50" : sprintLevel === 3 ? "+70" : `+${Math.min(110, 70 + (sprintLevel - 3) * 15)}`}
                </span>
                <span className="mt-[0.4cqw] text-[1.9cqw] font-extrabold uppercase tracking-wider text-white/90">SPRINT</span>
              </>
            ) : (
              <>
                <span className="text-[3.2cqw]">SPRINT</span>
                <span className="mt-[0.6cqw] hidden font-body text-[1.9cqw] font-extrabold tracking-wider opacity-80 [@media(hover:hover)]:block">SHIFT</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* S = sequential freestyle button (left side) */}
      {phase === "playing" && nextTrick && (
        <div className="absolute bottom-[5%] left-[4%] flex flex-col items-center gap-1.5">
          <div className="max-w-[34cqw] truncate rounded-full bg-black/30 px-2.5 py-1 font-body text-[2.6cqw] font-extrabold text-white backdrop-blur-[2px]">
            next: {nextTrick.short}
          </div>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
              unlockAudio();
              engine.input("cycle");
            }}
            className="pointer-events-auto flex h-[15cqw] w-[15cqw] items-center justify-center rounded-full bg-[#c77dff] font-display text-[7cqw] leading-none text-white shadow-[0_4px_0_#8f4fcf] active:translate-y-[2px] active:shadow-none"
            aria-label="Next freestyle trick"
          >
            S
          </button>
        </div>
      )}

      {/* trick popups */}
      <div className="absolute left-0 right-0 top-[19%] flex flex-col items-center gap-1">
        {popups.map((p) => (
          <div key={p.id} className="popup flex flex-col items-center">
            <div className="font-display txt-outline text-[8cqw] leading-none" style={{ color: p.color }}>
              {p.text}
            </div>
            {p.sub && <div className="font-display txt-outline-sm mt-1 text-[4.5cqw] leading-none text-white">{p.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
