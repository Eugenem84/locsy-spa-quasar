<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      v-if="$route.name !== 'Location' && $route.name !== 'PhotographerProfile'"
      elevated
      class="bg-gradient-primary"
    >
      <q-toolbar class="q-py-sm header-toolbar">
        <BrandLogo />

        <div class="row items-center q-ml-md gt-xs">
          <q-btn flat dense no-caps icon="explore" label="Карта" to="/" />
          <q-btn flat dense no-caps icon="info" label="О проекте" to="/about" />
        </div>
        <q-btn class="lt-sm q-ml-sm" flat dense round icon="info" to="/about" aria-label="О проекте" />

        <q-space />

        <q-select
          v-model="cityStore.selectedCity"
          :options="cityStore.cities"
          option-label="name"
          label="Город"
          dense
          outlined
          dark
          clearable
          behavior="menu"
          :options-dark="false"
          popup-content-class="select-popup city-popup"
          class="city-select q-mr-sm"
          @popup-show="() => cityStore.fetchCities()"
        >
          <template v-slot:before-options>
            <q-item>
              <q-item-section>
                <q-input
                  dense
                  autofocus
                  hide-bottom-space
                  color="primary"
                  placeholder="Поиск города..."
                  debounce="300"
                  @update:model-value="(val) => cityStore.fetchCities(val)"
                />
              </q-item-section>
            </q-item>
          </template>
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">Город не найден</q-item-section>
            </q-item>
          </template>
        </q-select>

        <div v-if="authStore.isLoggedIn">
          <q-btn-dropdown flat no-caps>
            <template v-slot:label>
              <div class="row items-center no-wrap">
                <q-avatar size="32px" class="avatar-ring">
                  <img v-if="authStore.user?.avatar" :src="authStore.user.avatar" />
                  <q-icon v-else name="account_circle" />
                </q-avatar>
              </div>
            </template>
            <q-list style="min-width: 220px">
              <q-item-label header class="text-grey-7">
                {{ authStore.userName || 'Профиль' }}
              </q-item-label>
              <q-item
                v-if="!authStore.isEmailVerified"
                clickable
                v-close-popup
                to="/verify-email"
              >
                <q-item-section avatar><q-icon name="mark_email_unread" /></q-item-section>
                <q-item-section><q-item-label>Подтвердить почту</q-item-label></q-item-section>
              </q-item>
              <q-item clickable v-close-popup to="/favorites">
                <q-item-section avatar><q-icon name="favorite" /></q-item-section>
                <q-item-section><q-item-label>Избранное</q-item-label></q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="openCreateLocationDialog">
                <q-item-section avatar><q-icon name="add_location_alt" /></q-item-section>
                <q-item-section><q-item-label>Добавить локацию</q-item-label></q-item-section>
              </q-item>
              <q-item v-if="authStore.isPhotographer" clickable v-close-popup @click="openSelfPage">
                <q-item-section avatar><q-icon name="camera_alt" /></q-item-section>
                <q-item-section><q-item-label>Моя страница</q-item-label></q-item-section>
              </q-item>
              <q-item clickable @click="profileModalOpen = true">
                <q-item-section avatar><q-icon name="manage_accounts" /></q-item-section>
                <q-item-section><q-item-label>Профиль</q-item-label></q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="logout">
                <q-item-section avatar><q-icon name="logout" /></q-item-section>
                <q-item-section><q-item-label>Выход</q-item-label></q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div v-else class="row no-wrap items-center">
          <q-btn flat no-caps label="Войти" to="/login" />
          <q-btn outline no-caps label="Регистрация" to="/register" class="q-ml-sm gt-xs" />
        </div>
      </q-toolbar>

      <!-- Пока почта не подтверждена, функции аккаунта закрыты: напоминаем -->
      <q-banner
        v-if="authStore.isLoggedIn && !authStore.isEmailVerified"
        dense
        class="bg-orange-9 text-white"
      >
        <template v-slot:avatar><q-icon name="mark_email_unread" /></template>
        Подтвердите почту — пока адрес не подтверждён, избранное, локации и фото недоступны.
        <template v-slot:action>
          <q-btn flat dense no-caps label="Подтвердить" to="/verify-email" />
        </template>
      </q-banner>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Мелкая ссылка обратной связи в углу: сообщить об ошибке или
         предложить улучшение. Стоит поверх карты и её панелей. -->
    <q-btn
      class="feedback-trigger"
      flat
      dense
      no-caps
      size="sm"
      icon="bug_report"
      label="Сообщить об ошибке"
      aria-label="Обратная связь: сообщить об ошибке или предложить улучшение"
      @click="feedbackModalOpen = true"
    />

    <q-dialog v-model="feedbackModalOpen">
      <FeedbackDialog @close="feedbackModalOpen = false" />
    </q-dialog>

    <q-dialog v-model="profileModalOpen">
      <UserProfile @close="profileModalOpen = false" />
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCityStore } from 'stores/city.js'
import { useAuthStore } from 'stores/auth-store'
import BrandLogo from 'components/BrandLogo.vue'
import UserProfile from 'components/UserProfile.vue'
import FeedbackDialog from 'components/FeedbackDialog.vue'

