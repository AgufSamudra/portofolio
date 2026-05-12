---
title: "Cara Membuat Instance PostgreSQL Baru di Ubuntu/Debian + Setup SSL/TLS"
date: "2026-05-12"
excerpt: "Cara setup instace postgresql di ubuntu linux plus dengan setup SSL/TLS"
tags: ["Database", "PostgreSQL"]
---

## Membuat Instance PostgreSQL Baru di Ubuntu/Debian + Setup SSL/TLS

> Panduan ini cocok kalau kamu ingin menjalankan lebih dari satu instance/cluster PostgreSQL di satu server, misalnya: satu untuk production, satu untuk staging, atau satu lagi untuk development.

Di contoh ini kita akan membuat cluster PostgreSQL baru dengan:

- PostgreSQL version: `16`
- Cluster name: `main_dev`
- Port: `5433`
- Config path: `/etc/postgresql/16/main_dev/`
- SSL path contoh: `/etc/postgresql/ssl/staging/`

> Catatan: istilah “instance” di PostgreSQL Debian/Ubuntu biasanya direpresentasikan sebagai **cluster**. Satu cluster punya port, data directory, config, dan service sendiri.

---

## 1. Cek PostgreSQL yang Sudah Terinstall

Sebelum bikin instance baru, pastikan dulu PostgreSQL sudah terinstall dan cek cluster yang sudah ada.

```bash
pg_lsclusters
```

Contoh output:

```bash
Ver Cluster  Port Status Owner    Data directory              Log file
16  main     5432 online postgres /var/lib/postgresql/16/main /var/log/postgresql/postgresql-16-main.log
```

Kenapa ini penting?

Karena PostgreSQL default biasanya sudah jalan di port `5432`. Kalau kamu langsung bikin instance kedua pakai port yang sama, PostgreSQL bisa gagal start karena port bentrok. Jadi untuk instance baru, kita pakai port lain, misalnya `5433`.

---

## 2. Buat Cluster PostgreSQL Baru

Gunakan `pg_createcluster` untuk membuat cluster baru.

Format umumnya:

```bash
sudo pg_createcluster <version> <cluster_name> --port=<port> --start
```

Contoh:

```bash
sudo pg_createcluster 16 main_dev --port=5433 --start
```

Reason:

- `16` adalah versi PostgreSQL yang digunakan.
- `main_dev` adalah nama cluster/instance baru.
- `--port=5433` supaya tidak bentrok dengan PostgreSQL default di port `5432`.
- `--start` supaya cluster langsung dijalankan setelah dibuat.

Setelah itu, cek lagi:

```bash
pg_lsclusters
```

Harusnya muncul cluster baru seperti ini:

```bash
16  main_dev  5433 online postgres /var/lib/postgresql/16/main_dev ...
```

---

## 3. Ubah Sementara `pg_hba.conf` agar Bisa Login Lokal Tanpa Password

File `pg_hba.conf` dipakai PostgreSQL untuk mengatur aturan autentikasi client.

Lokasi file untuk cluster kita:

```bash
/etc/postgresql/16/main_dev/pg_hba.conf
```

Buka file-nya:

```bash
sudo nano /etc/postgresql/16/main_dev/pg_hba.conf
```

Cari bagian koneksi localhost, biasanya mirip seperti ini:

```conf
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Untuk sementara, ubah menjadi:

```conf
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust
```

Reason:

Kita ubah ke `trust` hanya sementara supaya bisa masuk ke PostgreSQL lokal tanpa password, lalu set password user `postgres`. Ini praktis untuk setup awal, tapi **jangan dibiarkan seperti ini di production** karena `trust` artinya siapa pun yang match rule tersebut bisa login tanpa password.

Reload/restart cluster:

```bash
sudo pg_ctlcluster 16 main_dev restart
```

> Lebih aman pakai `pg_ctlcluster` untuk cluster spesifik dibanding restart semua PostgreSQL, karena kita cuma menyentuh instance `16/main_dev`.

---

## 4. Masuk ke PostgreSQL dan Set Password User `postgres`

Masuk sebagai user Linux `postgres`:

```bash
sudo su - postgres
```

Login ke cluster PostgreSQL yang baru:

```bash
psql -U postgres -h localhost -p 5433
```

Karena tadi auth masih `trust`, harusnya bisa masuk tanpa password.

Set password untuk user `postgres`:

```sql
\password postgres
```

Masukkan password baru, misalnya:

```text
xxxxxxxxxxxxxxx
```

Keluar dari `psql`:

```sql
\q
```

Keluar dari user `postgres`:

```bash
exit
```

Reason:

User `postgres` adalah superuser default di PostgreSQL. Password ini perlu diset supaya koneksi remote/client seperti pgAdmin, aplikasi backend, atau service lain bisa login dengan aman.

---

## 5. Kembalikan `pg_hba.conf` ke Authentication yang Aman

Buka lagi file `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/16/main_dev/pg_hba.conf
```

Kembalikan localhost dari `trust` ke `scram-sha-256`:

```conf
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

