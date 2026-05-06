---
title: "Golang Migrate Dengan PostgreSQL"
date: "2026-05-06"
excerpt: "Cara melakukan migration di golang dengan database postgresql"
tags: ["Database", "Software Development"]
---

## Setup Migration Go + PostgreSQL dengan golang-migrate

Kalau kamu pakai Go dan PostgreSQL, `golang-migrate` adalah pilihan paling straightforward untuk handle database migration. Ini setup-nya dari awal.

---

## Install Dependency

```bash
go get github.com/golang-migrate/migrate/v4
go get github.com/golang-migrate/migrate/v4/database/postgres
go get github.com/golang-migrate/migrate/v4/source/file
```

Kenapa `golang-migrate`? Beberapa alasan:

- **Battle-tested** - library ini sudah dipakai luas di production, bukan proyek experimental.
- **Support banyak database** - PostgreSQL, MySQL, SQLite, dan lainnya pakai interface yang sama.
- **File-based migration** - migration disimpan sebagai file `.sql` biasa, bukan embedded di kode Go. Ini penting supaya migration bisa di-review lewat pull request seperti perubahan kode biasa.
- **Versioning otomatis** - setiap migration punya timestamp unik, jadi urutan eksekusi selalu konsisten di semua environment.

---

## Konfigurasi Environment

Buat file `.env` di root project, isi dengan connection string PostgreSQL kamu:

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/subscription?sslmode=disable
```

Pastikan `.env` sudah masuk `.gitignore` supaya tidak ikut ter-commit.

Format connection string:

```text
postgres://<username>:<password>@<host>:<port>/<database>?sslmode=disable
```

Contoh penyesuaian:

- `postgres`: username database
- `password`: password database
- `localhost`: host database
- `5432`: port PostgreSQL
- `subscription`: nama database

---

## Struktur Folder

```text
src/
  cmd/
    migrate/
      main.go         <- CLI untuk jalankan migration manual
  internal/
    databases/
      migrate.go      <- helper migrator
      migrations/
        20260506153350_create_users_table.up.sql
        20260506153350_create_users_table.down.sql
