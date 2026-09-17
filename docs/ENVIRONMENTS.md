# Среды и выкладка: local → обкатка → dev

> Канонический документ по контурам фронтенда Locsy: где что запускается, где задаётся домен
> и как проверить, что выкладка удалась. Инфраструктура обкаточного стенда описана в
> репозитории `home-server-vps` (`docs/08-locsy.md`, `.clinerules`).
> Связанные документы: [`../README.md`](../README.md), [`../DEPLOY.md`](../DEPLOY.md),
> контуры бэкенда — `locsy-laravel-backend/docs/ENVIRONMENTS.md`.

## 1. Контуры

|                 | **local (Mac)**                                                | **обкатка — домашний сервер**                                                         | **dev (цель выкладки)**                     |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| Адрес           | `http://localhost:9000` (`npm run dev`)                        | `https://locsy.dev.medovf2h.beget.tech`<br>A → `90.156.169.123`                       | `dev.medovf2h.beget.tech`<br>`217.114.0.27` |
| Где живёт       | локальный репозиторий                                          | `/opt/projects/locsy/spa` (git-клон этой ветки)                                       | Locsy туда ещё **не выкладывали**           |
| Что обслуживает | Quasar dev-сервер (Vite) + API (локальный бэкенд или MSW-моки) | `locsy-web` (nginx) → `locsy-spa` (сборка Quasar); API → `locsy-app`, БД → `locsy-db` | —                                           |
| Назначение      | разработка                                                     | **обкатка** фич и миграций на реальном домене и TLS                                   | будущий дев-контур                          |
| Данные          | моки или локальная БД (не жалко)                               | реальная PostgreSQL, том `locsy_locsy_db_data`                                        | —                                           |

**Правило.** Фича сначала проверяется на **обкатке** — smoke-тест
`bash /opt/projects/locsy/smoke.sh`, — и только потом выкладывается на **dev**.
Выкладки на dev, минуя обкатку, нет.

## 2. Обкаточный контур: схема

```
браузер → https://locsy.dev.medovf2h.beget.tech (A → 90.156.169.123)
        → VPS 90.156.169.123: только WireGuard + nftables (никакого Docker и прокси)
            DNAT 80  → 10.10.0.2:80     (HTTP + ACME HTTP-01 для Let's Encrypt)
            DNAT 443 → 10.10.0.2:8443   (HTTPS; домашний 443 занят чужим Traefik — не трогаем)
            SNAT (masquerade) для DNAT-потоков + MSS-clamp (MTU туннеля 1420)
        → WireGuard wgvps: VPS 10.10.0.1 ↔ дом 10.10.0.2 (инициатор — дом, keepalive 25)
        → Caddy дома: слушает только 10.10.0.2:80 и :8443, admin off, TLS Let's Encrypt
        → docker-сеть infra_net → locsy-web:80 (nginx проекта)
            /api/, /sanctum/, /storage/, /admin|livewire|filament|up, /js|/css/filament → locsy-app:80
            всё остальное (SPA: index.html, /assets, /icons)                           → locsy-spa:80
```

## 3. Что важно знать про обкаточный контур

- Домен: `locsy.dev.medovf2h.beget.tech`, A-запись → `90.156.169.123` (создаёт владелец вручную).
- Домашний сервер: Ubuntu 24.04, `192.168.2.207` (`enp4s0`), hostname `euegene-ubuntu-B450-AORUS-PRO`,
  каталог проекта `/opt/projects/locsy`.
- Контейнеры проекта: `locsy-web` (`nginx:alpine`), `locsy-app` (`webdevops/php-nginx:8.2`),
  `locsy-spa` (образ `locsy-spa:local` — сборка Quasar), `locsy-db` (`postgres:16-alpine`).
- Сети: `infra_net` (external; в ней живёт Caddy; подключён **только** `locsy-web`)
  и `locsy_net` (web/app/spa/db).
