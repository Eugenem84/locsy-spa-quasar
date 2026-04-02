<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'boot/axios.js'
import { useAuthStore } from 'stores/auth-store'
import { useQuasar } from 'quasar'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()
const photographer = ref(null)
const loading = ref(true)

const slide = ref(0)
const fullscreen = ref(false)

const photoGallery = computed(() => {
  return photographer.value?.photos || []
})

const canDelete = computed(() => {
  if (!authStore.isLoggedIn || !photoGallery.value[slide.value]) {
    return false
  }
  const photo = photoGallery.value[slide.value]
  return photo.user_id === authStore.user.id
})

onMounted(async () => {
  await fetchPhotographerData()
})

async function fetchPhotographerData() {
  loading.value = true
  const photographerId = route.params.id
  try {
    const response = await api.get(`/api/photographers/${photographerId}`)
    photographer.value = response.data
  } catch (error) {
    console.error('Failed to fetch photographer profile:', error)
  } finally {
    loading.value = false
  }
}

function openGallery(index) {
  if (photoGallery.value.length === 0) return
  slide.value = index
  fullscreen.value = true
}

function deletePhoto() {
  if (!canDelete.value) return

  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите удалить эту фотографию?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const photo = photoGallery.value[slide.value]
    try {
      await api.delete(`/api/photos/${photo.id}`)
      fullscreen.value = false
      await fetchPhotographerData()
      $q.notify({
        color: 'positive',
        message: 'Фотография успешно удалена'
      })
    } catch (error) {
      console.error('Failed to delete photo:', error)
      $q.notify({
        color: 'negative',
        message: 'Не удалось удалить фотографию'
      })
    }
  })
}

function goBack() {
  router.back()
}
</script>

<template>
  <q-page class="q-pa-md">
    <q-page-sticky position="top-left" :offset="[18, 18]" style="z-index: 10">
      <q-btn round dense push icon="arrow_back" @click="goBack" color="white" text-color="primary"/>
    </q-page-sticky>

    <div v-if="loading" class="text-center">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <div v-if="!loading && photographer">
      <q-card class="q-mb-md">
        <q-card-section class="text-center">
          <q-avatar size="150px" class="q-mb-md">
            <img :src="photographer.avatar || 'https://cdn.quasar.dev/img/boy-avatar.png'">
          </q-avatar>
          <div class="text-h5">{{ photographer.display_name }}</div>
          <div v-if="photographer.city" class="text-subtitle1 text-grey">{{ photographer.city.name }}</div>
        </q-card-section>
      </q-card>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Описание</div>
          <p>{{ photographer.description }}</p>
        </q-card-section>
      </q-card>

      <!-- Работы фотографа -->
      <q-card class="q-mb-md" v-if="photoGallery.length > 0">
        <q-card-section>
          <div class="text-h6">Работы</div>
        </q-card-section>
        <q-card-section>
          <div class="photo-grid">
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
        </q-card-section>
      </q-card>

      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Типы съемок</div>
          <q-chip v-for="workType in photographer.work_types" :key="workType" color="primary" text-color="white">
            {{ workType }}
          </q-chip>
        </q-card-section>
      </q-card>

      <q-card>
        <q-card-section>
          <div class="text-h6">Контакты</div>
          <q-list>
            <q-item v-if="photographer.instagram" clickable :href="`https://instagram.com/${photographer.instagram}`" target="_blank">
              <q-item-section avatar>
                <q-icon name="fab fa-instagram" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.instagram }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="photographer.telegram" clickable :href="`https://t.me/${photographer.telegram}`" target="_blank">
              <q-item-section avatar>
                <q-icon name="fab fa-telegram" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.telegram }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="photographer.website" clickable :href="photographer.website" target="_blank">
              <q-item-section avatar>
                <q-icon name="fas fa-globe" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.website }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="photographer.vk" clickable :href="photographer.vk" target="_blank">
              <q-item-section avatar>
                <q-icon name="fab fa-vk" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ photographer.vk }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>

    <div v-if="!loading && !photographer" class="text-center">
      <div class="text-h6">Не удалось загрузить профиль фотографа.</div>
    </div>

    <!-- Полноэкранная карусель -->
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

  </q-page>
</template>

<style scoped>
.q-card {
  border-radius: 12px;
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
