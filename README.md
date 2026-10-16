# Penyelesai Rubik 3D

Aplikasi web Bahasa Melayu untuk mewarna kiub Rubik 3×3×3 dan memainkan penyelesaian beranimasi. Mesra desktop, telefon dan tablet, tanpa proses build atau perkhidmatan backend.

## Jalankan secara tempatan

```sh
python3 -m http.server 8000
```

Buka http://localhost:8000. Gunakan pelayan HTTP kerana Web Worker tidak dapat dijalankan melalui `file://`.

## Cara guna

1. Pilih warna dan ketik petak pada kiub. Seret untuk melihat muka lain.
2. Pastikan keenam-enam petak tengah mempunyai warna berbeza dan setiap warna mempunyai 9 petak.
3. Tekan **Cari penyelesaian**. Gunakan langkah sebelumnya, seterusnya atau Auto.
4. Pilih **Cuba kiub rawak** untuk demonstrasi, **Kosongkan** untuk input baharu, atau **Sudut asal** untuk menetapkan semula pandangan.

Input yang tidak sah akan ditolak tanpa mengubah warna kiub. Penyelesaian menggunakan algoritma empat fasa; bilangan pusingan tidak semestinya minimum. Pengiraan dibuat dalam Web Worker dan hasil disahkan sebelum dipaparkan. Sokongan WebGL dan JavaScript diperlukan. Semua aset aplikasi disimpan dalam repo; tiada CDN diperlukan semasa penggunaan.

## GitHub Pages

Di **Settings → Pages → Build and deployment**, pilih **Deploy from a branch**, kemudian **main** dan **/(root)**. Selepas diterbitkan, alamat lazim ialah https://mabxhub.github.io/rubik/.

## Semakan

```sh
node tests/engine.test.cjs
```

Ujian meliputi keserasian 18 pusingan visual dengan enjin, pusingan songsang, 100 acakan berbenih tetap termasuk skema warna tengah tersuai, dan keadaan kiub mustahil.

## Fail utama

- `index.html`, `style.css`: antara muka responsif.
- `app.js`: paparan Three.js, input pointer dan pemain langkah.
- `engine.js`: perwakilan kiub, pengesahan dan algoritma penyelesaian.
- `solver-worker.js`: pengiraan di latar dan pengesahan hasil.
- `vendor/three.min.js`: Three.js r128 (MIT; lihat `vendor/THREE-LICENSE.txt`).

Berasaskan fail HTML yang dibekalkan oleh pemilik repo.
