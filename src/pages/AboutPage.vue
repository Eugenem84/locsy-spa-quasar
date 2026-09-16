<template>
  <q-page class="about-page">
    <section class="hero bg-gradient-primary text-white q-pa-lg">
      <div class="hero-inner">
        <q-badge color="accent" text-color="white" class="q-mb-md">О проекте</q-badge>
        <h1 class="text-h3 text-weight-bold q-my-none">
          Locsy — места для фотосессий в вашем городе и в путешествиях
        </h1>
        <p class="text-h6 text-weight-regular q-mt-md q-mb-lg hero-lead">
          Карта фотогеничных локаций, галереи реальных снимков и фотографы,
          которые на этих местах работают.
        </p>
        <div class="row q-gutter-sm">
          <q-btn
            color="accent"
            text-color="white"
            no-caps
            size="lg"
            icon="explore"
            label="Найти место на карте"
            to="/"
          />
          <q-btn
            outline
            color="white"
            no-caps
            size="lg"
            icon="camera_alt"
            label="Я фотограф"
            to="/register"
          />
        </div>
      </div>
    </section>

    <div class="page-body">
      <h2 class="text-h4 text-weight-bold q-mt-xl q-mb-md text-center">Кому это нужно</h2>
      <div class="row q-col-gutter-md justify-center">
        <div v-for="audience in audiences" :key="audience.title" class="col-12 col-md-4">
          <q-card flat bordered class="full-height audience-card">
            <q-card-section>
              <q-icon :name="audience.icon" size="36px" color="primary" />
              <div class="text-h6 q-mt-sm">{{ audience.title }}</div>
              <p class="text-body2 text-grey-8 q-mb-none">{{ audience.text }}</p>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <h2 class="text-h4 text-weight-bold q-mt-xl q-mb-md text-center">Как это работает</h2>
      <div class="row q-col-gutter-md">
        <div v-for="(step, index) in steps" :key="step.title" class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="full-height step-card">
            <q-card-section>
              <div class="text-h5 text-weight-bold text-accent q-mb-sm">{{ index + 1 }}</div>
              <div class="text-subtitle1 text-weight-medium">{{ step.title }}</div>
              <p class="text-body2 text-grey-8 q-mb-none">{{ step.text }}</p>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <q-card flat class="moderation-card q-mt-xl">
        <q-card-section class="row q-col-gutter-lg items-center">
          <div class="col-12 col-md-7">
            <div class="row items-center no-wrap q-mb-sm">
              <q-icon name="verified_user" size="30px" color="accent" class="q-mr-sm" />
              <div class="text-h5 text-weight-bold">Модерация — обязательна</div>
            </div>
            <p class="text-body1 q-mb-sm">
              В каталог попадает только проверенный контент. Каждую локацию и каждое фото
              смотрит модератор: без запрещённых материалов, без мусора и без «фотографий
              ради фотографий». Автор видит статус заявки и причину отказа в своём профиле.
            </p>
            <ul class="moderation-list">
              <li>Локация проходит проверку перед публикацией в каталоге</li>
              <li>Фотографии появляются в галерее только после одобрения</li>
              <li>Отклонённые материалы не исчезают бесследно — автор понимает, что не так</li>
            </ul>
          </div>
          <div class="col-12 col-md-5">
            <div class="row q-col-gutter-sm">
              <div v-for="badge in moderationBadges" :key="badge.label" class="col-12">
                <q-card flat bordered class="q-pa-sm row items-center no-wrap">
                  <q-icon :name="badge.icon" :color="badge.color" size="22px" class="q-mr-sm" />
                  <div>
                    <div class="text-subtitle2">{{ badge.label }}</div>
                    <div class="text-caption text-grey-7">{{ badge.text }}</div>
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <h2 class="text-h4 text-weight-bold q-mt-xl q-mb-md text-center">Фотографам</h2>
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-sm">Что даёт профиль фотографа</div>
              <ul class="feature-list">
                <li>Страница-портфолио, на которую можно скинуть ссылку клиенту</li>
                <li>Работы собираются из ваших фото по локациям — автоматически</li>
                <li>Карта «где я снимал»: клиент видит ваши точки съёмок в городах</li>
                <li>Типы съёмок и контакты (Instagram, Telegram, VK, сайт)</li>
                <li>Ваши фото в галереях локаций с подписью и ссылкой на вас</li>
              </ul>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <div class="text-h6 q-mb-sm">Модель проекта</div>
              <p class="text-body2 text-grey-8">
                Сейчас размещение профиля фотографа бесплатное: мы наполняем каталог и
                проверяем, что инструмент полезен. Дальше появится платное размещение —
                продвижение в своём городе и закреплённые подборки.
              </p>
              <q-separator class="q-my-md" />
              <div class="text-subtitle2 q-mb-xs">Уже сейчас</div>
              <div class="row q-gutter-xs q-mb-md">
                <q-chip dense color="primary" text-color="white" icon="check">Портфолио</q-chip>
                <q-chip dense color="primary" text-color="white" icon="check">Карта съёмок</q-chip>
                <q-chip dense color="primary" text-color="white" icon="check">Контакты</q-chip>
              </div>
              <div class="text-subtitle2 q-mb-xs">Дальше</div>
              <div class="row q-gutter-xs">
                <q-chip dense outline color="accent" icon="schedule">Платный профиль</q-chip>
                <q-chip dense outline color="accent" icon="schedule">Продвижение в городе</q-chip>
                <q-chip dense outline color="accent" icon="schedule">Подборки для клиентов</q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <h2 class="text-h4 text-weight-bold q-mt-xl q-mb-md text-center">Как это сделано</h2>
      <div class="row q-col-gutter-md justify-center">
        <div v-for="tech in techStack" :key="tech.title" class="col-12 col-sm-6 col-md-3">
          <q-card flat bordered class="full-height">
            <q-card-section>
              <q-icon :name="tech.icon" size="28px" color="primary" />
              <div class="text-subtitle1 text-weight-medium q-mt-xs">{{ tech.title }}</div>
              <div class="text-caption text-grey-7">{{ tech.text }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div class="text-center q-mt-xl q-mb-xl">
        <q-btn
          color="primary"
          no-caps
          size="lg"
          icon="explore"
          label="Смотреть локации"
          to="/"
          class="q-mr-sm"
        />
        <q-btn
          outline
          color="primary"
          no-caps
          size="lg"
          icon="person_add"
          label="Создать профиль"
          to="/register"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
const audiences = [
  {
    icon: 'map',
    title: 'Путешественникам',
    text: 'Приехали в новый город — открыли карту, выбрали места для прогулки и съёмки, сохранили в избранное.'
  },
  {
    icon: 'camera_alt',
    title: 'Фотографам',
    text: 'Находите локации под запрос клиента, ведите портфолио и делитесь ссылкой на свою страницу.'
  },
  {
    icon: 'favorite',
    title: 'Клиентам фотографов',
    text: 'Смотрите, где и как снимает автор, сравнивайте портфолио и связывайтесь напрямую.'
  }
]

const steps = [
  { title: 'Выберите город', text: 'Или сразу двигайте карту — локации подгружаются по видимой области.' },
  { title: 'Найдите место', text: 'Фильтры по категориям: парк, музей, смотровая площадка, пляж и другие.' },
  { title: 'Посмотрите снимки', text: 'Галереи собраны из фотографий пользователей и фотографов.' },
  { title: 'Сохраните и вернитесь', text: 'Добавьте место в избранное и откройте его, когда соберётесь снимать.' }
]

const moderationBadges = [
  { icon: 'hourglass_top', color: 'warning', label: 'На модерации', text: 'Материал проверяется модератором' },
  { icon: 'check_circle', color: 'positive', label: 'Опубликовано', text: 'Видно всем в каталоге' },
  { icon: 'cancel', color: 'negative', label: 'Отклонено', text: 'С причиной отказа для автора' }
]

const techStack = [
  { icon: 'map', title: 'Яндекс.Карты', text: 'Карта, маркеры и выбор точки для новых локаций' },
  { icon: 'bolt', title: 'Quasar + Vue 3', text: 'SPA с адаптивным интерфейсом' },
  { icon: 'dns', title: 'Laravel API', text: 'REST API, Sanctum-авторизация, очередь модерации' },
  { icon: 'shield', title: 'Sanctum + Docker', text: 'Сессии, CSRF-защита и контейнерный деплой' }
]
</script>

<style scoped>
.about-page {
  background: #f6f8fb;
}

.hero {
  padding: 64px 16px 72px;
}

.hero-inner {
  max-width: 900px;
  margin: 0 auto;
}

.hero-lead {
  opacity: 0.92;
  max-width: 720px;
}

.page-body {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 16px;
}

.audience-card,
.step-card {
  border-radius: 14px;
}

.moderation-card {
  border-radius: 16px;
  border-left: 4px solid #f97316;
  background: #ffffff;
  box-shadow: 0 6px 24px rgba(5, 39, 71, 0.08);
}

.moderation-list,
.feature-list {
  margin: 0;
  padding-left: 20px;
}

.moderation-list li,
.feature-list li {
  margin-bottom: 6px;
}
</style>
