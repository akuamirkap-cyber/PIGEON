# Dunia Rapi — Gedung Tidak Nembus, Pejalan Kaki Jelas, Jalur Seberang Hidup

Permintaan: **gedung jangan rapet/nembus, ada toko & warung ramen, kaki pejalan kaki
benar, pejalan kaki tidak nembus vending machine/tiang, perempatan Shibuya lebih rapi,
pejalan kaki tidak mbolak-mbalik, tidak ada obstacle dekat roti yang berjejer maupun
di belakang bonus item, dan jalur kanan (3 jalur) jangan sepi — mobilnya harus jalan.**

Semua perubahan ada di `src/game/engine.ts`, `src/game/models.ts`, `src/game/World.tsx`.
Cek otomatisnya di `test/streetscape.ts` (33 cek, semua lolos).

---

## 1. Gedung tidak saling menembus dan tidak menempel rapat

**Masalahnya:** model toko/rumah lebarnya 5.4–6.2 m, tapi jarak antar kaveling hanya 6 m.
Dulu tidak ada yang mencatat kaveling mana yang sudah terisi, jadi dua gedung bisa
ditaruh tumpang tindih.

**Solusinya — kaveling dicatat dan diukur sungguhan** (`fitLot`):

- `decorBodyBox(kind, variant, spec, hMax)` (baru di `models.ts`) mengukur kotak voxel
  sebuah model sampai ketinggian `hMax`. Dipakai dua kali: dengan `hMax = 1.35 m` untuk
  tahu "benda ini setinggi badan atau bukan", dan dengan `hMax = 1e6` untuk tahu
  setengah lebar kaveling.
- `Engine.builtLots` menyimpan `{ key, from, to }` tiap kaveling yang sudah terisi.
  `key = lotKey(lat)` = garis depan yang sama, jadi gedung di baris berbeda tidak
  saling mengunci.
- Lebar yang tersedia:
  `avail = min(s - (left + gap), right - gap - s, LOT_HALF_PITCH - gap/2)`.
  Suku ketiga penting: kaveling dipasang tiap 6 m (lx 3 & 9, lalu 3 lagi di chunk
  berikutnya). Tanpa batas ini kaveling pertama "memakan" jatah tetangganya dan
  kaveling kedua selalu ditolak — jalan jadi bolong-bolong.
- Urutan penyelamatan kalau model kebesaran:
  1. `building` parametrik dipersempit dulu (`w ≥ 3.4`, jumlah kolom ikut dihitung ulang);
  2. model lain disemprot di sumbu X sampai `MIN_LOT_SCALE = 0.75`;
  3. masih tidak muat → kaveling **dikosongkan**. Gedung tidak pernah dipaksa menempel.
- Hasil `fitLot` disimpan ke `Decor.scaleX` (dipakai `DecorView` sebagai
  `scale={[sx, 1, 1]}`) dan `Decor.halfS` (lebar yang benar-benar terpakai).

| Konstanta | Sebelum | Sesudah |
|---|---|---|
| `BUILDING_GAP_STREET` | 1.6 | **0.5** |
| `BUILDING_GAP_SHIBUYA` | 0.6 | **0.5** |
| `MIN_LOT_SCALE` | — | **0.75** |
| `LOT_HALF_PITCH` | — | **3.0** |

Hasil ukur: **0 gedung tumpang tindih**, celah minimum 0.5 m, 68 kaveling (Shibuya) dan
25 kaveling (Tokyo) diperiksa.

## 2. Toko dan warung ramen lebih banyak

Model `shopParts` (baru, 66 voxel, etalase + kanopi + papan nama) didaftarkan sebagai
`DecorKind "shop"` dan ikut diundi di semua baris bangunan:

- jalan kota: `< 0.40` shop, `< 0.86` ramen (sebelumnya ramen hanya `< 0.84` dari undian
  yang lebih sempit, shop tidak ada sama sekali);
- deret depan & belakang Tokyo: shop + ramen ditambahkan ke undian;
- Shibuya: `towerLot` sekarang 50% menara / 16% **shop** / 14% konbini / 20% ramen.

Hasil ukur 3000 m: Shibuya **toko 7, ramen 7**; Tokyo **toko 6, ramen 4**.

## 3. Kaki pejalan kaki berayun di sumbu yang benar

Pivot pinggul pejalan kaki ada di `z = ±0.11`, jadi kaki harus berayun di **sumbu Z
lokal**, bukan X. Yang salah sebelumnya:

```ts
leg.rotation.set(swing, 0, 0);   // salah: badan malah berayun ke samping
leg.rotation.set(0, 0, swing);   // benar: kaki mengayun maju-mundur
```

Badan condong ke depan tetap `rotation.z`. Blok ragdoll tidak diubah.

## 4. Pejalan kaki tidak menembus vending machine / tiang

Dua lapis:

- **Koridor trotoar** (`PED_CORRIDOR_NEAR [-6.6, -5.2]`, `PED_CORRIDOR_FAR [13.9, 15.4]`,
  padding 0.12). Setiap dekorasi diukur dengan `decorBodyBox(..., 1.35)` — hanya benda
  setinggi badan yang dihitung, jadi kanopi dan dahan pohon tidak ikut menggeser.
  `outOfPedCorridor()` lalu mendorong `lat`-nya keluar: properti sisi jalan didorong ke
  arah jalan, properti sisi gedung didorong menjauh.
- **Pejalan kaki tidak pernah balik arah.** Daur ulang `PedestrianMover` dan
  `AmbientWalker` sekarang mempertahankan `dir` dan `side`, dan kerumunan Shibuya
  (`CROWD_N = 24`) memakai sub-lajur (`crowdLat`) supaya tidak saling bertukar tempat
  di lajur yang sama. Penyeberang mulai dari `PED_CURB_LAT = 4.4` dan dibuang di
  `|lat| > 7.2`.