const router = useRouter()
const cityStore = useCityStore()
const authStore = useAuthStore()
const profileModalOpen = ref(false)
const feedbackModalOpen = ref(false)

function openCreateLocationDialog() {
  router.push({ path: '/', query: { picking: 'true' } })
}

function openSelfPage() {
  if (authStore.user) {
    router.push({ name: 'PhotographerProfile', params: { id: authStore.user.id } })
  }
}

async function logout() {
  await authStore.handleLogout()
  router.push('/')
}

onMounted(async () => {
  await authStore.fetchUser()
  await cityStore.fetchCities()
})

// Подставляем город пользователя, когда загрузились и он сам, и справочник городов.
// Если город уже выбран, второй раз его не трогаем: каждый перезапрос справочника
// (поиск в селекте) приносит новые объекты, а подмена выбранного города
// без нужды перерисовывает карту и список локаций.
function applyUserCity() {
  const userCityId = authStore.user?.city_id
  if (!userCityId || !cityStore.cities.length) return
  if (cityStore.selectedCity?.id === userCityId) return
  const userCity = cityStore.cities.find((c) => c.id === userCityId)
  if (userCity) cityStore.setSelectedCity(userCity)
}

watch(() => [authStore.user, cityStore.cities.length], applyUserCity, { immediate: true })
</script>

<style scoped>
.city-select {
  /* Фиксированная ширина: селект не должен подстраиваться под длину названия
     города — иначе от выбранного города «дёргается» вся шапка (и карта под ней).
     Не влезающее название обрезаем многоточием, см. правила ниже. */
  flex: 0 1 auto;
  width: 280px;
  min-width: 150px;
}

/* Значение поля всегда в одну строку и не растягивает поле */
.city-select :deep(.q-field__native) {
  flex-wrap: nowrap;
  overflow: hidden;
}

.city-select :deep(.q-field__native > .ellipsis) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Шапка: логотип должен стоять ближе к краю — уменьшаем отступ тулбара */
.header-toolbar {
  padding-left: 6px;
}

/* Логотип-локап (эмблема + вордмарк «getlocsy») живёт в components/BrandLogo.vue:
   он сам держит flex: 0 0 auto и высоту эмблемы, поэтому здесь стилей не нужно. */

/* На телефоне селект города не должен съедать всю шапку */
@media (max-width: 599px) {
  .city-select {
    /* Ширина считается от свободного места в шапке, а не от длины названия города */
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    max-width: 42vw;
    font-size: 13px;
  }
}

/* Аватар в шапке: оранжевое кольцо вокруг круглого фото.
   Кольцо рисуем псевдоэлементом, а не через border+padding на .q-avatar:
   у QAvatar картинка наследует размеры родителя (в quasar.css —
   `.q-avatar img { height: inherit; width: inherit }`), а глобальный сброс
   Quasar использует `box-sizing: border-box`. Из-за этого border и padding
   не растягивали кружок, а уменьшали контентную область, картинка оставалась
   32px и выезжала из кольца вправо-вниз — фото и кольцо не совпадали.
   Псевдоэлемент растянут отрицательными top/right/bottom/left, поэтому кольцо
   всегда концентрично фото и высоту шапки не меняет. */
.avatar-ring {
  /* flex: none — иначе в узкой шапке бокс аватара мог сжаться, а картинка нет */
  flex: none;
}

.avatar-ring::after {
  content: '';
  position: absolute;
  /* 2px зазор между фото и кольцом + 2px толщина самого кольца */
  top: -4px;
  right: -4px;
  bottom: -4px;
  left: -4px;
  border: 2px solid #ea580c;
  border-radius: 50%;
  pointer-events: none;
}

/* Ссылка обратной связи: мелкая и ненавязчивая, в правом нижнем углу.
   z-index выше карты и её оверлеев (у них до 1000), чтобы ссылка всегда
   была доступна. Правый угол выбран потому, что слева Яндекс.Карты
   показывают копирайт и масштабную линейку. */
.feedback-trigger {
  position: fixed;
  right: 6px;
  bottom: 4px;
  z-index: 2500;
  font-size: 11px;
  opacity: 0.55;
  transition: opacity 0.2s ease;
}

.feedback-trigger:hover,
.feedback-trigger:focus {
  opacity: 1;
}
</style>
