<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated v-if="$route.name !== 'Location'">
      <q-toolbar>
<!--        <q-btn-->
<!--          flat-->
<!--          dense-->
<!--          round-->
<!--          icon="menu"-->
<!--          aria-label="Menu"-->
<!--          @click="toggleLeftDrawer"-->
<!--        />-->

        <q-toolbar-title>
          Locsy
        </q-toolbar-title>

        <div class="q-pa-md">
          <q-select
            filled
            dark
            color="white"
            style="width: 300px"
            v-model="cityStore.selectedCity"
            :options="cityStore.cities"
            label="Выберите город"
            dense
            clearable
            @popup-show="() => cityStore.fetchCities()"
          >
            <template v-slot:before-options>
              <q-item>
                <q-item-section>
                  <q-input
                    dense
                    autofocus
                    color="white"
                    input-style="color: white"
                    placeholder="Поиск..."
                    @update:model-value="val => cityStore.fetchCities(val)"
                    debounce="300"
                  />
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Город не найден
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <!-- User Info Section -->
        <div v-if="authStore.isLoggedIn" class="q-ml-md">
          <q-btn-dropdown flat :label="authStore.userName">
            <q-list>
              <q-item clickable v-close-popup to="/favorites">
                <q-item-section>
                  <q-item-label>Избранное</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="openCreateLocationDialog">
                <q-item-section>
                  <q-item-label>Добавить локацию</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="authStore.handleLogout">
                <q-item-section>
                  <q-item-label>Выход</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <div v-else class="q-ml-md">
          <q-btn flat label="Войти" to="/login" class="q-mr-sm" />
          <q-btn outline label="Регистрация" to="/register" />
        </div>

      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      overlay
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container @click="leftDrawerOpen = false">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { useCityStore} from "stores/city.js";
import { useAuthStore } from "stores/auth-store";
import { useRouter } from 'vue-router';

const router = useRouter();
const cityStore = useCityStore()
const authStore = useAuthStore();

function openCreateLocationDialog() {
  console.log('MainLayout: Нажата кнопка "Добавить локацию", меняю URL на /?picking=true');
  router.push({ path: '/', query: { picking: 'true' } });
}

// Try to fetch user on component mount to check for existing session
onMounted(async () => {
  await authStore.fetchUser();
  await cityStore.fetchCities();
});

watch(() => authStore.user, (newUser) => {
  if (newUser && newUser.city_id && cityStore.cities.length) {
    const userCity = cityStore.cities.find(c => c.id === newUser.city_id);
    if (userCity) {
      cityStore.setSelectedCity(userCity);
    }
  }
}, { immediate: true });


const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev'
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework'
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev'
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev'
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev'
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev'
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev'
  }
]

const leftDrawerOpen = ref(false)

// function toggleLeftDrawer () {
//   leftDrawerOpen.value = !leftDrawerOpen.value
// }
</script>

<style>

</style>
