<template>
  <q-layout view="lHh Lpr lFf">
    <q-header
      v-if="$route.name !== 'Location' && $route.name !== 'PhotographerProfile'"
      elevated
      class="bg-gradient-primary"
    >
      <q-toolbar class="q-py-sm header-toolbar">
        <router-link to="/" class="logo-link row items-center no-wrap">
          <img src="/logo/logo.png" alt="Locsy" class="logo-img" />
        </router-link>

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
                <q-item-section><q-item-label>Профиль и материалы</q-item-label></q-item-section>
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
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

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
import UserProfile from 'components/UserProfile.vue'

const router = useRouter()
const cityStore = useCityStore()
const authStore = useAuthStore()
const profileModalOpen = ref(false)

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

/* Логотип не должен сжиматься из-за соседних элементов шапки */
.logo-link {
  flex: 0 0 auto;
}

/* В PNG вокруг эмблемы и названия есть прозрачные поля, а fit="contain"
   добавлял ещё и «воздух» по бокам. Задаём только высоту (как было раньше) —
   ширина берётся по пропорции картинки, поэтому логотип прижат к левому краю */
.logo-img {
  display: block;
  height: 44px;
  width: auto;
}

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

.avatar-ring {
  border: 2px solid #ea580c;
  border-radius: 50%;
  padding: 2px;
}
</style>
