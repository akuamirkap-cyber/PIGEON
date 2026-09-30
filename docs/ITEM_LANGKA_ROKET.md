# Item LANGKA — Roket NOS dengan Cahaya Raylight

Permintaan: **"item langka, kayak roket buat NOS dengan cahaya raylight — barang
berharga buat diambil."** Jadi bukan cuma kaleng NOS biasa, tapi item jarang yang
kelihatan mahal/bersinar dan begitu diambil langsung ngasih NOS penuh + skor bonus.

## 1. Roket: bentuk & tampilan

`rocketParts()` di `src/game/models.ts` (19 part, model voxel seperti item lain):

| Bagian | Warna | Posisi |
|---|---|---|
| Badan roket | putih `#f4f6fa` | 0.30 x 0.46, y 0.62 |
| Cincin emas | `#d69a12` | y 0.46 |
| Sirip emas (4 arah) | `#ffc93c` | x/y ±0.19, bawah |
| Pita ungu "mahal" | `#7b3ff2` | badan atas |
| Jendela kokpit + kilap | `#65d6ff` | depan atas |
| Moncong merah bertingkat (0.30 → 0.07) | merah | y 0.90 / 0.99 / 1.06 |
| Ujung emas | `#ffc93c` | paling atas |
| Nosel + nyala + lidah api | `#2b2f38`, `#ff8c1a`, `#ffe066` | bawah |
| Badge bintang emas | `#ffc93c` | belakang (z -0.16) |

Total tinggi ~1.16 m — sebesar item, bukan gedung.

Di `src/game/World.tsx`, `Rockets()` menambah kesan "berharga":

- **cahaya raylight**: satu bidang sinar 3.1 x 3.1 (tekstur `getRayTexture()` dari
  `src/game/rays.ts`) yang selalu menghadap kamera (billboard), `AdditiveBlending`,
  berputar pelan (0.35 rad/s) dan berdenyut (opacity 0.72 ± 0.22);
- **piringan cahaya** di aspal: cincin emas `#ffc93c` (0.42–0.62) transparan;
- roket **mengambang naik-turun** (y ± 0.12) dan **berputar** 1.4 rad/s.

Saat roket diambil, `RareFlash()` menyalakan **kilatan sinar besar** di titik pickup:
raylight yang mengembang (2.2 → 7.7) sambil memudar, plus pilar cahaya vertikal —
selama `RARE_FLASH_T = 0.9` detik.

## 2. Kelangkaan & aturan spawn

Semua angka di `src/game/engine.ts`:

| Konstanta | Nilai | Arti |
|---|---|---|
| `ROCKET_FIRST_S` | 120 m | roket pertama muncul ~120 m setelah start |
| `ROCKET_GAP` | [200, 340] m | jarak antar-roket (jarang, rata-rata ~270 m) |
| `ROCKET_SCORE` | 500 | skor bonus sekali ambil |
| `NOS_MAX` | 100 | NOS yang diberikan roket (langsung penuh) |
| `RARE_FLASH_T` | 0.9 s | lama kilatan sinar |

Diukur di harness: **3,4 roket per km** (12 roket dalam 3,5 km) — masih terasa
spesial, bukan item yang tiap saat lewat.

Aturan keamanan spawn (biar **selalu bisa diambil** saat kelihatan):

- roket dicari di **jalur yang bebas** lewat `clearLaneNear(s)`; urutan percobaan
  jalur **1 (tengah) → 0 → 2**, karena jalur tengah paling gampang disambar;
- sebuah jalur dianggap terpakai kalau ada: rintangan (selain ramp/rail) dalam 6 m,
  kendaraan/mover (selain pejalan kaki) dalam 12 m, `crossCars` dalam 8 m, atau zona
  `reserved` yang tumpang tindih ±2 m;
- kalau **semua jalur bahaya**, roket **ditunda** (`nextRocketS = x + 12`) — bukan
  dipaksa muncul di dalam rintangan;
- **tidak muncul** dalam 14 m dari rel kereta (`crossings`) atau 16 m dari
  perempatan (`intersections`), karena dua tempat itu ramai lalu lintas lintas;
- kalau aman: `nextRocketS = x + rand(200, 340)`.

## 3. Efek saat diambil

Syarat ambil (dua-duanya dicek di `update()`): `|s − distance| ≤ 1.0`,
`|LANE_LAT[lane] − player.lat| ≤ 1.05`, dan `player.h ≤ 1.7` (jadi roket di jalur
sebelah atau saat melompat tinggi **tidak** ikut terambil).

`collectRocket()` lalu:

- `trickScore += 500`;
- `addNos(NOS_MAX)` → **NOS langsung penuh**;
- `rareFlash = 0.9` + posisinya → kilatan raylight di dunia;
- `punch = 0.22` (hentakan kamera halus, bukan shake kasar);
- cincin emas `spawnPulse(max 0.55, r0 0.6 → r1 4.2)`, 14 partikel `pow` + 18 `spark`;
- popup UI: **"ROCKET LANGKA!"** dengan sub-teks **"NOS LANGSUNG PENUH"**;
- `sfx.rare()` — nada segitiga 523/784/1046 Hz + sinus 1568 Hz + "sizzle" 0.5 s.

Perawatan: `rareFlash` mereda `dt` per frame (habis dalam 0.9 s) dan
`rocketTaken` di-reset tiap `startRun()`. Roket yang sudah lewat >16 m dibuang dari
daftar (`listVersion++` supaya view ikut bersih).

## 4. Cara verifikasi

```bash
./node_modules/.bin/tsc --noEmit
npx esbuild test/rare.ts --bundle --platform=node --outfile=/tmp/rare.cjs && node /tmp/rare.cjs
npx esbuild test/traffic.ts --bundle --platform=node --outfile=/tmp/traffic.cjs && node /tmp/traffic.cjs
npm run build
```

`test/rare.ts` = **33 cek**: model (5), kelangkaan per km (5), keadilan jalur &
rel/perempatan (8), efek ambil (11), hemat memori (2). Harness lain yang harus tetap
hijau: `test/animalSize.ts` (32), `test/newFeatures.ts` (36), `test/characters.ts` (82),
`test/traffic.ts` (32).

Catatan buat yang mau ubah-ubah: jangan panggil `spawnGroup()` manual dengan
`nextObstacleS` raksasa (mis. `1e9`) di harness — cabang roadwork-nya bikin loop berat
dan Node kehabisan memori. Pakai `nextObstacleS = distance + 26` seperti di
`test/rare.ts`, atau `quiet()` (1e9) kalau memang tidak mau spawn sama sekali.
