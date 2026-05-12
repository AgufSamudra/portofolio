---
title: "Reverse Proxy Nginx dengan bantuan Certbot"
date: "2026-05-12"
excerpt: "SSL gratis dengan certbot nginx"
tags: ["Nginx", "Certbot"]
---


## Cara Pasang SSL Gratis di Nginx Menggunakan Certbot

Kalau kita sudah deploy aplikasi di server, biasanya aplikasi jalan di port tertentu, misalnya `localhost:2000`. Masalahnya, user tidak mungkin akses langsung ke port itu. Biasanya kita taruh Nginx di depan aplikasi sebagai **reverse proxy**, lalu kita pasang SSL supaya domain bisa diakses lewat HTTPS.

Di blog ini kita akan bahas cara install Certbot via Snap, setup Nginx config, generate SSL dari `Let's Encrypt`, dan test auto-renew certificate-nya.

## Gambaran Flow-nya

Secara sederhana flow-nya begini:

```text
User Browser
   ↓ HTTPS
Domain / Nginx
   ↓ proxy_pass
Aplikasi di localhost:2000
```

Jadi aplikasi kita tetap jalan di internal server, misalnya:

```text
http://localhost:2000
```

Tapi dari luar, user aksesnya lewat domain:

```text
https://example.com
```

Nginx yang bertugas menerima request dari domain, lalu meneruskannya ke aplikasi kita.



## Prerequisites

Sebelum mulai, pastikan beberapa hal ini sudah siap:

1. Server sudah menggunakan Linux, misalnya Ubuntu.
2. Nginx sudah terinstall.
3. Domain sudah diarahkan ke IP server.
4. Port `80` dan `443` sudah terbuka di firewall/security group.
5. Aplikasi backend/frontend sudah jalan di server, misalnya di port `2000`.

Kenapa domain harus sudah diarahkan dulu?

Karena Certbot akan melakukan validasi domain. Jadi ketika kita request SSL untuk domain tertentu, Let's Encrypt perlu memastikan bahwa domain tersebut memang mengarah ke server kita.



## 1. Install Snap dan Certbot

Pertama, install dulu `snapd`.

```bash
sudo apt install snapd -y
```

Lalu install package `core` dari Snap.

```bash
sudo snap install core
```

Setelah itu install Certbot.

```bash
sudo snap install --classic certbot
```

Kenapa pakai Snap?

Karena Certbot official merekomendasikan instalasi via Snap untuk banyak distro Linux modern. Biasanya versi dari Snap lebih update dibanding package bawaan repository distro.



## 2. Buat Symlink Certbot

Setelah Certbot terinstall via Snap, binary-nya biasanya ada di:

```text
/snap/bin/certbot
```

Supaya command `certbot` bisa dipanggil langsung dari terminal, buat symlink ke `/usr/bin/certbot`.