Reason:

`scram-sha-256` lebih aman daripada `md5` karena mekanisme password hashing-nya lebih modern. Untuk setup production, hindari `trust` kecuali benar-benar untuk case lokal yang sangat terbatas.

Restart cluster:

```bash
sudo pg_ctlcluster 16 main_dev restart
```

Test login lagi, sekarang dengan password:

```bash
psql -U postgres -h localhost -p 5433 -W
```

---

## 6. Ubah `listen_addresses` agar Bisa Diakses dari Luar Server

Secara default, PostgreSQL sering hanya listen di localhost. Kalau ingin bisa diakses dari device/server lain, ubah `postgresql.conf`.

Lokasi file:

```bash
/etc/postgresql/16/main_dev/postgresql.conf
```

Buka file:

```bash
sudo nano /etc/postgresql/16/main_dev/postgresql.conf
```

Cari bagian:

```conf
#listen_addresses = 'localhost'
```

Ubah menjadi:

```conf
listen_addresses = '*'
```

Reason:

`listen_addresses = '*'` membuat PostgreSQL menerima koneksi TCP dari interface network mana pun. Tapi ini baru membuka “telinga” PostgreSQL. Akses tetap harus diatur lewat `pg_hba.conf` dan firewall.

Restart cluster:

```bash
sudo pg_ctlcluster 16 main_dev restart
```

---

## 7. Tambahkan Rule Remote Access di `pg_hba.conf`

Buka file:

```bash
sudo nano /etc/postgresql/16/main_dev/pg_hba.conf
```

Untuk mengizinkan koneksi remote dengan password:

```conf
host    all             all             0.0.0.0/0               scram-sha-256
```

Kalau ingin lebih aman, batasi ke IP tertentu:

```conf
host    all             all             203.0.113.10/32          scram-sha-256
```

Reason:

`0.0.0.0/0` artinya semua IP boleh mencoba konek. Ini fleksibel, tapi lebih berisiko. Untuk production, lebih baik whitelist IP aplikasi/backend saja.

Reload cluster:

```bash
sudo pg_ctlcluster 16 main_dev reload
```

---

## 8. Buka Port di Firewall

Kalau server pakai UFW, buka port PostgreSQL instance baru:

```bash
sudo ufw allow 5433/tcp
```

Cek status firewall:

```bash
sudo ufw status
```

Reason:

Walaupun PostgreSQL sudah listen di port `5433`, koneksi tetap bisa gagal kalau firewall OS menutup port tersebut.

---

# Setup SSL/TLS untuk PostgreSQL

SSL/TLS dipakai agar koneksi client ke PostgreSQL terenkripsi. Ini penting kalau koneksi database melewati jaringan publik atau berbeda server.

Contoh domain:

```text
pg.akademiquality.com
```

> Pastikan domain/subdomain sudah mengarah ke IP server PostgreSQL sebelum testing `sslmode=verify-full`.

---

## 9. Buat Directory SSL

Buat folder khusus untuk sertifikat:

```bash
sudo mkdir -p /etc/postgresql/ssl/staging
cd /etc/postgresql/ssl/staging
```

Reason:

Sertifikat SSL sebaiknya dipisahkan per environment. Misalnya:

```text
/etc/postgresql/ssl/staging
/etc/postgresql/ssl/production
```

Dengan begitu, config staging dan production tidak kecampur.

---

## 10. Buat Root CA

Buat private key untuk Root CA:

```bash
sudo openssl genrsa -out rootCA.key 4096
```

Buat sertifikat Root CA:

```bash
sudo openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 3650 -out rootCA.crt
```

Saat diminta `Common Name (CN)`, isi dengan nama yang merepresentasikan CA kamu, misalnya:

```text
AkademiQuality PostgreSQL Root CA
```

Reason:

Root CA ini akan menjadi “pihak yang dipercaya” untuk menandatangani sertifikat server PostgreSQL. Client nanti perlu punya `rootCA.crt` supaya bisa memverifikasi bahwa server yang diakses benar-benar server yang valid.

---

## 11. Buat Sertifikat Server

Buat private key server:

