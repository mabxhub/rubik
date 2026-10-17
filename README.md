# Penyelesai Rubik 3D

Paparan satu skrin tanpa scroll untuk desktop dan mobile. Setiap warna dihadkan kepada 9 petak; warna penuh digelapkan. Baki 9 petak putih dilengkapkan secara automatik. Ketik semula petak dengan warna yang sama untuk mengosongkannya. Pilih warna, ketik petak, seret untuk putar, kemudian tekan **Selesaikan**. Butang **⤨** menyediakan kiub rawak.

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

## Tutorial bergambar

Tekan butang bulat **?** pada paparan awal. Menu merangkumi 12 topik dan 53 pelajaran: asas/notasi, Beginner LBL, CFOP 2-look, CFOP penuh, Roux, ZZ, Petrus, Heise, Old Pochmann, komutator/setup, Thistlethwaite dan Kociemba. Koleksi ini meliputi kaedah utama serta konsep lanjutan, bukan setiap variasi komuniti yang pernah dicipta.

Tutorial dalam Bahasa Melayu mengekalkan istilah penting dalam English. Setiap pelajaran mempunyai rajah sasaran. Pustaka mengandungi semua **57 OLL, 21 PLL dan 42 CMLL** dengan formula, rajah kes mula enam muka dan pemain latihan 3D yang boleh diseret. Pemain menyokong pusingan muka, hirisan M/E/S, wide moves dan putaran x/y/z. Kes contoh dijana dengan mengundurkan formula daripada kiub selesai, kemudian formula dimainkan dari kes itu.

Kiub latihan berasingan tidak mengubah warna atau langkah penyelesai pengguna. Tutorial dan rajah berfungsi offline selepas pemasangan cache. Pilihan tutorial membuka bahan pembelajaran; ia tidak menukar enjin penyelesai automatik kepada kaedah manusia. Tutorial boleh ditatal di dalam panelnya; paparan utama kekal satu skrin.

Semakan tambahan:

```sh
node tests/painting.test.cjs
node tests/tutorial.test.cjs
```

Ujian tutorial menyemak notasi dengan enjin utama, formula songsang, pemeliharaan F2L untuk OLL/PLL dan blok untuk CMLL, bilangan kes, serta rujukan semua pelajaran. Ujian pelayar turut dilakukan pada Chromium dengan simulasi mobile dan desktop, termasuk tatal sentuhan serta cache offline; tiada dakwaan ujian peranti fizikal.

### Sumber dan atribusi

Huraian Bahasa Melayu serta rajah dijana untuk aplikasi ini. Formula standard dan struktur kaedah dirujuk daripada sumber berikut; pautan rujukan juga tersedia pada setiap tutorial:

- [Ruwix — Beginner LBL](https://ruwix.com/the-rubiks-cube/how-to-solve-the-rubiks-cube-beginners-method/)
- [J Perm — CFOP](https://jperm.net/3x3/cfop), [57 OLL](https://jperm.net/algs/oll), [21 PLL](https://jperm.net/algs/pll)
- [Ruwix — Roux dan 42 CMLL](https://ruwix.com/the-rubiks-cube/different-rubiks-cube-solving-methods/roux-method/) — set CMLL di sana berasaskan senarai Kian Mansour.
- [Ruwix — ZZ](https://ruwix.com/the-rubiks-cube/different-rubiks-cube-solving-methods/zz-method/)
- [Lars Petrus — kaedah Petrus](https://lar5.com/cube/)
- [Ryan Heise — kaedah Heise](https://www.ryanheise.com/cube/heise_method.html)
- [J Perm — Old Pochmann](https://jperm.net/bld)
- [Jaap Scherphuis — Thistlethwaite](https://www.jaapsch.net/puzzles/thistle.htm)
- [Herbert Kociemba — Two-Phase](https://kociemba.org/cube.htm)
