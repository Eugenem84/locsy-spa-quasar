<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'boot/axios.js'
import { useAuthStore } from 'stores/auth-store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const id = route.params.id
const location = ref(null)
const loading = ref(true)

const slide = ref(0)
const fullscreen = ref(false)
const isFavorite = ref(false)

const photoGallery = computed(() => {
  return location.value?.photos?.map(p => p.full_url) || [];
});

onMounted(async () => {
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
})

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
      <q-btn round dense push :icon="isFavorite ? 'favorite' : 'favorite_border'" @click="toggleFavorite" color="white" text-color="blue"/>
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
            v-for="(photoUrl, index) in photoGallery"
            :key="index"
            class="photo-card"
            @click="openGallery(index)"
          >
            <q-img
              :src="photoUrl"
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
          v-for="(photoUrl, index) in photoGallery"
          :key="index"
          :name="index"
          class="flex flex-center no-padding"
        >
          <q-img
            :src="photoUrl"
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
        </template>
      </q-carousel>
    </template>

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