- Том БД: `locsy_locsy_db_data`; загруженные фото и аватары — `backend/storage/app/public` (bind-mount).
- **Порты проекта на хост не публикуются вообще** — ни в LAN, ни в интернет; наружу смотрит только
  Caddy на адресе туннеля. Проверка: `docker compose -f /opt/projects/locsy/compose.yml ps`.
- TLS терминирует Caddy (HTTP → HTTPS 301). Сертификат Let's Encrypt, ACME HTTP-01 идёт через внешний `:80`.
- Клиент во всех логах дома виден как `10.10.0.1` (на VPS включён SNAT — иначе WireGuard дома
  отбрасывает пакеты с чужими source-адресами). Реальные IP клиентов недоступны — это осознанный выбор.
- Бэкапов БД на обкаточном контуре пока нет (в инфра-проекте это этап 9) — данные обкатки считаем
  расходными, ценное сюда не складываем.

## 4. Где задаётся контур (SPA)

| Что               | Где                                                                          | Комментарий                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Адрес API         | `src/boot/axios.js` → `baseURL: '/'`                                         | относительные URL: домен задаёт окружение, а не сборка (`nginx/web.conf` на сервере разводит `/api/` и SPA) |
| Ключи Яндекс.Карт | `spa/.env` на сервере → `quasar.config.js` → `build.env`                     | нужны **только на этапе сборки образа**; в git не попадают (`.env` в `.gitignore`)                          |
| Ключ Геокодера    | `YANDEX_MAPS_API_KEY`                                                        | обратное геокодирование адресов локаций                                                                     |
| Ключ карты        | `YANDEX_MAPS_JS_API_KEY`                                                     | рисует карту; это **отдельный** ключ (сервис «JavaScript API и Geocoder»)                                   |
| Сборка образа     | `Dockerfile`                                                                 | `node:22-alpine` → `npm run build` → `nginx:alpine` + `dist/spa`                                            |
| Роутинг проекта   | `nginx/web.conf` на сервере (в инфра-репо — `projects/locsy/nginx/web.conf`) | `/api/`, `/sanctum/`, `/storage/`, `/admin`, `/livewire`, `/filament`, `/up` → Laravel, остальное → SPA     |

> Fallback-ключ JS API зашит в `src/boot/yandex-maps.js` и `quasar.config.js`. Пока в кабинете Яндекса
> не выпущены новые ключи (старые попали в публичный git — коммит `e66f232`) и не ограничены по домену,
> считать их скомпрометированными.

**Ключ JS API 3 обязан иметь заполненное «Ограничение по HTTP Referer»** — это требование Яндекса, а не
опция. В списке доменов должны быть все контуры, где рисуется карта:

```
localhost                                   # локальная разработка (npm run dev, :9000/:9001)
locsy.dev.medovf2h.beget.tech               # обкатка
dev.medovf2h.beget.tech                     # будущий dev-контур
```

Домены указываются по одному в строке, без схемы и порта; поддомены добавляются автоматически;
изменения вступают в силу в течение ~15 минут. Если домена нет в списке, скрипт API отдаёт
`403 {"statusCode":403,"message":"Invalid api key"}`, карта не инициализируется (в консоли — пустой
контейнер без явных ошибок). Ключ в бандл подставляется на этапе `quasar build`, поэтому после правок
`spa/.env` нужна пересборка образа.

## 5. Доступ

```bash
# домашний сервер (Ubuntu за VPS-шлюзом)
ssh euegene@192.168.2.207

# проверка Caddy локально, без DNS
curl -sS -k --resolve locsy.dev.medovf2h.beget.tech:8443:10.10.0.2 \
  https://locsy.dev.medovf2h.beget.tech/up
```

Снаружи проверяем **только** с `dev-vps` (217.114.0.27, host `mbmpuqvzic`):

```bash
ssh dev-vps 'curl -sSI -m 10 https://locsy.dev.medovf2h.beget.tech/ | head -3'
```

Не проверять «снаружи» с Mac (активный VPN Happ искажает результат) и с домашнего сервера
(провайдер подменяет SYN-ACK на закрытых портах).

## 6. Выкладка и обновление SPA

