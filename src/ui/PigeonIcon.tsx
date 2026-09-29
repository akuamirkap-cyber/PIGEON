import type { Skin } from "../game/skins";

function Hat({ k }: { k: Skin }) {
  const c = k.hatColor ?? "#e63946";
  const c2 = k.hatColor2 ?? "#ffffff";
  switch (k.hat) {
    case "cap":
      return (
        <>
          <rect x="34" y="1" width="22" height="6" rx="1" fill={c} />
          <rect x="26" y="5" width="10" height="3" fill={c} />
          <rect x="44" y="-1" width="3" height="3" fill="#ffffff" />
        </>
      );
    case "mailcap":
      return (
        <>
          <rect x="34" y="0" width="22" height="6" rx="1" fill={c} />
          <rect x="34" y="4" width="22" height="2" fill={c2} />
          <rect x="48" y="4.5" width="9" height="2" fill="#111111" />
          <rect x="45" y="1" width="3" height="3" fill={c2} />
        </>
      );
    case "harajuku":
      return (
        <>
          <rect x="34" y="-1" width="22" height="8" rx="2" fill={c} />
          <rect x="34" y="5" width="22" height="2.5" fill="#111111" />
          <rect x="49" y="5" width="5" height="2.5" fill="#2dd4bf" />
          {/* Sunglasses */}
          <rect x="43" y="10" width="13" height="6" rx="1" fill="#111111" />
          <rect x="44" y="11" width="5" height="4" fill="#1f2430" />
          <rect x="50" y="11" width="5" height="4" fill="#1f2430" />
          <line x1="45" y1="12" x2="47" y2="14" stroke="#ffffff" strokeWidth="0.8" />
          <line x1="51" y1="12" x2="53" y2="14" stroke="#ffffff" strokeWidth="0.8" />
        </>
      );
    case "beret":
      return (
        <>
          <ellipse cx="44" cy="4" rx="13" ry="5" fill={c} />
          <rect x="43" y="-1" width="2" height="3" fill={c} />
        </>
      );
    case "crown":
      return (
        <>
          <rect x="38" y="0" width="14" height="6" fill={c} />
          <rect x="38" y="-5" width="3" height="6" fill={c} />
          <rect x="43.5" y="-6" width="3" height="7" fill={c} />
          <rect x="49" y="-5" width="3" height="6" fill={c} />
          <rect x="44" y="2" width="2.5" height="2.5" fill={c2} />
        </>
      );
    case "mohawk":
      return (
        <>
          {[7, 10, 12, 10, 7].map((h, i) => (
            <rect key={i} x={37 + i * 3.5} y={6 - h} width="3" height={h} fill={c} />
          ))}
        </>
      );
    case "headband":
      return (
        <>
          <rect x="34" y="9" width="22" height="3.5" fill={c} />
          <rect x="27" y="9" width="7" height="2" fill={c} />
          <rect x="28" y="12" width="6" height="2" fill={c} />
        </>
      );
    case "beanie":
      return (
        <>
          <rect x="34" y="0" width="22" height="7" rx="2" fill={c} />
          <rect x="34" y="5" width="22" height="2.5" fill={c2} />
          <rect x="42" y="-5" width="6" height="6" rx="2" fill={c2} />
        </>
      );
    case "visor":
      return (
        <>
          <rect x="43" y="9" width="13" height="5" fill="#1a1d24" />
          <rect x="44" y="11" width="11" height="1.2" fill={c} />
        </>
      );
    case "tophat":
      return (
        <>
          <rect x="39" y="-9" width="12" height="15" fill="#1a1d24" />
          <rect x="35" y="5" width="20" height="3" fill="#1a1d24" />
          <rect x="39" y="2" width="12" height="2.5" fill={c} />
        </>
      );
    default:
      return null;
  }
}

