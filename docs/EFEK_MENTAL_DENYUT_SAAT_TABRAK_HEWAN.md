# Efek "MENTAL + DENYUT" saat menabrak kucing & ayam

Permintaan: **"saya mau kucing dan ayam tu mental kalo saya tabrak kek kartun gitu
dan satisfying ada efek kek apa gitu denyut."**

Jadi begitu merpati menabrak kucing atau ayam, sekarang ada paket *juice* ala kartun:
freeze-frame sekejap, ledakan "POW!", gelombang **denyut** yang mengembang, kamera
nyentak, hewannya mental tinggi sambil muter-muter, dan bunyi *boing* tiap mantul.
Semua efek di bawah **hanya** untuk hewan (`cat` & `chicken`) — mobil, pejalan kaki,
train, dsb. tetap seperti semula.

## 1. Anatomi efek (urutan kejadian)

| # | Efek | Nilai | Kode |
|---|---|---|---|
| 1 | **HIT-STOP** — dunia hampir beku sesaat | 0.11 s pada skala waktu 0.14 | `HITSTOP_TIME`, `HITSTOP_SCALE` di `engine.ts`, diterapkan di awal `update()` |
| 2 | **Kilatan inti** (denyut pertama) | 0.18 s, radius 0.28 → 1.5, putih | `cartoonImpact()` → `spawnPulse("flash", …)` |
| 3 | **Cincin denyut** putih + warna hewan | 0.24 s (0.3 → 1.7) & 0.46 s (0.45 → 3.3) | `spawnPulse("ring", …)` |
| 4 | **Shockwave tanah** rebah di aspal | 0.56 s, radius 0.5 → 4.0 | `spawnPulse("ring", …, { flat: true })` |
| 5 | **Serpihan POW** menyebar radial | 16 partikel, putih/keemasan, muter cepat | partikel jenis baru `"pow"` |
| 6 | **Punch kamera** (denyut zoom + sentak) | `punch = 1`, luruh 3.4/detik; FOV −4.5°, kamera maju 0.5 m | `engine.punch` dipakai di `Scene.tsx` |
| 7 | **Guncangan layar** | minimal 1.15 | `engine.shake` |
| 8 | **Lontaran MENTAL** | lompat 5.2–7.3 m/s, putaran 10–17 rad/s, samping 2.2–3.8 m/s | `launchVictim()` (cabang hewan) |
| 9 | **Mantul kenyal** | gravitasi ×0.72, koefisien pantul ×1.45 (maks 0.78), gesekan 3.4 | `ANIMAL_GRAVITY_SCALE`, `ANIMAL_BOUNCE`, `Ragdoll.gravityScale/bouncy` |
| 10 | **Boing + debu** tiap mantul | boing di mantulan 1 & 2, lalu bonk | `updateMovers()` |
| 11 | **Popup denyut** | "CAT YEET! 🐱 MEOWWW! POW! 💥" berdenyut 3× selama 1.35 s | `.popup-punch` di `index.css`, `addPopup(..., punch)` |
| 12 | **Kilatan badan hewan** | emissive putih, berkedip 70 rad/s, luruh 0.34 s | `flashMat` di `World.tsx` (`MoverView`) |
| 13 | **SFX** | `sfx.thwack()` (POW) + `sfx.bonk()` + `sfx.meow()`/`sfx.squawk()` | `audio.ts` |

Perbandingan lontaran sebelum vs sesudah (kecepatan lari dasar `v`):

| | Sebelum | Sesudah |
|---|---|---|
| Maju (`vs`) | `v·0.38 + 0.6…1.4` | `v·0.62 + 1.6…3.2` |
| Naik (`vh`) | 2.2–2.8 m/s | **5.2–7.3 m/s** |
| Samping (`vlat`) | 1.1–1.9 m/s | **2.2–3.8 m/s** |
| Putaran (`wz`) | 3–5.5 rad/s | **10–17 rad/s** |
| Pantulan | koefisien standar (0.48/0.35/0.22) | **×1.45**, gravitasi ×0.72 |

Hasil ukur di harness: kucing melayang sampai **puncak 1.11 m** dan mantul **3×**;
ayam puncak **0.91 m**, mantul **3×**.

## 2. Di mana kodenya

| Bagian | File |
|---|---|
| Konstanta + `hitStop`/`punch` + `pulses` + `spawnPulse`/`updatePulses`/`cartoonImpact` | `src/game/engine.ts` |
| Fisika ragdoll kenyal (`gravityScale`, `bouncy`) | `src/game/engine.ts` (`stepRagdoll`) |
| Lontaran mental + FX per hewan | `src/game/engine.ts` (`launchVictim`, `hitCat`, `hitChicken`) |
| Boing/debu tiap mantul | `src/game/engine.ts` (`updateMovers`) |
| Partikel `pow` | `src/game/engine.ts` (`emitWorld`) |
| Cincin denyut (render) | `src/game/World.tsx` (`Pulses`, pool 6 ring + 6 kilatan, additive) |
| Kilatan badan hewan | `src/game/World.tsx` (`MoverView.flashMat`) |
| Punch kamera (posisi + FOV) | `src/game/Scene.tsx` (`CameraRig`) |
| Popup denyut | `src/game/store.ts`, `src/ui/HUD.tsx`, `src/index.css` (`.popup-punch`) |
| SFX `thwack` / `boing` | `src/game/audio.ts` |
| Cek otomatis | `test/animalSize.ts` (30 PASS) |

## 3. Retune cepat

Semua angka utama ada di blok `Tabrakan hewan ala kartun` di `engine.ts`:

```ts
export const HITSTOP_TIME = 0.11;   // lama freeze-frame
export const HITSTOP_SCALE = 0.14;  // skala waktu saat freeze
export const ANIMAL_BOUNCE = 1.45;  // kenyalnya mantulan
export const ANIMAL_GRAVITY_SCALE = 0.72; // < 1 = hang time makin lebay
```

Kalau mau lebih "lebay": naikkan `vh` (5.2) dan `wz` (10–17) di `launchVictim()`,
atau perbesar radius cincin di `cartoonImpact()`.

## 4. Verifikasi

```bash
npx esbuild test/animalSize.ts --bundle --platform=node --outfile=/tmp/animalSize.cjs && node /tmp/animalSize.cjs
```

Cek otomatis pada harness: hit-stop aktif, punch = 1, 3 cincin + 1 kilatan denyut,
≥10 serpihan POW, lontaran `vh ≥ 5` & spin `≥ 10`, puncak > 0.8 m, ≥3 mantulan,
lalu memastikan `hitStop`/`punch`/`pulses` kembali nol (efek tidak nyangkut).
