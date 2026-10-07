import { useUI } from "../game/store";
import { engine } from "../game/engine";
import { sfx } from "../game/audio";
import { BreadIcon } from "./BreadIcon";

const CAUSE_LABEL: Record<string, string> = {
  obstacle: "NUBRUK RINTANGAN",
  car: "KETABRAK MOBIL",
  oncoming: "MOBIL DARI ARAH DEPAN",
  motorcycle: "MOTOR DARI ARAH DEPAN",
  chicken: "AYAM NGEBUT",
  train: "KERETA LEWAT",
  gate: "PALANG TUTUP",
  pedestrian: "NUBRUK PEJALAN KAKI",
  roadwork: "AREA PROYEK",
  cross_traffic: "TABRAKAN DI PEREMPATAN",
};

/** A small, readable end-of-run card. Keep this screen focused on the result and the next action. */
export function GameOver() {
  const phase = useUI((s) => s.phase);
  const score = useUI((s) => s.score);
  const best = useUI((s) => s.best);
  const bread = useUI((s) => s.bread);
  const wallet = useUI((s) => s.wallet);
  const isNewBest = useUI((s) => s.isNewBest);
  const cause = useUI((s) => s.crashCause);

  if (phase !== "gameover") return null;

  const retry = () => {
    sfx.click();
    engine.input("tap");
  };

  const backToMenu = () => {
    sfx.click();
    engine.toMenu();
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex select-none items-center justify-center bg-[#151823]/55 px-[7%] backdrop-blur-[2px]">
      <div className="card-in pointer-events-auto w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white text-center shadow-[0_12px_0_rgba(0,0,0,0.25)]">
        {/* One clear title block — no extra illustration or noisy copy. */}
        <div className="bg-[#ef4b4b] px-5 pb-4 pt-5">
          <div className="font-display text-[8.5cqw] leading-none tracking-wide text-white">GAME OVER</div>
          <div className="mt-2 font-body text-[2.8cqw] font-extrabold tracking-[0.16em] text-white/80">
            {CAUSE_LABEL[cause] ?? "RUN SELESAI"}
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          {/* Result first: score and best are the only large numbers on the card. */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-[18px] bg-[#1f2430] px-2 py-3.5">
              <div className="font-body text-[2.7cqw] font-extrabold tracking-[0.18em] text-white/55">SCORE</div>
              <div className="mt-1 font-display text-[9.5cqw] leading-none text-[#ffd60a]">{score}</div>
            </div>
            <div className="rounded-[18px] bg-[#eef0f3] px-2 py-3.5">
              <div className="font-body text-[2.7cqw] font-extrabold tracking-[0.18em] text-[#1f2430]/50">BEST</div>
              <div className="mt-1 font-display text-[9.5cqw] leading-none text-[#1f2430]">{best}</div>
            </div>
          </div>

          {isNewBest && (
            <div className="mx-auto mt-3 w-fit rounded-full bg-[#ffd60a] px-3 py-1 font-display text-[3.1cqw] leading-none text-[#1f2430]">
              NEW BEST!
            </div>
          )}

          <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#fff4d6] px-3.5 py-2.5">
            <span className="font-body text-[2.8cqw] font-extrabold tracking-[0.16em] text-[#8a5a12]">REWARD</span>
            <span className="flex items-center gap-1.5 font-display text-[4.2cqw] leading-none text-[#8a5a12]">
              <BreadIcon size={20} />+{bread}
              <span className="font-body text-[2.5cqw] font-extrabold text-[#b08340]">· {wallet} TOTAL</span>
            </span>
          </div>

          <button
            type="button"
            onClick={retry}
            className="mt-4 w-full rounded-2xl bg-[#2ec4b6] py-3.5 font-display text-[5.5cqw] leading-none text-white shadow-[0_5px_0_#1f9a8f] transition-transform active:translate-y-[3px] active:shadow-[0_2px_0_#1f9a8f]"
          >
            RETRY
          </button>
          <button
            type="button"
            onClick={backToMenu}
            className="mt-2.5 w-full rounded-2xl bg-[#eef0f3] py-3 font-display text-[4.1cqw] leading-none text-[#1f2430] shadow-[0_4px_0_#cfd4db] transition-transform active:translate-y-[2px] active:shadow-[0_2px_0_#cfd4db]"
          >
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}