## 5. Perempatan Shibuya dirapikan

`scrambleRoadParts` ditulis ulang (289 voxel, 6936 vertex, x −7.56…7.56, z −30.00…30.10):
slab perempatan x∈[−6.7, 6.7] z∈[−4.0, 12.3] dengan bibir kerb, median diaspal sampai
0.19, 22 bar avenue + 10 bar penyeberangan dengan pitch seragam (`BAR 0.42`, `PITCH 0.8`),
dua diagonal dari 220 segmen dengan `ry = atan2(-uz, ux) = −1.007` sehingga garisnya
sejajar arah orang berjalan, ubin taktil kuning di ujung tiap zebra, dan garis henti di
x = ∓7.35.

`ScrambleWalker` mengikuti diagonal yang benar-benar tergambar
(`z0 = 5.35`, `z1 = 11.85`, vektor satuan `(9.8, 15.5)/18.34`, geser ±1.35).

Barisan depan gedung juga digeser mundur supaya tidak menutupi zebra: menara −8.05 →
**−9.3**, `tower109` −12.6 → **−14.6**, baris kedua −13.5 → **−15.2**, billboard −7.6 →
**−8.3**, pohon trotoar digeser keluar koridor.

## 6. Roti berjejer dan bonus item tidak tertutup obstacle

- `isNearBread(s, lane, extraBuffer = 5, sideBuffer = 2.2)` — jalur yang sama dicek
  dengan buffer penuh, **jalur sebelah** ikut dicek dengan buffer kecil. Deretan roti
  yang berjejer bisa tertutup obstacle di samping/belakangnya, jadi obstacle seperti itu
  tidak boleh muncul di sana. `addObstacle` memakai `hLen + 6.5` dan `sideBuffer 2.4`.
- `addBread` memakai `isNearObstacle(..., 6.5)` supaya roti tidak muncul menempel rintangan.
- `clearLaneNear` (tempat item langka) dirombak: `CLEAR_S = 9.0` bebas obstacle **sejalur**
  (non ramp/rail) *dan* roti sejalur, 16 m bebas kendaraan sejalur, 10 m bebas crossCars,
  12 m bebas roket lain, 10 m bebas `reserved`. Setelah roket ditaruh,
  `nextObstacleS = max(nextObstacleS, x + 14)` lalu `return`.

> Catatan penting: "bersih" di sini **sejalur saja**. Versi pertama mengecek semua jalur
> dan hampir tidak ada posisi yang lolos — item langka jadi hilang dan `test/rare.ts`
> merah. Obstacle di jalur sebelah itu gameplay normal, bukan penghalang.

Hasil ukur: 3946 frame item diperiksa, **0 pelanggaran**.

## 7. Jalur seberang (3 lajur) ramai dan benar-benar jalan

Dulu mobil di jalur seberang ditaruh sebagai dekorasi statis `jam_car`: diam, sejalur,
dan sering bertumpuk. Sekarang jadi entitas sendiri (`Engine.jamCars`, `JamCarView`).

- Lajur `JAM_LANE_LAT [6.15, 8.65, 11.15]`, spawn sampai `JAM_AHEAD = 210` m di depan,
  jarak antar bumper `9.5–16.5` m, varian 0–4 (varian 4 = bus).
- **Hukum mengikuti (bagian yang paling menjebak).** Mobil berjalan ke arah **−s**, jadi
  titik henti terdekat di depannya adalah yang punya `s` **terbesar** di bawah `c.s`.
  `limit` di-seed `-Infinity` lalu digabung dengan `Math.max`, dan jarak aman dihitung
  `follow = leader.s + jamHalfLen(c) + jamHalfLen(leader) + 1.4`. Tanda yang salah
  (`leader.s - room` dengan `Math.min`) baru mengerem setelah kedua mobil tumpang tindih
  ~3.5 m. Rem: `vMax = max(0, (c.s − limit) * 1.7)`.
- Gelombang merayap: `0.55 + 0.45 * sin(time * 0.42 + phase)` — macet kota yang bergerak.
- `addIntersection` membuang mobil yang kebetulan berdiri di dalam kotak perempatan
  (`s ∈ [it.s − 7.5, it.s + 12.5]`) supaya tidak ada yang menembus zebra yang baru dibuat.

Hasil ukur: 44–46 mobil, ketiga lajur terisi, ±43/44 bergerak, kecepatan rata-rata
2.6–3.4 m/s, semuanya ke arah −s, **jarak bumper terburuk +1.40 m** (sebelumnya −5.90 m),
0 mobil masuk kotak perempatan.

---

## Cara mengecek

```bash
npx esbuild test/streetscape.ts --bundle --platform=node --outfile=/tmp/sc.cjs --log-level=error
node /tmp/sc.cjs        # 33 cek: kaveling, koridor, zebra, jam, roti/bonus, sumber geometri
npm run lint            # tsc --noEmit, 0 error
npm run build           # dist/index.html 1.51 MB (gzip 421 kB)
```

Suite lama tetap hijau: `traffic` 32/0, `rare` 53/0, `newFeatures` 36/0, `characters` 82/0,
`animalSize` 32/0. (`test/geo.ts` dan `test/sim.ts` sudah rusak sejak sebelum perubahan ini —
`groundParts` tidak pernah ada di `models.ts` dan `engine.sprintT` undefined.)

Tampilan 3D-nya sendiri tidak bisa diverifikasi di lingkungan tanpa GPU; yang diukur di
atas semuanya geometri dan simulasi di Node.