/** Pixel-art side view of a skin, used in menus. */
export function PigeonIcon({ skin: k, size = 64, locked = false }: { skin: Skin; size?: number; locked?: boolean }) {
  const isBaguette = k.deckType === "baguette";

  return (
    <svg viewBox="0 -10 64 76" width={size} height={size} style={locked ? { filter: "grayscale(0.9) brightness(0.75)" } : undefined} aria-hidden="true">
      {/* Skateboard Deck */}
      {isBaguette ? (
        <>
          {/* French Baguette Board */}
          <rect x="4" y="53" width="56" height="6.5" rx="3.2" fill="#c68038" />
          <rect x="8" y="54.5" width="48" height="3" rx="1.5" fill="#d99042" />
          {/* Bread score slashes */}
          <line x1="14" y1="54" x2="18" y2="58" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="22" y1="54" x2="26" y2="58" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="30" y1="54" x2="34" y2="58" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="38" y1="54" x2="42" y2="58" stroke="#ffffff" strokeWidth="1.2" />
          <line x1="46" y1="54" x2="50" y2="58" stroke="#ffffff" strokeWidth="1.2" />
          {/* Butter wheels */}
          <rect x="14" y="59.5" width="8" height="5" rx="1" fill="#ffe066" />
          <rect x="42" y="59.5" width="8" height="5" rx="1" fill="#ffe066" />
        </>
      ) : (
        <>
          <rect x="6" y="54" width="52" height="5" rx="2" fill={k.deck} />
          <rect x="8" y="53" width="48" height="1.5" fill="#2b2b2b" />
          <rect x="14" y="59" width="8" height="5" rx="1" fill={k.wheels} />
          <rect x="42" y="59" width="8" height="5" rx="1" fill={k.wheels} />
        </>
      )}

      {/* Pigeon Feet */}
      <rect x="27" y="46" width="3" height="8" fill={k.feet} />
      <rect x="35" y="46" width="3" height="8" fill={k.feet} />
      <rect x="25" y="52" width="7" height="2.5" fill={k.feet} />
      <rect x="33" y="52" width="7" height="2.5" fill={k.feet} />

      {/* Pigeon Body & Tail */}
      <rect x="4" y="30" width="12" height="6" fill={k.tail} />
      <rect x="2" y="31" width="4" height="6" fill={k.tailTip} />
      <rect x="14" y="26" width="34" height="21" rx="3" fill={k.body} />
      <rect x="36" y="30" width="12" height="16" rx="3" fill={k.belly} />

      {/* Body Accessories */}
      {k.accessory === "mailbag" && (
        <>
          {/* Tas surat selempang kulit cokelat + surat */}
          <line x1="40" y1="26" x2="22" y2="44" stroke="#592f13" strokeWidth="2.5" />
          <rect x="18" y="35" width="13" height="10" rx="1.5" fill="#874d26" />
          <rect x="18" y="35" width="13" height="4" rx="1" fill="#6a3917" />
          <rect x="23" y="37" width="3" height="3" fill="#ffd60a" />
          {/* Surat putih mengintip */}
          <rect x="22" y="32" width="6" height="5" rx="0.5" fill="#ffffff" />
          <rect x="26" y="32.5" width="1.8" height="1.8" fill="#e63946" />
        </>
      )}

      {k.accessory === "hoodie" && (
        <>
          {/* Kangaroo Pocket */}
          <rect x="34" y="36" width="13" height="8" rx="2" fill={k.hatColor ?? "#8b5cf6"} />
          <rect x="37" y="39" width="7" height="1" fill="#ffffff" />
          {/* White drawstrings */}
          <line x1="39" y1="28" x2="39" y2="34" stroke="#ffffff" strokeWidth="1" />
          <line x1="42" y1="28" x2="42" y2="34" stroke="#ffffff" strokeWidth="1" />
        </>
      )}

      {/* Wings */}
      <rect x="16" y="30" width="20" height="10" rx="2" fill={k.wing} />
      <rect x="12" y="35" width="10" height="4" fill={k.wingTip} />

      {/* Neck & Head */}
      <rect x="38" y="19" width="10" height="8" fill={k.neck2} />
      <rect x="43" y="19" width="5" height="8" fill={k.neck1} />
      <rect x="36" y="6" width="18" height="16" rx="3" fill={k.head} />
      <rect x="45" y="10" width="5" height="5" fill="#ffffff" />
      <rect x="47" y="11" width="3" height="3" fill="#111111" />
      <rect x="54" y="13" width="7" height="4" fill={k.beak} />
      <rect x="53" y="11" width="4" height="2.5" fill={k.cere} />
      <Hat k={k} />
    </svg>
  );
}
