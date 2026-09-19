<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'boot/axios.js'
import { useAuthStore } from 'stores/auth-store'
import PhotoUploader from 'components/PhotoUploader.vue' // Import the new component
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()
const id = route.params.id
const location = ref(null)
const loading = ref(true)
const showPhotoUploaderDialog = ref(false) // Control dialog visibility

const slide = ref(0)
const fullscreen = ref(false)
const isFavorite = ref(false)

const photoGallery = computed(() => {
  return location.value?.photos || [];
});

const canDelete = computed(() => {
  if (!authStore.isLoggedIn || !photoGallery.value[slide.value]) {
    return false;
  }
  const photo = photoGallery.value[slide.value];
  return photo.user_id === authStore.user.id;
});

onMounted(async () => {
  await fetchLocationData();
})

async function fetchLocationData() {
  loading.value = true;
  try {
    const response = await api.get(`/api/location/${id}`)
    location.value = response.data
    if (authStore.isLoggedIn) {
      await checkFavoriteStatus()
    }
  } catch (error) {
    console.error('Failed to fetch location:', error)
  } finally {
    loading.value = false;
  }
}

async function checkFavoriteStatus() {
  try {
    const response = await api.get('/api/favorites')
    const favorites = response.data
    isFavorite.value = favorites.some(fav => fav.id === location.value.id)
  } catch (error) {
    console.error('Failed to check favorite status:', error)
  }
}

async function toggleFavorite() {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    if (isFavorite.value) {
      await api.delete(`/api/locations/${location.value.id}/favorite`)
    } else {
      await api.post(`/api/locations/${location.value.id}/favorite`)
    }
    isFavorite.value = !isFavorite.value
  } catch (error) {
    console.error('Failed to toggle favorite:', error)
  }
}

function openGallery(index) {
  if (photoGallery.value.length === 0) return;
  slide.value = index;
  fullscreen.value = true;
}

function addPhoto() {
  showPhotoUploaderDialog.value = true; // Open the dialog
}

async function handlePhotosUploaded() {
  showPhotoUploaderDialog.value = false; // Close dialog
  await fetchLocationData(); // Refresh location data to show new photos
}

function deletePhoto() {
  if (!canDelete.value) return;

  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите удалить эту фотографию?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const photo = photoGallery.value[slide.value];
    try {
      await api.delete(`/api/photos/${photo.id}`);
      fullscreen.value = false;
      await fetchLocationData();
      $q.notify({
        color: 'positive',
        message: 'Фотография успешно удалена'
      })
    } catch (error) {
      console.error('Failed to delete photo:', error);
      $q.notify({
        color: 'negative',
        message: 'Не удалось удалить фотографию'
      })
    }
  });
}

function goToPhotographerProfile(userId) {
  fullscreen.value = false; // Close the fullscreen view first
  router.push(`/photographer/${userId}`);
}

function goBack() {
  router.back()
}
</script>