```bash
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Lalu cek apakah Certbot sudah bisa dipakai:

```bash
certbot --version
```

Kalau berhasil, akan muncul versi Certbot yang terinstall.



## 3. Buat Config Nginx untuk Domain

Sekarang kita buat konfigurasi Nginx untuk domain aplikasi kita.

Masuk ke folder config Nginx:

```bash
cd /etc/nginx/sites-available
```

> Catatan: folder yang benar biasanya `sites-available`, bukan `site-available`.

Buat file config baru. Misalnya nama domain kita `api.example.com`, maka file-nya bisa dibuat seperti ini:

```bash
sudo nano api.example.com
```

Isi config awalnya seperti ini:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:2000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sesuaikan bagian ini:

```nginx
server_name api.example.com;
```

Dengan domain server kamu.

Lalu sesuaikan juga bagian ini:

```nginx
proxy_pass http://localhost:2000;
```

Dengan port aplikasi yang sedang jalan di server.

Contoh:

```nginx
proxy_pass http://localhost:3000;
```

Atau:

```nginx
proxy_pass http://localhost:8000;
```



## Kenapa Config Nginx-nya Seperti Itu?

Bagian ini:

```nginx
listen 80;
```

Artinya Nginx menerima request HTTP biasa di port `80`.

Bagian ini:

```nginx
server_name api.example.com;
```

Dipakai Nginx untuk menentukan domain mana yang akan menggunakan config ini.

Bagian ini:

```nginx
proxy_pass http://localhost:2000;
```

Artinya semua request yang masuk ke domain akan diteruskan ke aplikasi internal yang jalan di port `2000`.

Lalu bagian headers ini:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

Dipakai supaya backend tetap tahu informasi request asli, seperti domain, IP client, dan protokol yang digunakan.

Ini penting terutama kalau backend butuh generate URL, logging IP user, rate limiting, auth callback, atau redirect.

Bagian ini:

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

Berguna kalau aplikasi kamu menggunakan WebSocket. Kalau aplikasinya tidak pakai WebSocket, bagian ini biasanya tetap aman untuk dibiarkan.



## 4. Aktifkan Config Nginx dengan Symlink

Setelah file config dibuat di `sites-available`, kita perlu mengaktifkannya dengan membuat symlink ke `sites-enabled`.

```bash
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/
```

Kenapa harus pakai symlink?

Karena pola umum Nginx di Ubuntu adalah:

- `sites-available`: tempat menyimpan semua config yang tersedia.
- `sites-enabled`: config yang benar-benar aktif digunakan Nginx.

Jadi kalau suatu saat mau disable domain tertentu, kita cukup hapus symlink-nya dari `sites-enabled`, tanpa menghapus file config aslinya.



## 5. Test Config Nginx

Sebelum reload Nginx, wajib test config dulu.

```bash
sudo nginx -t
```

Kalau hasilnya seperti ini:

```text
syntax is ok
test is successful
```

Berarti config aman.

Lalu reload Nginx:

```bash
sudo systemctl reload nginx
```

Kenapa pakai reload, bukan restart?

Karena `reload` akan membaca ulang config tanpa benar-benar mematikan service Nginx. Ini lebih aman untuk production karena downtime-nya lebih minim.



## 6. Generate SSL Menggunakan Certbot

Sekarang jalankan Certbot dengan plugin Nginx:

```bash
sudo certbot --nginx
```

Certbot akan membaca config Nginx, lalu mendeteksi domain yang tersedia dari directive `server_name`.

Nanti biasanya Certbot akan menampilkan daftar domain, misalnya:

```text
1: api.example.com
2: www.example.com
```

Pilih nomor domain yang ingin dipasang SSL.

Setelah itu Certbot akan:

1. Request SSL certificate ke Let's Encrypt.
2. Memvalidasi domain.
3. Mengubah config Nginx agar support HTTPS.
4. Menambahkan konfigurasi redirect HTTP ke HTTPS kalau dipilih.

Kalau berhasil, domain kamu sudah bisa diakses lewat:

```text
https://api.example.com
```



## 7. Test Auto-Renew SSL

Certificate dari Let's Encrypt punya masa berlaku terbatas, jadi harus diperpanjang secara berkala.

Certbot biasanya sudah otomatis memasang timer/systemd untuk renew. Tapi tetap lebih aman kita test dulu proses renew-nya.

Jalankan:

```bash
sudo certbot renew --dry-run
```

Command ini tidak benar-benar memperpanjang certificate, tapi hanya mengetes apakah proses renewal bisa berjalan dengan benar.

Kalau hasilnya sukses, berarti auto-renew SSL sudah aman.



## 8. Optional: Cek Timer Auto-Renew Certbot

Untuk memastikan auto-renew aktif, kamu bisa cek timer Certbot:

```bash
systemctl list-timers | grep certbot
```

Atau:

```bash
sudo systemctl status snap.certbot.renew.timer
```

Kalau timer aktif, Certbot akan otomatis mencoba memperpanjang certificate sebelum expired.



## 9. Optional: Buka Firewall

Kalau server pakai UFW, pastikan port HTTP dan HTTPS terbuka.

```bash
sudo ufw allow 80
sudo ufw allow 443
```

Atau bisa juga pakai profile Nginx:

```bash
sudo ufw allow 'Nginx Full'
```

Lalu cek status firewall:

```bash
sudo ufw status
```

Kalau pakai VPS provider seperti AWS, GCP, Azure, DigitalOcean, atau lainnya, jangan lupa cek juga security group/firewall dari dashboard provider.



## Contoh Full Command

Berikut versi ringkas command-nya:

```bash
sudo apt install snapd -y
sudo snap install core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
certbot --version
```

Buat config Nginx:

```bash
sudo nano /etc/nginx/sites-available/api.example.com
```

Isi config:

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:2000;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Aktifkan config:

```bash
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/
```

Test dan reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Generate SSL:

```bash
sudo certbot --nginx
```

Test auto-renew:

```bash
sudo certbot renew --dry-run
```



## Troubleshooting yang Sering Terjadi

### 1. Domain Belum Mengarah ke Server

Kalau Certbot gagal validasi domain, cek dulu DNS-nya.

```bash
ping api.example.com
```

Atau:

```bash
nslookup api.example.com
```

Pastikan IP yang muncul adalah IP server kamu.



### 2. Port 80 atau 443 Belum Dibuka

Certbot butuh akses ke port `80` untuk validasi HTTP challenge. Jadi pastikan port ini tidak tertutup firewall.

```bash
sudo ufw allow 80
sudo ufw allow 443
```



### 3. Config Nginx Error

Kalau `nginx -t` gagal, jangan lanjut reload dulu.

Cek error yang muncul, biasanya masalahnya ada di:

- Typo `server_name`.
- Kurang titik koma `;`.
- File config duplicate.
- Symlink mengarah ke file yang salah.



### 4. Aplikasi Backend Belum Jalan

Kalau HTTPS sudah aktif tapi halaman error `502 Bad Gateway`, biasanya aplikasi di belakang Nginx belum jalan.

Cek apakah port aplikasi aktif:

```bash
sudo lsof -i :2000
```

Atau:

```bash
curl http://localhost:2000
```

Kalau dari server saja belum bisa diakses, berarti masalahnya ada di aplikasi/backend, bukan SSL-nya.



## Kesimpulan

Dengan Nginx + Certbot, kita bisa pasang SSL gratis dari Let's Encrypt dengan cukup cepat.

Flow utamanya adalah:

1. Install Certbot.
2. Buat config Nginx untuk domain.
3. Arahkan request ke aplikasi lokal menggunakan `proxy_pass`.
4. Test dan reload Nginx.
5. Jalankan `certbot --nginx`.
6. Test auto-renew dengan `certbot renew --dry-run`.

Setup ini cocok untuk backend API, frontend app, dashboard internal, atau service lain yang berjalan di port lokal server.



## Referensi

- Certbot official instructions untuk Nginx di Ubuntu: https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal
- Certbot user guide: https://eff-certbot.readthedocs.io/en/stable/using.html
- Nginx reverse proxy documentation: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
- Nginx proxy module documentation: https://nginx.org/en/docs/http/ngx_http_proxy_module.html
- Let's Encrypt official website: https://letsencrypt.org/