```bash
cd /opt/projects/locsy

git -C spa pull                                  # этот репозиторий (ветка master)
docker compose up -d --build locsy-spa           # пересборка образа SPA (ключи берутся из spa/.env)
docker compose up -d                             # подхватить изменения целиком
docker compose ps

bash /opt/projects/locsy/smoke.sh                # проверка целиком (SPA + API + Sanctum)
```

Откат: `git -C spa checkout <предыдущий-коммит>` → `docker compose up -d --build locsy-spa`.

## 7. Проверка выкладки

```bash
# на сервере: локально через Caddy
curl -sS -k -o /dev/null -w '%{http_code}\n' \
  --resolve locsy.dev.medovf2h.beget.tech:8443:10.10.0.2 \
  https://locsy.dev.medovf2h.beget.tech/

# снаружи (только с dev-vps)
ssh dev-vps 'curl -sSI -m 10 https://locsy.dev.medovf2h.beget.tech/ | head -3'           # HTTP/2 200
ssh dev-vps 'curl -sS  -m 10 https://locsy.dev.medovf2h.beget.tech/up'                   # 200
ssh dev-vps 'curl -sS  -m 10 https://locsy.dev.medovf2h.beget.tech/api/cities | head -c 200'
ssh dev-vps 'curl -sS -o /dev/null -w "%{http_code}\n" https://locsy.dev.medovf2h.beget.tech/admin'  # 302 → /admin/login
```

Ожидаемо: `/` → 200 с `<title>Locsy</title>` и живыми `/assets/index-*.js`, `/up` → 200,
`/api/cities` → 200 с городами из PostgreSQL, `/admin` → 302 на **https**-страницу входа Filament.

## 8. Известные грабли

- **Дев-сервер `:9000` проксирует `/api` и `/sanctum` на бэкенд.** Прописано в
  `quasar.config.js` → `devServer.proxy` (target `http://localhost` — сервис nginx бэкенда).
  Со стороны бэкенда должны совпадать `FRONTEND_URL=http://localhost:9000` и
  `SANCTUM_STATEFUL_DOMAINS=localhost:9000`. Без запущенного бэкенда запросы упадут с ошибкой
  соединения — для работы без API есть MSW-моки (`src/boot/msw.js`, в списке `boot` сейчас
  закомментирован).
- **Маркеры карты создаются императивно.** Компонент `<YandexMapMarker>` из `vue-yandex-maps@2.3.2`
  после создания маркера удаляет его DOM: проверка `closest('ymaps')` не находит контейнер, потому
  что текущий JS API рендерит карту тегом `ymaps3`. Симптом — маркеров нет и ошибок в консоли нет,
  при этом данные в стор приходят. Поэтому в `YandexMapView.vue` маркеры создаются напрямую через
  `new ymaps3.YMapMarker(...)` (`syncMarkers` / `createMarkerElement`), а не компонентом плагина.
  При апгрейде `vue-yandex-maps` до 3.x это стоит перепроверить.
- **Объект карты хранится в `shallowRef`, а не в `ref`.** Обычный `ref` заворачивает `YMap` в
  реактивный Proxy, и его геттеры (`bounds` и прочие) падают с «Cannot read private member from an
  object whose class did not declare it». События карты вешаются через `YandexMapListener` (у
  `<YandexMap>` нет emits `ready`/`click`/`update`), а координаты из API (строки из `DECIMAL`)
  приводятся к числам — ymaps3 ждёт числа.
- **`smoke.sh --local`** прогоняет проверки напрямую на Caddy дома: быстро, но cookie-путь Sanctum
  вернёт `401` — в `Referer` появляется порт `:8443`, которого нет в `SANCTUM_STATEFUL_DOMAINS`.
  Для честной проверки авторизации используйте режим по умолчанию (через публичный домен).
- **После правок `spa/.env` нужна пересборка образа** `locsy-spa`: ключи подставляются на этапе
  `quasar build`, а не на старте контейнера.
