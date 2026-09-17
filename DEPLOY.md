# DEPLOY — Locsy SPA (locsy.dev.medovf2h.beget.tech)

Регламент этого репозитория в инфраструктуре домашнего сервера.
Контуры (local / обкатка / dev) и все детали — [`docs/ENVIRONMENTS.md`](./docs/ENVIRONMENTS.md).
Инфраструктура стенда целиком — репозиторий `home-server-vps` (`docs/08-locsy.md`).

## Где живёт

- Домен: `locsy.dev.medovf2h.beget.tech` (A → `90.156.169.123`).
- Сервер: домашний Ubuntu `192.168.2.207`, каталог `/opt/projects/locsy`;
  этот репозиторий развёрнут как `/opt/projects/locsy/spa` (деплой-клон, ветка `master`).
- Путь запроса: интернет → VPS `90.156.169.123` (DNAT 80/443, SNAT, MSS-clamp) → WireGuard-туннель
  (`10.10.0.1` ↔ `10.10.0.2`) → Caddy дома (`10.10.0.2:80` / `:8443`, TLS) → `infra_net` →
  `locsy-web:80` → сборка SPA в контейнере `locsy-spa:80`.
- Порты на хост **не публикуются**: доступ только через Caddy.
- TLS: Let's Encrypt, сертификат выпускает Caddy автоматически (ACME HTTP-01 через внешний `:80`).

## Роль в проекте

- Фронтенд: Vue 3 + Quasar (Vite). API — `github.com/Eugenem84/locsy-laravel-backend`,
  БД — контейнер `locsy-db` (`postgres:16-alpine`, том `locsy_locsy_db_data`).
- SPA обращается к API относительными URL (`baseURL: '/'`), поэтому внешне всё работает по HTTPS
  на одном домене без CORS-костылей.
- Сборка образа: `Dockerfile` (`node:22-alpine` → `npm run build` → `nginx:alpine` + `dist/spa`).

## Секреты

- `spa/.env` на сервере содержит ключи сборки (Яндекс.Карты) — права `600`, в git не попадает.
- Ключи подставляются **на этапе сборки** образа: после правок `spa/.env` нужен
  `docker compose up -d --build locsy-spa`.
- Никогда не печатать содержимое `.env`, ключей и токенов в логах и отчётах.

## Сборка и деплой

```bash
cd /opt/projects/locsy

git -C spa pull                          # или git clone, если каталога ещё нет
docker compose up -d --build locsy-spa   # пересборка образа SPA
docker compose ps
```

Откат: `git -C spa checkout <предыдущий-коммит>` → `docker compose up -d --build locsy-spa`.

## Проверка

```bash
# локально на сервере (через Caddy, без DNS)
curl -sS -k -o /dev/null -w '%{http_code}\n' \
  --resolve locsy.dev.medovf2h.beget.tech:8443:10.10.0.2 \
  https://locsy.dev.medovf2h.beget.tech/

# снаружи — только с dev-vps
# (не с Mac: там активный VPN Happ; не с дома: провайдер подменяет SYN-ACK на закрытых портах)
ssh dev-vps "curl -sSI https://locsy.dev.medovf2h.beget.tech/ | head -3"   # HTTP/2 200
```

Полная проверка контура (SPA + API + Sanctum): `bash /opt/projects/locsy/smoke.sh`.

## Нельзя

- публиковать порты на хост, использовать `privileged` или `network_mode: host`;
- трогать чужие проекты (в частности Ledger-Craft: Traefik на `0.0.0.0:443`/`8080`,
  Postgres на `0.0.0.0:5433`) и любые диски, кроме диска ОС `/dev/sda5`;
- менять конфигурацию Caddy, не записав проект в `projects/REGISTRY.md` инфра-репозитория.
