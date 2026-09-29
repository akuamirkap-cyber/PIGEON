# Pengendara Motor & Karakter Baru (Kucing Oren, Flamingo, Gagak)

Dokumen ini mencatat dua perubahan besar di `85e7329` → `ebace71` → (commit berikutnya):

1. **Bentuk pengendara motor dari arah depan + helmnya diperbaiki** (dulu cuma tumpukan kotak, tangan mengambang di atas setang).
2. **Karakter selain merpati**: Kucing Oren berdiri, Flamingo, dan Gagak — semua bisa dimainkan.

## 1. Pengendara motor (`src/game/models.ts` → `motorcycleParts`)

Model motor sekarang 52 part dan dibangun dengan anatomi yang benar:

| Bagian | Detail |
| --- | --- |
| Pinggul | Duduk **tepat di atas jok** (bawah pinggul = atas jok = 0.69) |
| Kaki | Paha maju ke tangki, betis turun ke **footpeg** baru di sisi mesin, sepatu menginjak footpeg |
| Badan | Punggung condong ke depan (perut → dada → bahu), strip resleting senada warna motor, kerah putih |
| Lengan | Dua segmen dengan **siku membengkok** (rz −0.36 lalu −0.58); sarung tangan duduk **pas di grip setang** (jarak < 0.05) |
| Helm | Tempurung **membulat 4 tingkat** (makin kecil ke atas), dasar helm menutup tengkuk, pelipis kiri/kanan, **kaca gelap** dengan bibir atas, chin bar menutup dagu, strip warna senada motor, spoiler belakang |

Ditambah: footpeg, warna celana (`RIDER_PANTS`) dan jaket per varian supaya tiap varian (0–5) kelihatan berbeda.

Uji: `test/characters.ts` (bagian "Pengendara motor + helm") memastikan pinggul duduk di jok, dua tangan menggenggam grip, helm punya kaca + chin bar, dan tidak ada bagian yang menembus aspal.

## 2. Karakter baru (`src/game/chars.ts` + `src/game/skins.ts`)

Karakter baru memakai **rig dan nama fungsi yang sama** dengan merpati (`Player.tsx`, `pigeonRig.ts`, `thumbs.ts`),
jadi animasi (dayung, grind, trick, crash ragdoll, kepala memantau jalan) langsung jalan tanpa kode baru.

Anchor yang wajib dipatuhi setiap spesies (lihat komentar `chars.ts`):

```
telapak kaki    y = 0            (badan mulai dari tinggi pinggul, kaki dari rig)
bahu            (0, 0.72, ±0.3)  ("sayap" = lengan depan / sayap)
sendi kepala    (0.32, 1.04, 0)  (kepala + paruh/moncong dibangun di sekitar origin ini)
pangkal ekor    (−0.40, 0.55, 0)
pinggul         (0, 0.30, ±0.16)
```

| Karakter | Ciri model |
| --- | --- |
| **Kucing Oren** (`kind: "cat"`) | Badan gempal oranye + dada krem, garis tabby di punggung/samping, kepala besar dengan **telinga segitiga** (luar + dalam pink), moncong krem, hidung pink, **kumis**, mata putih+pupil; "sayap" jadi **lengan depan bertelapak**; ekor panjang **melengkung naik** dengan ujung putih; kaki lebih gempal dari merpati dengan **telapak berkuku** |
| **Flamingo** (`kind: "flamingo"`) | Badan kecil, **leher panjang** (bagian dari badan) naik ke sendi kepala, gelang warna di pangkal leher, dada lebih terang, bulu ekor gelap; kepala kecil, **paruh 3 segmen melengkung ke bawah** dengan ujung hitam; sayap panjang ramping; **kaki paling ramping** dengan telapak berselaput |
| **Gagak** (`kind: "crow"`) | Badan hitam dengan **kilau biru** di punggung, dada abu gelap, **bulu tengkuk menjuntai**; kepala dengan **paruh besar panjang** (pangkal lebih terang, ujung menukik), **mata pucat** khas gagak; sayap lebih panjang dari merpati, ekor berbentuk baji |

Ketiganya **gratis** (`cost: 0`), jadi otomatis kebuka (`store.ts` menambahkan semua skin gratis ke `unlocked`).

Pemilihnya ada di menu **SKINS → tab "KARAKTER"** (dulu "MERPATI"), plus bisa di-swap dari karusel di menu utama.
Kalau WebGL mati, ikon SVG cadangan (`PigeonIcon`) juga sudah mengenal tiap spesies.

## 3. Cara menambah karakter/spesies baru

1. Tambah `kind` baru di `CharKind` (`skins.ts`) dan satu entri di `SKINS` dengan palet warnanya.
2. Buat builder di `chars.ts` (`body`, `head`, `wing`/lengan, `tail`, kaki) mengikuti anchor di atas.
3. Sambungkan di dispatcher `charBodyParts` / `charHeadParts` / `charWingParts` / `charTailParts` / `charLegParts`.
4. Tambah cabang ikon di `PigeonIcon.tsx` (cadangan bila thumbnail 3D gagal).
5. Jalankan `npx esbuild test/characters.ts --bundle --platform=node --outfile=/tmp/characters.cjs && node /tmp/characters.cjs`.

## 4. Verifikasi

```bash
./node_modules/.bin/tsc --noEmit                     # bersih
npx esbuild test/animalSize.ts --bundle --platform=node --outfile=/tmp/a.cjs && node /tmp/a.cjs   # 32/32
npx esbuild test/newFeatures.ts --bundle --platform=node --outfile=/tmp/n.cjs && node /tmp/n.cjs  # 36/36
npx esbuild test/characters.ts --bundle --platform=node --outfile=/tmp/c.cjs && node /tmp/c.cjs   # 82/82
npx vite build                                       # sukses
```
