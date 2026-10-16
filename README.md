# Penyelesai Rubik 3D

Paparan satu skrin tanpa scroll untuk desktop dan mobile. Pilih warna, ketik petak, seret untuk putar, kemudian tekan **Selesaikan**. Butang **⤨** menyediakan kiub rawak.

## GitHub Pages dan PWA

1. Di repo, buka **Settings → Pages → Source → GitHub Actions**.
2. Jalankan workflow **Deploy GitHub Pages**, atau push perubahan ke `main`.
3. Buka https://mabxhub.github.io/rubik/ selepas deployment berjaya.
4. Android/desktop: gunakan **Pasang** apabila ditawarkan pelayar. iPhone/iPad: **Share → Add to Home Screen**.

Aplikasi boleh dibuka tanpa internet selepas cache pemasangan pertama siap. HTTPS diperlukan, kecuali localhost untuk pembangunan.

Setiap push ke `main` membina versi cache baharu secara automatik apabila fail aplikasi berubah. Aplikasi menyemak kemas kini apabila dibuka, kembali aktif, kembali dalam talian, dan setiap jam semasa dibuka. Tekan **Kemas kini** apabila versi baharu tersedia. Warna kiub serta kemajuan langkah dalam tab yang sama dipulihkan selepas muat semula. Pelayar menentukan masa pemasangan dan semakan kemas kini; iOS menggunakan pemasangan melalui menu Share.

## Pembangunan

```sh
node scripts/build.mjs
python3 -m http.server 8000 --directory dist
```

Buka http://localhost:8000. Bina semula selepas mengubah fail untuk menjana `sw.js` baharu. `dist/` ialah artifak deployment yang dijana, dan tidak dimasukkan ke Git.

```sh
node tests/engine.test.cjs
```

Enjin empat fasa mengesahkan input dan hasil penyelesaian. Bilangan pusingan tidak semestinya minimum. WebGL dan JavaScript diperlukan. Three.js r128 disimpan secara tempatan, di bawah lesen MIT dalam `vendor/THREE-LICENSE.txt`.