```bash
sudo openssl genrsa -out server.key 4096
```

Buat Certificate Signing Request / CSR:

```bash
sudo openssl req -new -key server.key -out server.csr
```

Saat diminta `Common Name (CN)`, isi dengan domain PostgreSQL kamu:

```text
pg.akademiquality.com
```

Reason:

Server certificate dipakai PostgreSQL untuk membuktikan identitas server ke client. Kalau pakai `sslmode=verify-full`, hostname yang dipakai client harus cocok dengan certificate.

---

## 12. Buat File Extension untuk Subject Alternative Name

Buat file:

```bash
sudo nano server.ext
```

Isi dengan:

```conf
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = pg.akademiquality.com
# Kalau ingin bisa connect via IP juga, uncomment dan sesuaikan:
# IP.1 = 202.10.35.45
```

Reason:

Modern TLS verification lebih mengutamakan `Subject Alternative Name` atau SAN. Jadi domain/IP yang dipakai client harus masuk ke bagian ini, terutama kalau ingin pakai `sslmode=verify-full`.

---

## 13. Tandatangani Sertifikat Server dengan Root CA

Jalankan:

```bash
sudo openssl x509 -req \
  -in server.csr \
  -CA rootCA.crt \
  -CAkey rootCA.key \
  -CAcreateserial \
  -out server.crt \
  -days 365 \
  -sha256 \
  -extfile server.ext
```

Reason:

Di step ini, Root CA menandatangani certificate server. Hasil akhirnya adalah `server.crt`, yang akan dipakai oleh PostgreSQL.

---

## 14. Atur Ownership dan Permission File SSL

Set ownership ke user `postgres`:

```bash
sudo chown postgres:postgres /etc/postgresql/ssl/staging/rootCA.crt
sudo chown postgres:postgres /etc/postgresql/ssl/staging/server.crt
sudo chown postgres:postgres /etc/postgresql/ssl/staging/server.key
```

Khusus private key server, permission harus ketat:

```bash
sudo chmod 0600 /etc/postgresql/ssl/staging/server.key
```

Opsional, amankan Root CA private key:

```bash
sudo chmod 0600 /etc/postgresql/ssl/staging/rootCA.key
```

Reason:

`server.key` adalah private key. Kalau file ini bocor, orang lain bisa menyamar sebagai server database kamu. PostgreSQL juga biasanya akan menolak private key yang permission-nya terlalu terbuka.

---

## 15. Enable SSL di `postgresql.conf`

Buka config:

```bash
sudo nano /etc/postgresql/16/main_dev/postgresql.conf
```

Tambahkan atau ubah:

```conf
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/staging/server.crt'
ssl_key_file = '/etc/postgresql/ssl/staging/server.key'
ssl_ca_file = '/etc/postgresql/ssl/staging/rootCA.crt'
```

Reason:

Setting ini memberi tahu PostgreSQL untuk mengaktifkan SSL dan memakai certificate/key yang sudah kita buat.

Restart cluster:

```bash
sudo pg_ctlcluster 16 main_dev restart
```

---

## 16. Paksa Koneksi Remote Menggunakan SSL

Buka `pg_hba.conf`:

```bash
sudo nano /etc/postgresql/16/main_dev/pg_hba.conf
```

Tambahkan rule `hostssl`:

```conf
hostssl    all             all             0.0.0.0/0               scram-sha-256
```

Kalau ingin menolak koneksi non-SSL secara eksplisit, tambahkan juga:

```conf
hostnossl  all             all             0.0.0.0/0               reject
```

Reason:

- `hostssl` hanya menerima koneksi yang memakai SSL/TLS.
- `hostnossl ... reject` membuat koneksi non-SSL langsung ditolak.

Untuk production, lebih aman kalau IP-nya dibatasi:

```conf
hostssl    all             all             203.0.113.10/32          scram-sha-256
hostnossl  all             all             0.0.0.0/0               reject
```

Reload/restart cluster:

```bash
sudo pg_ctlcluster 16 main_dev restart
```

---

## 17. Cek Status Cluster

Cek semua cluster:

```bash
pg_lsclusters
```

Cek status cluster spesifik:

```bash
sudo pg_ctlcluster 16 main_dev status
```

Atau via systemd:

```bash
sudo systemctl status postgresql@16-main_dev
```

Reason:

Ini memastikan cluster `main_dev` benar-benar running di port yang benar, bukan cuma service PostgreSQL globalnya saja.

---

## 18. Testing Connection SSL dari Client

Testing dari server/client yang punya `rootCA.crt`:

