# Misi SENSAVOUR (versi Firebase)

Laman web statik: pra-ujian, teroka SENSAVOUR, pasca-ujian terkunci, dan lencana akhir. Jawapan disimpan dalam Firebase Firestore. Peserta tak perlu akaun.

## Fail

| Fail | Fungsi |
|---|---|
| `index.html` | Aplikasi peserta |
| `admin.html` | Halaman penyelidik: senarai peserta dan eksport CSV |
| `firebase-config.js` | Config Firebase dan tetapan masa meneroka (edit fail ini) |
| `firestore.rules` | Peraturan keselamatan dan gate pasca-ujian di pelayan |

## Setup (sekali sahaja)

1. Pergi ke console.firebase.google.com, **Add project** (Analytics boleh dimatikan).
2. **Build > Firestore Database > Create database**. Pilih **production mode**. Lokasi `asia-southeast1` (Singapura) paling dekat.
3. **Build > Authentication > Get started**. Di tab *Sign-in method*, aktifkan **Anonymous** dan **Google**.
4. Di *Authentication > Settings > Authorized domains*, tambah domain tapak awak (contoh `misi-sensavour.netlify.app`) selepas deploy.
5. **Project settings > Your apps > Web (`</>`)**, daftar app, salin objek `firebaseConfig` dan tampal dalam `firebase-config.js`.
6. Buka `firestore.rules`, tukar `GANTI_EMEL_ADMIN@contoh.com` kepada emel Google awak (huruf kecil). Salin seluruh isi fail ke **Firestore > Rules** dan tekan **Publish**.

## Deploy

Netlify: log masuk, **Add new site > Deploy manually**, seret folder ini. Tapak terus hidup. Kongsi pautan utama (`/`) kepada peserta. Pautan `/admin.html` untuk awak sahaja.

## Uji sebelum edar (wajib)

1. Buka tapak di telefon, guna kod `S001`, hantar pra-ujian.
2. Pastikan iframe SENSAVOUR muncul. Kalau kosong, tapak itu menyekat embed. Butang "Buka tab baru" masih berfungsi.
3. Isi 5 perkataan. Butang buka kunci hanya hidup selepas 5 minit.
4. Cuba hantar pasca-ujian dan pastikan ia berjaya.
5. Buka `/admin.html`, log masuk Google, semak baris `S001` dan tekan **Eksport CSV**.
6. Padam data ujian dalam Firebase Console (Firestore > participants) sebelum mula kutip data sebenar.

## Apa yang dikunci di pelayan (bukan hanya di skrin)

- Pra-ujian tak boleh diubah selepas dihantar.
- Pasca-ujian tak boleh dihantar sebelum kunci dibuka.
- Kunci hanya dibuka jika pelayan mengesahkan sekurang-kurangnya 300 saat sejak mula meneroka dan 5 perkataan telah disimpan.
- Peserta hanya boleh baca dokumen sendiri. Hanya emel admin boleh baca semua.
- Peserta boleh tukar jawapan hanya sebelum dihantar. Dokumen tak boleh dipadam.

## Tukar masa meneroka

Ubah `MIN_EXPLORE_SECONDS` dalam `firebase-config.js` **dan** nombor `300` dalam `duration.value(300, 's')` di `firestore.rules`. Kedua-duanya mesti sama.

## Perkara yang perlu diketahui

- Kod peserta tak unik secara automatik. Jika dua orang taip kod yang sama, mereka jadi dua baris berasingan dengan `uid` berbeza. Semak lajur kod dalam CSV.
- Peserta dikenal pasti oleh pelayar mereka. Jika tukar peranti atau padam data pelayar, mereka mula sebagai peserta baharu.
- Data disimpan dalam pelayan Google di bawah akaun awak. Semak keperluan lembaga etika dan pelan pengurusan data institusi, termasuk tempoh simpanan dan padam data.
- Peraturan Firestore belum diuji dalam emulator. Ikut senarai ujian di atas sebelum edar.
- Eksport CSV dibuka dalam Excel dengan betul (UTF-8 BOM). Lajur mengikut nombor soalan asal Q3–Q36.
