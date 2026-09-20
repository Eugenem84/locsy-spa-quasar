<template>
  <q-page class="photographer-page q-pb-xl">
    <q-page-sticky position="top-left" :offset="[18, 18]" style="z-index: 10">
      <q-btn round dense push icon="arrow_back" color="white" text-color="primary" @click="goBack" />
    </q-page-sticky>

    <div v-if="loading" class="fullscreen row flex-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else-if="photographer" class="page-inner">
      <!-- Шапка профиля -->
      <q-card flat bordered class="q-mb-md profile-head">
        <q-card-section class="row items-center no-wrap">
          <q-avatar size="96px" class="q-mr-md">
            <img :src="photographer.avatar || defaultAvatar" alt="Аватар фотографа" />
          </q-avatar>
          <div class="col">
            <div class="text-h5 text-weight-bold">{{ photographer.display_name }}</div>
            <div v-if="photographer.city" class="text-subtitle2 text-grey-7">
              <q-icon name="place" size="16px" /> {{ formatCityName(photographer.city.name) }}
            </div>
            <div class="row q-gutter-xs q-mt-sm">
              <q-chip dense color="primary" text-color="white" icon="photo_library">
                {{ photosCount }} фото
              </q-chip>
              <q-chip dense color="accent" text-color="white" icon="map">
                {{ shootingSpots.length }} мест
              </q-chip>
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="photographer.work_types?.length" class="q-pt-none">
          <q-chip
            v-for="workType in photographer.work_types"
            :key="workType"
            dense
            outline
            color="primary"
            class="q-mr-xs q-mb-xs"
          >
            {{ workType }}
          </q-chip>
        </q-card-section>

        <q-card-section v-if="photographer.description" class="q-pt-none">
          <p class="text-body1 text-grey-8 q-mb-none">{{ photographer.description }}</p>
        </q-card-section>
      </q-card>

      <!-- Портфолио -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6">Работы</div>
        </q-card-section>
        <q-card-section v-if="photoGallery.length > 0" class="q-pt-none">
          <div class="photo-grid">
            <div
              v-for="(photo, index) in photoGallery"
              :key="photo.id"
              class="photo-card"
              @click="openGallery(index)"
            >
              <!-- Без принудительного ratio: q-img использует пропорции фото. -->
              <q-img :src="photo.full_url" spinner-color="grey-5" />
              <div v-if="photo.location" class="photo-caption">
                <q-icon name="place" size="14px" /> {{ photo.location.name }}
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-section v-else class="text-grey-7 text-body2">
          Работы пока на модерации или ещё не загружены.
        </q-card-section>
      </q-card>

      <!-- Контакты -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Контакты</div>
          <q-list v-if="hasContacts" separator>
            <q-item
              v-if="photographer.instagram"
              clickable
              tag="a"
              :href="`https://instagram.com/${photographer.instagram}`"
              target="_blank"
            >
              <q-item-section avatar><q-icon name="photo_camera" color="primary" /></q-item-section>
              <q-item-section><q-item-label>@{{ photographer.instagram }}</q-item-label></q-item-section>
            </q-item>
            <q-item
              v-if="photographer.telegram"
              clickable
              tag="a"
              :href="`https://t.me/${photographer.telegram}`"
              target="_blank"
            >
              <q-item-section avatar><q-icon name="send" color="primary" /></q-item-section>
              <q-item-section><q-item-label>@{{ photographer.telegram }}</q-item-label></q-item-section>
            </q-item>
            <q-item v-if="photographer.vk" clickable tag="a" :href="photographer.vk" target="_blank">
              <q-item-section avatar><q-icon name="groups" color="primary" /></q-item-section>
              <q-item-section><q-item-label>{{ photographer.vk }}</q-item-label></q-item-section>
            </q-item>
            <q-item
              v-if="photographer.website"
              clickable
              tag="a"
              :href="photographer.website"
              target="_blank"
            >
              <q-item-section avatar><q-icon name="language" color="primary" /></q-item-section>
              <q-item-section><q-item-label>{{ photographer.website }}</q-item-label></q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-grey-7 text-body2">
            Фотограф пока не указал контакты. Напишите ему в сервисе позже.
          </div>
        </q-card-section>
      </q-card>

      <div class="text-center">
        <q-btn
          v-if="isMyProfile"
          color="primary"
          no-caps
          icon="share"
          label="Поделиться страницей"
          @click="shareProfileLink"
        />
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
            class="fullscreen-slide flex flex-center"
          >
            <q-img
              :src="photo.full_url"
              fit="contain"
              spinner-color="white"
              style="width: 100%; height: 100%"
            />
            <div
              v-if="photo.location"
              class="absolute-bottom-right text-white q-pa-md text-h6"
              style="z-index: 20"
            >
              <a @click.stop="goToLocation(photo.location.id)" class="location-link">
                {{ photo.location.name }}
              </a>
            </div>
          </q-carousel-slide>

          <template v-slot:control>
            <q-carousel-control
              position="top-right"
              :offset="[18, 18]"
              class="text-white"
              style="z-index: 20"
            >
              <q-btn
                round
                push
                size="lg"
                icon="close"
                color="white"
                text-color="black"
                class="fullscreen-close"
                @click="fullscreen = false"
              />
            </q-carousel-control>
            <q-carousel-control
              v-if="canDelete"
              position="bottom-left"
              :offset="[18, 18]"
              class="text-white"
              style="z-index: 20"
            >
              <q-btn push round dense icon="delete" @click="deletePhoto" />
            </q-carousel-control>
          </template>
        </q-carousel>
      </template>
    </div>

    <div v-else class="fullscreen column flex-center q-pa-lg text-center">
      <q-icon name="person_off" size="56px" color="grey-6" />
      <div class="text-h6 q-mt-md">Профиль фотографа не найден</div>
      <div class="text-body2 text-grey-7 q-mt-sm" style="max-width: 420px">
        Возможно, автор ещё не открыл профиль фотографа или он скрыт модератором.
      </div>
      <div class="row q-gutter-sm q-mt-lg">
        <q-btn color="primary" no-caps icon="explore" label="Смотреть локации" to="/" />
        <q-btn outline color="primary" no-caps icon="info" label="О проекте" to="/about" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios.js'