```bash
psql "host=pg.akademiquality.com port=5433 dbname=postgres user=postgres sslmode=verify-full sslrootcert=/etc/postgresql/ssl/staging/rootCA.crt"
```

Reason:

`sslmode=verify-full` memastikan dua hal:

1. Koneksi terenkripsi.
2. Domain yang dikoneksikan cocok dengan certificate server.

Kalau kamu connect pakai IP, pastikan IP tersebut dimasukkan ke `server.ext` bagian SAN:

```conf
IP.1 = 202.10.35.45
```

Kalau tidak, `verify-full` bisa gagal karena hostname/IP tidak match dengan certificate.

---

## 19. Testing dari pgAdmin

Di pgAdmin, isi connection seperti ini:

### Tab General

```text
Name: PostgreSQL Main Dev
```

### Tab Connection

```text
Host name/address: pg.akademiquality.com
Port: 5433
Maintenance database: postgres
Username: postgres
Password: password_yang_sudah_dibuat
```

### Tab SSL

```text
SSL mode: Verify-Full
Root certificate: rootCA.crt
```

Reason:

pgAdmin perlu Root CA supaya bisa memverifikasi certificate PostgreSQL server. Kalau pakai `verify-full`, host yang kamu isi di pgAdmin harus sama dengan domain di certificate/SAN.

---

# Troubleshooting Umum

## 1. Port Bentrok

Cek port yang aktif:

```bash
sudo ss -lntp | grep postgres
```

Atau:

```bash
pg_lsclusters
```

Kalau port sudah dipakai cluster lain, ganti port cluster baru.

---

## 2. Tidak Bisa Remote Connect

Cek beberapa hal:

- `listen_addresses = '*'` sudah aktif.
- `pg_hba.conf` sudah mengizinkan IP client.
- Firewall sudah membuka port.
- DNS/subdomain sudah mengarah ke IP server.
- PostgreSQL sudah direstart setelah perubahan config.

---

## 3. SSL Verify-Full Gagal

Biasanya karena:

- Domain yang dipakai client tidak sama dengan `DNS.1` di `server.ext`.
- Client belum memakai `rootCA.crt` yang benar.
- Sertifikat sudah expired.
- Connect pakai IP, tapi IP belum dimasukkan ke SAN.

---

## 4. PostgreSQL Gagal Start Setelah Enable SSL

Cek log:

```bash
sudo journalctl -u postgresql@16-main_dev -xe
```

Atau cek log PostgreSQL:

```bash
sudo tail -f /var/log/postgresql/postgresql-16-main_dev.log
```

Masalah paling umum:

- Path certificate salah.
- File `server.key` permission terlalu terbuka.
- File SSL belum dimiliki user `postgres`.

---

# Best Practice Singkat

Untuk environment production, sebaiknya:

- Jangan biarkan `trust` aktif.
- Gunakan `scram-sha-256` untuk password auth.
- Batasi IP di `pg_hba.conf`, jangan asal `0.0.0.0/0` kalau tidak perlu.
- Gunakan SSL/TLS untuk koneksi remote.
- Simpan `rootCA.key` dengan sangat aman.
- Gunakan port berbeda untuk tiap cluster PostgreSQL.
- Dokumentasikan nama cluster, port, path config, dan domain yang dipakai.

---

# Ringkasan Command Penting

```bash
# Cek cluster
pg_lsclusters

# Buat cluster baru
sudo pg_createcluster 16 main_dev --port=5433 --start

# Restart cluster spesifik
sudo pg_ctlcluster 16 main_dev restart

# Reload cluster spesifik
sudo pg_ctlcluster 16 main_dev reload

# Login PostgreSQL cluster spesifik
psql -U postgres -h localhost -p 5433 -W

# Buka firewall
sudo ufw allow 5433/tcp

# Cek status cluster
sudo pg_ctlcluster 16 main_dev status
sudo systemctl status postgresql@16-main_dev
```

---

# Referensi

- PostgreSQL Documentation — Secure TCP/IP Connections with SSL: https://www.postgresql.org/docs/current/ssl-tcp.html
- PostgreSQL Documentation — The pg_hba.conf File: https://www.postgresql.org/docs/current/auth-pg-hba-conf.html
- PostgreSQL Documentation — Creating a Database Cluster: https://www.postgresql.org/docs/current/creating-cluster.html
- Ubuntu Manpage — pg_createcluster: https://manpages.ubuntu.com/manpages/trusty/man8/pg_createcluster.8.html
- Ubuntu Manpage — pg_ctlcluster: https://manpages.ubuntu.com/manpages/focal/man1/pg_ctlcluster.1.html