```

Struktur ini mengikuti prinsip **Clean Architecture** - setiap lapisan punya tanggung jawab yang jelas dan tidak saling bergantung sembarangan.

- **`cmd/migrate/main.go`** adalah *entrypoint* - tugasnya hanya menerima perintah dari CLI dan meneruskannya ke layer di bawah. Tidak ada logic bisnis di sini.
- **`internal/databases/migrate.go`** adalah *infrastructure layer* - semua urusan teknis koneksi ke database dan eksekusi migration dikurung di sini. Kalau suatu saat kamu ganti library migration, cukup ubah file ini, bagian lain tidak terpengaruh.
- **`internal/databases/migrations/*.sql`** adalah *data layer* - murni berisi definisi perubahan skema database, tanpa logic Go sama sekali.

Dengan pemisahan ini, kode tetap mudah di-maintain dan di-test seiring project berkembang.

---

## File yang Terlibat

Bagian ini berisi contoh isi file yang dipakai untuk setup migration.

### `src/internal/databases/migrate.go`

File ini bertugas membuat migrator dan menyediakan function untuk menjalankan migration.

```go
package databases

import (
	"errors"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

const DefaultMigrationPath = "src/internal/databases/migrations"

func NewMigrator(databaseURL string) (*migrate.Migrate, error) {
	return migrate.New("file://"+DefaultMigrationPath, databaseURL)
}

func MigrateUp(databaseURL string) error {
	m, err := NewMigrator(databaseURL)
	if err != nil {
		return err
	}

	err = m.Up()
	if errors.Is(err, migrate.ErrNoChange) {
		return nil
	}

	return err
}

func MigrateDown(databaseURL string) error {
	m, err := NewMigrator(databaseURL)
	if err != nil {
		return err
	}

	err = m.Down()
	if errors.Is(err, migrate.ErrNoChange) {
		return nil
	}

	return err
}

func MigrateSteps(databaseURL string, steps int) error {
	m, err := NewMigrator(databaseURL)
	if err != nil {
		return err
	}

	err = m.Steps(steps)
	if errors.Is(err, migrate.ErrNoChange) {
		return nil
	}

	return err
}
```

Poin penting:

- Import `database/postgres` dan `source/file` menggunakan blank import `_` karena driver hanya perlu diregister.
- `DefaultMigrationPath` harus sesuai dengan lokasi folder migration.
- `migrate.ErrNoChange` dianggap bukan error karena artinya database sudah berada di versi terbaru.

### `src/cmd/migrate/main.go`

File ini adalah CLI manual untuk membuat dan menjalankan migration.

```go
package main

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/AgufSamudra/subscription/src/internal/databases"
)

const envFile = ".env"

func main() {
	if err := loadEnvFile(envFile); err != nil {
		log.Fatal(err)
	}

	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	command := os.Args[1]
	databaseURL := os.Getenv("DATABASE_URL")

	switch command {
	case "create":
		if len(os.Args) < 3 {
			log.Fatal("migration name is required")
		}
		if err := createMigrationFiles(os.Args[2]); err != nil {
			log.Fatal(err)
		}
	case "up":
		requireDatabaseURL(databaseURL)
		if err := databases.MigrateUp(databaseURL); err != nil {
			log.Fatal(err)
		}
		log.Println("migration up completed")
	case "down":
		requireDatabaseURL(databaseURL)
		if err := databases.MigrateDown(databaseURL); err != nil {
			log.Fatal(err)
		}
		log.Println("migration down completed")
	case "steps":
		requireDatabaseURL(databaseURL)
		if len(os.Args) < 3 {
			log.Fatal("steps value is required")
		}
		steps, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatal(err)
		}
		if err := databases.MigrateSteps(databaseURL, steps); err != nil {
			log.Fatal(err)
		}
		log.Println("migration steps completed")
	case "version":
		requireDatabaseURL(databaseURL)
		m, err := databases.NewMigrator(databaseURL)
		if err != nil {
			log.Fatal(err)
		}
		version, dirty, err := m.Version()
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("migration version: %d, dirty: %t\n", version, dirty)
	default:
		printUsage()
		os.Exit(1)
	}
}
```

Bagian CLI ini membaca command dari `os.Args`, contohnya:

- `create`
- `up`
- `down`
- `steps`
- `version`

Helper lain yang ada di file ini:

- `requireDatabaseURL`: memastikan `DATABASE_URL` sudah ada.
- `createMigrationFiles`: membuat file `.up.sql` dan `.down.sql` otomatis berdasarkan timestamp.
- `loadEnvFile`: membaca file `.env` sederhana dan memasukkan nilainya ke environment.
- `printUsage`: menampilkan daftar command yang tersedia.

---

## Membuat Migration Baru

Jalankan command ini dari root project:

```bash
go run ./src/cmd/migrate create create_users_table
```

Command ini otomatis generate dua file dengan timestamp sebagai prefix:

```text
<timestamp>_create_users_table.up.sql   <- perubahan
<timestamp>_create_users_table.down.sql <- rollback
```

Gunakan:

- `.up.sql` untuk perubahan saat migration dijalankan
- `.down.sql` untuk rollback perubahan

---

## Contoh: Tabel Users

Migration register/login membuat tabel `users`.

### `20260506153350_create_users_table.up.sql`

File `.up.sql` dijalankan saat migration naik.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_email_not_empty CHECK (length(trim(email)) > 0),
    CONSTRAINT users_full_name_not_empty CHECK (length(trim(full_name)) > 0),
    CONSTRAINT users_password_hash_not_empty CHECK (length(trim(password_hash)) > 0)
);

CREATE INDEX users_email_idx ON users (email);
```

Penjelasan kolom:

- `id`: primary key UUID, dibuat otomatis oleh PostgreSQL.
- `full_name`: nama user untuk kebutuhan register/profile.
- `email`: email untuk login, dibuat unique.
- `password_hash`: hasil hash password, bukan password asli.
- `is_active`: status akun user.
- `last_login_at`: waktu terakhir user berhasil login.
- `created_at`: waktu data dibuat.
- `updated_at`: waktu data terakhir diubah.

### `20260506153350_create_users_table.down.sql`

File `.down.sql` dijalankan saat rollback.

```sql
DROP INDEX IF EXISTS users_email_idx;
DROP TABLE IF EXISTS users;
```

---

## Menjalankan Migration

| Command | Fungsi |
|---|---|
| `go run ./src/cmd/migrate up` | Jalankan semua migration yang belum dijalankan |
| `go run ./src/cmd/migrate down` | Rollback semua migration |
| `go run ./src/cmd/migrate steps 1` | Maju satu step |
| `go run ./src/cmd/migrate steps -1` | Mundur satu step |
| `go run ./src/cmd/migrate version` | Cek versi migration saat ini |

Migration **tidak berjalan otomatis** saat aplikasi start. Ini keputusan yang disengaja - menjalankan migration otomatis di production berisiko, terutama kalau ada migration yang destructive atau butuh waktu lama dan memblokir tabel. Dengan menjalankannya manual, kamu punya kontrol penuh atas kapan dan bagaimana skema database berubah.