- **Ключи Яндекса** — см. предупреждение в §4 (нужна ротация и ограничение по домену).
- **Фото не открываются** (`/storage/...` → 404 или mixed content) — смотреть `nginx/web.conf`
  (маршрут `/storage/`) и `trustProxies` в бэкенде, а не SPA.
- **Ширина списка городов зафиксирована.** `QSelect` открывает меню с `fit` (по умолчанию
  `menu-shrink=false`): position-engine Quasar ставит меню inline `min-width` по ширине поля и
  сбрасывает inline `max-width`, поэтому меню считается «shrink-to-fit» и растягивается по самому
  длинному названию. Ширину держит класс `.city-popup` (`src/css/app.scss`, передаётся в
  `popup-content-class` у селекта). Само поле (`.city-select` в `MainLayout.vue`) не должно брать
  ширину от контента: на мобильных `width: auto` в flex-строке давал ширину по выбранному городу,
  из-за чего пересобиралась вся шапка.
- **Названия городов приходят из API с регионом в скобках** («Новосибирск (Новосибирская область)»).
  Для отображения их сокращает `formatCityName()` (`src/utils/city-name.js`): «область» → «обл.»,
  «Республика» → «Респ». Если в списке появляется мусор вида «Москох» или «Одинтсово» — правьте
  бэкенд, см. `locsy-laravel-backend/docs/ENVIRONMENTS.md` (§9).
- **Ссылок на «забыли пароль» две: страница и письмо.** Письмо ведёт на
  `<FRONTEND_URL>/#/reset-password?token=…&email=…`: роутер SPA работает в hash-режиме
  (`quasar.config.js` → `build.vueRouterMode: 'hash'`), поэтому обычный путь без «#»
  отдаст 404 от nginx. Плюс токен остаётся во фрагменте и не попадает в логи.
  Если после письма ссылка ведёт на `localhost:9000` — на контуре неверный `FRONTEND_URL`.
- **Сброс пароля меняет состояние аккаунта.** После успешной смены пароля бэкенд
  отзывает все токены Sanctum и удаляет сессии, поэтому в браузере нужно войти заново
  (SPA специально не логинит автоматически и уводит на `/login`). Ошибку «ссылка
  недействительна/устарела» бэкенд отдаёт как `422` без ошибок полей — страница
  `/reset-password` по этому признаку показывает ссылку «Запросить новую».

## 9. Что нужно, чтобы выложить Locsy на dev (`dev.medovf2h.beget.tech`)

- [ ] решить, что переносим: контейнеры целиком, только код или код + дамп БД;
- [ ] A-запись уже есть (`dev.*` → 217.114.0.27), но уточнить, не занят ли этот хост другим проектом;
- [ ] свои секреты на dev: `APP_KEY`, пароль БД, `spa/.env` со **новыми** ключами Яндекса,
      ограниченными по домену `dev.medovf2h.beget.tech`;
- [ ] TLS на dev (на домашнем контуре сертификат выпускает Caddy автоматически);
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, `SESSION_SECURE_COOKIE=true`, корректные
      `APP_URL` / `FRONTEND_URL` / `SANCTUM_STATEFUL_DOMAINS` / `SESSION_DOMAIN`;
- [ ] бэкап БД перед переносом (на домашнем контуре бэкапов пока нет);
- [ ] **важно:** `dev-vps` сейчас используется как независимый наблюдатель для внешних проверок.
      Если Locsy переедет на него, проверки «снаружи» нужно будет делать с другого хоста.

## 10. Ограничения (нельзя)

- публиковать порты проектов на хост; `privileged`; `network_mode: host` без обоснования;
- трогать чужие проекты: `ledger_craft_*` (Traefik на `0.0.0.0:443`/`8080`, Postgres на `0.0.0.0:5433`,
  том `test28_postgresql_data`) и системный PostgreSQL на `127.0.0.1:5432`;
- использовать любые диски, кроме диска ОС (`/dev/sda5`): `/dev/sdb1` и `/dev/sda3` не монтируем;
- печатать содержимое `.env`, ключей и токенов в логах и отчётах;
- перезагружать серверы и чистить Docker (`system prune`, `autoremove`) без отдельного согласия.
