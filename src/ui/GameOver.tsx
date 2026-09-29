import { useUI } from "../game/store";
import { engine } from "../game/engine";
import { sfx } from "../game/audio";
import { BreadIcon } from "./BreadIcon";

const QUIPS: Record<string, string[]> = {
  obstacle: ["COO-RASH!", "WIPEOUT!", "FEATHERS EVERYWHERE!", "BAILED!", "OUCH, BIRDIE!"],
  car: ["FENDER BENDER!", "PARKED. PERMANENTLY.", "COO-RASH!"],
  oncoming: ["HEAD-ON!", "WRONG WAY, BIRDIE!", "BEEP BEEP... SPLAT"],
  chicken: ["FOWL PLAY!", "CHICKEN'D!", "WHY DID THE CHICKEN...?"],
  train: ["TRAIN'D!", "MIND THE GAP!", "KAN KAN KAN... SPLAT"],
  gate: ["BARRIER BONK!", "GATE CRASHER!", "STOP MEANS STOP!"],
  pedestrian: ["EXCUSE ME!", "SIDEWALK ETIQUETTE!", "OOPS, SORRY MA'AM!"],
  roadwork: ["UNDER CONSTRUCTION!", "HARD HAT ZONE!", "DETOUR, BIRDIE!"],
  cross_traffic: ["T-BONED DI PEREMPATAN!", "LOMPAT SISI DEPAN AJA!", "WATCH CROSS TRAFFIC!", "HOOD JUMP MISSED!"],
};

export function GameOver() {
  const phase = useUI((s) => s.phase);
  const score = useUI((s) => s.score);
  const best = useUI((s) => s.best);
  const bread = useUI((s) => s.bread);
  const wallet = useUI((s) => s.wallet);
  const isNewBest = useUI((s) => s.isNewBest);
  const runs = useUI((s) => s.runs);
  const cause = useUI((s) => s.crashCause);
  if (phase !== "gameover") return null;
  const list = QUIPS[cause] ?? QUIPS.obstacle;
  const quip = list[runs % list.length];

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex select-none items-center justify-center bg-black/25">
      <div className="card-in w-[80%] rounded-[28px] bg-white px-5 pb-5 pt-6 text-center shadow-[0_10px_0_rgba(0,0,0,0.25)]">
        <div className="font-display text-[8cqw] leading-none text-[#ef4b4b]">{quip}</div>
        <div className="mt-4 font-body text-[3.2cqw] font-extrabold tracking-[0.3em] text-[#9aa1ad]">SCORE</div>
        <div className="font-display text-[14cqw] leading-none text-[#1f2430]">{score}</div>
        {isNewBest ? (
          <div className="mx-auto mt-2 inline-block rotate-[-3deg] rounded-full bg-[#ffd60a] px-3 py-1 font-display text-[3.8cqw] text-[#1f2430]">NEW BEST!</div>
        ) : (
          <div className="mt-2 font-body text-[3.6cqw] font-extrabold text-[#6b7280]">BEST {best}</div>
        )}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#fff4d6] py-2 font-display text-[4.6cqw] text-[#8a5a12]">
          <BreadIcon size={24} />
          <span>+{bread}</span>
          <span className="font-body text-[3cqw] font-extrabold text-[#b08340]">→ wallet {wallet}</span>
        </div>
        <button
          type="button"
          onClick={() => engine.input("tap")}
          className="pointer-events-auto mt-5 w-full rounded-2xl bg-[#2ec4b6] py-3.5 font-display text-[5.5cqw] text-white shadow-[0_5px_0_#1f9a8f] active:translate-y-[3px] active:shadow-[0_2px_0_#1f9a8f]"
        >
          TAP TO RETRY
        </button>
        <button
          type="button"
          onClick={() => {
            sfx.click();
            engine.toMenu();
          }}
          className="pointer-events-auto mt-2.5 w-full rounded-2xl bg-[#eef0f3] py-3 font-display text-[4.2cqw] text-[#1f2430] shadow-[0_4px_0_#cfd4db] active:translate-y-[2px] active:shadow-[0_2px_0_#cfd4db]"
        >
          MENU · SKINS
        </button>
      </div>
    </div>
  );
}
