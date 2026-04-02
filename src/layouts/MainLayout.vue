<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated v-if="$route.name !== 'Location' && $route.name !== 'PhotographerProfile'">
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

        <div class="q-pa-md">
          <q-select
            filled
            dark
            multiple
            color="white"
            style="width: 300px"
            v-model="locationStore.selectedCategoryIds"
            :options="categoryStore.categories"
            :display-value="categoryDisplayValue"
            option-value="id"
            option-label="name"
            label="Фильтр по категориям"
            dense
            emit-value
            map-options
            @popup-show="() => categoryStore.fetchCategories()"
          >
            <template v-slot:append>
              <q-icon
                v-if="locationStore.selectedCategoryIds.length > 0"
                name="clear"
                class="cursor-pointer"
                @click.stop.prevent="locationStore.selectedCategoryIds = []"
              />
            </template>
            <template v-slot:before-options>
              <q-item clickable @click="toggleSelectAllCategories">
                <q-item-section>
                  <q-item-label>{{ selectAllLabel }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:option="{ itemProps, opt, selected, toggleOption }">
              <q-item v-bind="itemProps">
                <q-item-section>
                  <q-item-label>{{ opt.name }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-checkbox :model-value="selected" @update:model-value="toggleOption(opt)" />
                </q-item-section>
              </q-item>
            </template>
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Категории не найдены
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
              <q-item clickable @click="profileModalOpen = true">
                <q-item-section>
                  <q-item-label>Профиль</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable @click="openSelfPage">
                <q-item-section>
                  <q-item-label>Моя страница</q-item-label>
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

    <q-dialog v-model="profileModalOpen">
      <UserProfile @close="profileModalOpen = false" />
    </q-dialog>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import UserProfile from 'components/UserProfile.vue'
import { useCityStore} from "stores/city.js";
import { useAuthStore } from "stores/auth-store";
import { useCategoryStore } from "stores/category";
import { useLocationStore } from "stores/location";
import { useRouter } from 'vue-router';

const router = useRouter();
const cityStore = useCityStore()
const authStore = useAuthStore();
const categoryStore = useCategoryStore();
const locationStore = useLocationStore();
const profileModalOpen = ref(false);

function openCreateLocationDialog() {
  console.log('MainLayout: Нажата кнопка "Добавить локацию", меняю URL на /?picking=true');
  router.push({ path: '/', query: { picking: 'true' } });
}

function openSelfPage() {
  if (authStore.user) {
    router.push({ name: 'PhotographerProfile', params: { id: authStore.user.id } });
  }
}

// "Select All" logic
const areAllCategoriesSelected = computed(() => {
  const allCategoryIds = categoryStore.categories.map(c => c.id);
  return allCategoryIds.length > 0 && locationStore.selectedCategoryIds.length === allCategoryIds.length;
});

const selectAllLabel = computed(() => {
  return areAllCategoriesSelected.value ? 'Снять выделение' : 'Выбрать все';
});

function toggleSelectAllCategories() {
  if (areAllCategoriesSelected.value) {
    locationStore.selectedCategoryIds = [];
  } else {
    locationStore.selectedCategoryIds = categoryStore.categories.map(c => c.id);
  }
}

const categoryDisplayValue = computed(() => {
  const count = locationStore.selectedCategoryIds.length;
  if (count === 0) {
    return null; // Показывает label
  }
  if (count === 1) {
    const category = categoryStore.categories.find(c => c.id === locationStore.selectedCategoryIds[0]);
    return category ? category.name : '1 категория';
  }
  // Правильное склонение для русского языка
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} категорий выбрано`;
  }
  if (lastDigit === 1) {
    return `${count} категория выбрана`;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} категории выбрано`;
  }
  return `${count} категорий выбрано`;
});

// Try to fetch user on component mount to check for existing session
onMounted(async () => {
  await authStore.fetchUser();
  await cityStore.fetchCities();
  await categoryStore.fetchCategories();
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