import { useAuthStore } from 'stores/auth-store'
import { formatCityName } from 'src/utils/city-name.js'
import { shareLink } from 'src/utils/share.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const defaultAvatar = 'https://cdn.quasar.dev/img/boy-avatar.png'

const photographer = ref(null)
const loading = ref(true)
const slide = ref(0)
const fullscreen = ref(false)

const photoGallery = computed(() => photographer.value?.photos || [])
const shootingSpots = computed(() => photographer.value?.shooting_spots || [])
const photosCount = computed(() => photographer.value?.photos_count ?? photoGallery.value.length)

const hasContacts = computed(() =>
  Boolean(
    photographer.value?.instagram ||
      photographer.value?.telegram ||
      photographer.value?.vk ||
      photographer.value?.website
  )
)

const isMyProfile = computed(
  () => authStore.isLoggedIn && String(authStore.user?.id) === String(route.params.id)
)

const canDelete = computed(() => {
  if (!authStore.isLoggedIn || !photoGallery.value[slide.value]) {
    return false
  }
  return photoGallery.value[slide.value].user_id === authStore.user.id
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  fetchPhotographerData()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

/**
 * Листание фото в полноэкранном просмотре с клавиатуры:
 * ← / → переключают снимки по кругу, Esc закрывает просмотр.
 */
function handleKeydown(event) {
  if (!fullscreen.value) return

  if (event.key === 'Escape') {
    fullscreen.value = false
    return
  }

  const total = photoGallery.value.length
  if (total === 0) return

  if (event.key === 'ArrowRight') {
    event.preventDefault()
    slide.value = (slide.value + 1) % total
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    slide.value = (slide.value - 1 + total) % total
  }
}

async function fetchPhotographerData() {
  loading.value = true
  try {
    const { data } = await api.get(`/api/photographers/${route.params.id}`)
    photographer.value = data
  } catch (error) {
    photographer.value = null
    if (error?.response?.status !== 404) {
      console.error('Failed to fetch photographer profile:', error)
    }
  } finally {
    loading.value = false
  }
}

function openGallery(index) {
  if (photoGallery.value.length === 0) return
  slide.value = index
  fullscreen.value = true
}

function goToLocation(locationId) {
  fullscreen.value = false
  if (locationId) {
    router.push({ name: 'Location', params: { id: locationId } })
  }
}

function goBack() {
  router.back()
}

/**
 * Делится ссылкой на свою страницу фотографа: на мобильных откроется системное
 * меню «Поделиться», на десктопе ссылка скопируется в буфер обмена.
 */
async function shareProfileLink() {
  if (!photographer.value) return

  try {
    const result = await shareLink({
      title: photographer.value.display_name,
      text: `Профиль фотографа ${photographer.value.display_name} на getlocsy`,
      url: window.location.href
    })

    if (result === 'copied') {
      $q.notify({ color: 'positive', icon: 'link', message: 'Ссылка скопирована' })
    }
  } catch (error) {
    console.error('Share error:', error)
    $q.notify({ color: 'warning', icon: 'link_off', message: 'Не удалось поделиться ссылкой' })
  }
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
      await authStore.deletePhoto(photo.id)
      fullscreen.value = false
      await fetchPhotographerData()
      $q.notify({ color: 'positive', message: 'Фотография успешно удалена' })
    } catch (error) {
      console.error('Failed to delete photo:', error)
      $q.notify({ color: 'negative', message: 'Не удалось удалить фотографию' })
    }
  })
}
</script>

<style scoped>
.photographer-page {
  background: #f6f8fb;
}

.page-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 64px 16px 16px;
}

.profile-head {
  border-radius: 16px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  align-items: start;
  gap: 16px;
}

/* Фото показываем целиком: без обрезки углов (скругления/overflow). */
.photo-card {
  position: relative;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.photo-card:hover {
  transform: translateY(-4px);
}

.photo-caption {
  padding: 6px 8px;
  font-size: 12px;
  color: #455a64;
  background: #fff;
}

/* Полноэкранный просмотр: небольшой отступ вокруг фото,
   чтобы снимок не прилипал к верхнему краю окна. */
.fullscreen-slide {
  padding: 24px 16px 20px;
}

/* Крупная и контрастная кнопка закрытия поверх фото. */
.fullscreen-close {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
}

.location-link {
  color: #fff;
  text-decoration: none;
  cursor: pointer;
}

.location-link:hover {
  text-decoration: underline;
}
</style>