<template>
  <q-page class="location-page">
    <q-page-sticky position="top-left" :offset="[18, 18]" style="z-index: 10">
      <q-btn round dense push icon="arrow_back" @click="goBack" color="white" text-color="primary"/>
    </q-page-sticky>

    <q-page-sticky position="top-right" :offset="[18, 18]" style="z-index: 10">
      <div class="row q-gutter-sm">
        <q-btn round dense push :icon="isFavorite ? 'favorite' : 'favorite_border'" @click="toggleFavorite" color="white" text-color="accent"/>
        <q-btn-dropdown
          v-if="authStore.isLoggedIn"
          round dense push
          icon="more_vert"
          color="white"
          text-color="primary"
        >
          <q-list>
            <q-item clickable v-close-popup @click="addPhoto">
              <q-item-section>
                <q-item-label>Добавить фото</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </q-page-sticky>

    <div v-if="loading" class="fullscreen row flex-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-if="!loading && location" class="page-inner">
      <!-- Шапка локации: название и категории -->
      <q-card flat bordered class="section-card q-mb-md">
        <q-card-section>
          <h1 class="text-h5 text-weight-bold q-mt-none q-mb-sm">{{ location.name }}</h1>
          <!-- Блок для отображения категорий -->
          <div
            v-if="location.categories && location.categories.length"
            class="row q-gutter-xs"
          >
            <q-chip
              v-for="category in location.categories"
              :key="category.id"
              dense
              color="primary"
              text-color="white"
              icon="label"
            >
              {{ category.name }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- Фотографии локации -->
      <q-card flat bordered class="section-card q-mb-md">
        <q-card-section class="row items-center no-wrap">
          <q-icon name="photo_library" size="20px" color="primary" class="q-mr-sm" />
          <div class="text-h6">Фотографии</div>
          <q-badge v-if="photoGallery.length" color="primary" class="q-ml-sm">
            {{ photoGallery.length }}
          </q-badge>
          <q-space />
          <q-btn
            v-if="authStore.isLoggedIn"
            flat
            dense
            no-caps
            color="primary"
            icon="add_a_photo"
            label="Добавить"
            @click="addPhoto"
          />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div
            v-if="photoGallery.length === 0"
            class="empty-photos column flex-center q-pa-xl text-center text-grey-7"
          >
            <q-icon name="photo_library" size="48px" color="grey-5" />
            <div class="text-body1 q-mt-sm">Здесь пока нет фотографий</div>
            <div class="text-caption q-mb-md">
              Станьте первым — загрузите свои снимки этого места
            </div>
            <q-btn
              v-if="authStore.isLoggedIn"
              color="primary"
              no-caps
              icon="add_a_photo"
              label="Добавить фото"
              @click="addPhoto"
            />
            <q-btn
              v-else
              color="primary"
              no-caps
              icon="login"
              label="Войти и добавить фото"
              to="/login"
            />
          </div>

          <div v-else class="photo-grid">
            <div
              v-for="(photo, index) in photoGallery"
              :key="photo.id"
              class="photo-card"
              @click="openGallery(index)"
            >
              <q-img :src="photo.full_url" :ratio="4 / 3" spinner-color="grey-5">
                <div class="photo-hover row flex-center">
                  <q-icon name="zoom_in" size="28px" />
                </div>
              </q-img>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Описание локации -->
      <q-card flat bordered class="section-card q-mb-md">
        <q-card-section class="row items-center no-wrap">
          <q-icon name="notes" size="20px" color="primary" class="q-mr-sm" />
          <div class="text-h6">Описание</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p class="description-text text-body1 text-grey-8 q-mb-none">
            {{ location.description || 'Описание пока не добавлено.' }}
          </p>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="!loading && !location" class="fullscreen row flex-center text-h6 text-grey">
      Не удалось загрузить информацию о локации.
    </div>

    <!-- Полноэкранная карусель, которая создается только при необходимости -->
    <template v-if="fullscreen">
      <q-carousel
        v-model="slide"
        v-model:fullscreen="fullscreen"
        swipeable
        animated
        navigation
        arrows
        control-color="white"
        class="bg-black"
      >
        <q-carousel-slide
          v-for="(photo, index) in photoGallery"
          :key="photo.id"
          :name="index"
          class="flex flex-center no-padding"
        >
          <q-img
            :src="photo.full_url"
            fit="contain"
            spinner-color="white"
            style="width: 100%; height: 100%;"
          />
          <div class="absolute-bottom-right text-white q-pa-md text-h6" style="z-index: 20;" v-if="photo.user">
            <a @click.stop="goToPhotographerProfile(photo.user.id)" class="photographer-link row items-center no-wrap">
              <q-avatar size="32px" class="q-mr-sm">
                <img v-if="photo.user.avatar" :src="photo.user.avatar">
                <q-icon v-else name="account_circle" />
              </q-avatar>
              {{ photo.user.photographer_profile?.display_name || photo.user.name }}
            </a>
          </div>
        </q-carousel-slide>

        <!-- Кнопка закрытия в полноэкранном режиме -->
        <template v-slot:control>
          <q-carousel-control
            position="top-right"
            :offset="[18, 18]"
            class="text-white"
            style="z-index: 20;"
          >
            <q-btn
              push round dense
              icon="close"
              @click="fullscreen = false"
            />
          </q-carousel-control>
          <q-carousel-control
            position="bottom-left"
            :offset="[18, 18]"
            class="text-white"
            style="z-index: 20;"
            v-if="canDelete"
          >
            <q-btn
              push round dense
              icon="delete"
              @click="deletePhoto"
            />
          </q-carousel-control>
        </template>
      </q-carousel>
    </template>

    <!-- Photo Uploader Dialog -->
    <q-dialog v-model="showPhotoUploaderDialog">
      <PhotoUploader
        :location-id="location?.id"
        @close="showPhotoUploaderDialog = false"
        @uploaded="handlePhotosUploaded"
      />
    </q-dialog>

  </q-page>
</template>

<style scoped>
.location-page {
  background-color: #f9f9f9;
}

/* Контент страницы: ограничиваем ширину и даём отступ сверху
   под плавающие кнопки «назад» и «избранное». */
.page-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 16px 24px;
}

.section-card {
  border-radius: 16px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.photo-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);
}

/* Подсказка «открыть фото» при наведении (на тач-устройствах скрыта) */
.photo-hover {
  height: 100%;
  color: #fff;
  background: rgba(5, 39, 71, 0.35);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-card:hover .photo-hover {
  opacity: 1;
}

@media (hover: none) {
  .photo-hover {
    display: none;
  }
}

/* Пустое состояние галереи: не даём блоку «схлопнуться» */
.empty-photos {
  min-height: 200px;
}

/* Описание: сохраняем абзацы, введённые в textarea формы создания локации */
.description-text {
  white-space: pre-line;
  line-height: 1.6;
}

.photographer-link {
  color: white;
  text-decoration: none;
  cursor: pointer;
}
.photographer-link:hover {
  text-decoration: underline;
}

/* Мобильные: две колонки в галерее и меньше отступы,
   чтобы описание шло сразу под фотографиями и не уезжало за экран */
@media (max-width: 599px) {
  .page-inner {
    padding: 56px 12px 16px;
  }

  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .empty-photos {
    min-height: 160px;
  }
}
</style>
