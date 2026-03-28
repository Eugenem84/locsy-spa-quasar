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
        <q-btn round dense push :icon="isFavorite ? 'favorite' : 'favorite_border'" @click="toggleFavorite" color="white" text-color="blue"/>
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

    <div v-if="!loading && location">
      <!-- Название локации -->
      <div class="q-pa-md">
        <h4 class="text-h4 text-weight-bold q-mb-sm">{{ location.name }}</h4>
      </div>

      <!-- Сетка фотографий -->
      <q-scroll-area :style="{ height: '70vh' }" class="q-mb-md">
        <div class="photo-grid q-pa-md">
          <div
            v-for="(photo, index) in photoGallery"
            :key="photo.id"
            class="photo-card"
            @click="openGallery(index)"
          >
            <q-img
              :src="photo.full_url"
              :ratio="4/3"
              spinner-color="grey-5"
              class="rounded-borders"
            />
          </div>
        </div>
      </q-scroll-area>

      <!-- Описание -->
      <div class="q-pa-md q-mt-md">
        <p class="text-body1 text-grey-8">{{ location.description }}</p>
      </div>
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
        </q-carousel-slide>

        <!-- Кнопка закрытия в полноэкранном режиме -->
        <template v-slot:control>
          <q-carousel-control
            position="top-right"
            :offset="[18, 18]"
            class="text-white"
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

.text-h4 {
  line-height: 1.2;
}

.photo-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.photo-card:hover {
  transform: translateY(-4px);
}

.photo-card .q-img {
  width: 100%;
  height: auto;
}
</style>
