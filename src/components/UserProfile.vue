<template>
  <q-card class="profile-card">
    <q-btn
      flat
      dense
      round
      icon="close"
      class="absolute-top-right q-ma-sm z-top"
      @click="$emit('close')"
    />

    <q-card-section class="row items-center no-wrap">
      <q-avatar size="72px" class="q-mr-md">
        <img :src="user?.avatar || defaultAvatar" alt="Аватар" />
      </q-avatar>
      <div class="col">
        <div class="text-h6 ellipsis">{{ authStore.userName || 'Пользователь' }}</div>
        <div class="text-body2 text-grey-7 ellipsis">{{ user?.email }}</div>
        <div class="row q-gutter-xs q-mt-xs">
          <q-chip v-if="isPhotographer" dense color="primary" text-color="white" icon="camera_alt">
            Фотограф
          </q-chip>
          <q-chip dense outline color="primary" icon="place">
            {{ user?.city?.name || 'Город не выбран' }}
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-tabs
      v-model="tab"
      dense
      align="justify"
      active-color="primary"
      indicator-color="primary"
      narrow-indicator
    >
      <q-tab name="profile" icon="person" label="Профиль" />
      <q-tab name="materials" icon="collections" label="Материалы" />
      <q-tab name="photographer" icon="camera_alt" label="Фотограф" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="profile">
        <q-file
          v-model="avatarFile"
          label="Загрузить аватар"
          filled
          dense
          accept="image/*"
          :loading="avatarLoading"
          class="q-mb-md"
          @update:model-value="handleAvatarUpload"
        >
          <template v-slot:prepend><q-icon name="photo_camera" /></template>
        </q-file>

        <q-select
          v-model="selectedCity"
          :options="cityStore.cities"
          option-label="name"
          label="Мой город"
          filled
          dense
          use-input
          class="q-mb-md"
          @filter="(val, update) => cityStore.fetchCities(val).then(() => update())"
          @update:model-value="updateCity"
        >
          <template v-slot:no-option>
            <q-item><q-item-section class="text-grey">Город не найден</q-item-section></q-item>
          </template>
        </q-select>

        <q-input :model-value="user?.name" label="Имя" filled dense readonly class="q-mb-md" />
        <q-input :model-value="user?.email" label="Email" filled dense readonly class="q-mb-md" />

        <q-btn
          outline
          color="primary"
          no-caps
          icon="logout"
          label="Выйти из аккаунта"
          class="full-width"
          @click="logout"
        />
      </q-tab-panel>

      <q-tab-panel name="materials">
        <div v-if="materialsLoading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="2.5em" />
        </div>

        <template v-else>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-medium">Мои локации ({{ myLocations.length }})</div>
            <q-btn flat dense no-caps icon="refresh" label="Обновить" color="primary" @click="loadMaterials" />
          </div>

          <div v-if="myLocations.length === 0" class="text-body2 text-grey-7 q-mb-md">
            Вы ещё не добавляли локации. Нажмите «Добавить локацию» в меню на карте.
          </div>
          <q-list v-else separator class="rounded-borders q-mb-md">
            <q-item
              v-for="location in myLocations"
              :key="location.id"
              clickable
              @click="goToLocation(location.id)"
            >
              <q-item-section>
                <q-item-label>{{ location.name }}</q-item-label>
                <q-item-label caption>{{ location.city?.name || 'Без города' }}</q-item-label>
              </q-item-section>
              <q-item-section side class="items-end">
                <q-chip
                  dense
                  :color="locationStatus(location.status).color"
                  text-color="white"
                  :icon="locationStatus(location.status).icon"
                  class="q-mt-none"
                >
                  {{ locationStatus(location.status).label }}
                </q-chip>
                <q-badge v-if="location.pending_photos_count > 0" color="warning" class="q-mt-xs">
                  {{ location.pending_photos_count }} фото на проверке
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="text-subtitle1 text-weight-medium q-mb-sm">
            Мои фотографии ({{ myPhotos.length }})
          </div>
          <div v-if="myPhotos.length === 0" class="text-body2 text-grey-7">
            Загруженные вами фото появятся здесь вместе со статусом проверки.
          </div>
          <div v-else class="photos-grid">
            <div v-for="photo in myPhotos" :key="photo.id" class="photo-cell">
              <q-img :src="photo.full_url" :ratio="4 / 3" class="rounded-borders">
                <div class="absolute-bottom row items-center justify-between q-px-xs">
                  <q-chip
                    dense
                    :color="photoStatus(photo.status).color"
                    text-color="white"
                    :icon="photoStatus(photo.status).icon"
                    class="q-ma-none"
                  >
                    {{ photoStatus(photo.status).label }}
                  </q-chip>
                </div>
              </q-img>
              <div class="text-caption text-grey-7 ellipsis q-mt-xs">
                {{ photo.location?.name || 'Без локации' }}
              </div>
              <div v-if="photo.moderation_note" class="text-caption text-negative">
                {{ photo.moderation_note }}
              </div>
            </div>
          </div>
        </template>
      </q-tab-panel>
      <q-tab-panel name="photographer">
        <div v-if="!isPhotographer && !editingPhotographer">
          <div class="text-h6 q-mb-sm">Стать фотографом</div>
          <p class="text-body2 text-grey-8">
            Профиль фотографа сейчас бесплатный: страница с портфолио, карта мест, где вы
            снимали, типы съёмок и контакты. Ссылку на страницу удобно отправлять клиентам.
          </p>
          <ul class="perks">
            <li>Портфолио собирается автоматически из ваших согласованных фото</li>
            <li>Карта съёмок по городам</li>
            <li>Контакты для прямого обращения клиентов</li>
          </ul>
          <q-btn
            color="primary"
            no-caps
            icon="camera_alt"
            label="Заполнить профиль фотографа"
            @click="startPhotographerEditing"
          />
        </div>

        <q-form v-else @submit.prevent="savePhotographer" class="q-gutter-md">
          <div class="text-subtitle1 text-weight-medium">Профиль фотографа</div>
          <q-input
            v-model="photographerForm.display_name"
            label="Имя или бренд"
            filled
            dense
            hint="Оставьте пустым — будем показывать ваше имя"
          />
          <q-select
            v-model="photographerForm.work_types"
            :options="workTypeOptions"
            label="Типы съёмок"
            multiple
            use-chips
            filled
            dense
          />
          <q-input
            v-model="photographerForm.description"
            label="О себе"
            type="textarea"
            autogrow
            filled
            dense
          />
          <q-input v-model="photographerForm.instagram" label="Instagram" filled dense prefix="@" />
          <q-input v-model="photographerForm.telegram" label="Telegram" filled dense prefix="@" />
          <q-input v-model="photographerForm.vk" label="VK" filled dense />
          <q-input
            v-model="photographerForm.website"
            label="Сайт"
            filled
            dense
            hint="Например: https://example.com"
          />

          <div class="row justify-between items-center">
            <q-btn
              v-if="isPhotographer"
              flat
              no-caps
              color="primary"
              icon="open_in_new"
              label="Моя страница"
              @click="openMyPage"
            />
            <div class="row q-gutter-sm">
              <q-btn
                v-if="!isPhotographer"
                flat
                no-caps
                label="Отмена"
                @click="editingPhotographer = false"
              />
              <q-btn
                type="submit"
                color="primary"
                no-caps
                label="Сохранить"
                :loading="savingPhotographer"
              />
            </div>
          </div>
        </q-form>
      </q-tab-panel>
    </q-tab-panels>
  </q-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store'
import { useCityStore } from 'stores/city'
import { WORK_TYPES, locationStatusMeta, photoStatusMeta } from 'src/constants/photographer.js'
import { extractApiMessage } from 'src/utils/api-message.js'

defineEmits(['close'])

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()
const cityStore = useCityStore()

const defaultAvatar = 'https://cdn.quasar.dev/img/boy-avatar.png'
const workTypeOptions = WORK_TYPES
const locationStatus = locationStatusMeta
const photoStatus = photoStatusMeta

const tab = ref('profile')
const avatarFile = ref(null)
const avatarLoading = ref(false)
const selectedCity = ref(null)

const materialsLoading = ref(false)
const myLocations = ref([])
const myPhotos = ref([])

const savingPhotographer = ref(false)
const editingPhotographer = ref(false)
const photographerForm = ref({
  display_name: '',
  description: '',
  work_types: [],
  instagram: '',
  telegram: '',
  vk: '',
  website: ''
})

const user = computed(() => authStore.user)
const isPhotographer = computed(() => authStore.isPhotographer)

onMounted(() => {
  fillPhotographerForm()
  initSelectedCity()
})

watch(tab, (value) => {
  if (value === 'materials') loadMaterials()
})

function fillPhotographerForm() {
  const profile = user.value?.photographer_profile
  if (!profile) return
  photographerForm.value = {
    display_name: profile.display_name || '',
    description: profile.description || '',
    work_types: profile.work_types || [],
    instagram: profile.instagram || '',
    telegram: profile.telegram || '',
    vk: profile.vk || '',
    website: profile.website || ''
  }
}

async function initSelectedCity() {
  const cityId = user.value?.city_id
  if (!cityId) return
  if (!cityStore.cities.length) {
    await cityStore.fetchCities()
  }
  selectedCity.value = cityStore.cities.find((c) => c.id === cityId) || null
}

async function loadMaterials() {
  materialsLoading.value = true
  try {
    const [locations, photos] = await Promise.all([
      authStore.fetchMyLocations(),
      authStore.fetchMyPhotos()
    ])
    myLocations.value = locations || []
    myPhotos.value = photos || []
  } catch (error) {
    console.error('Failed to load user materials:', error)
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: 'Не удалось загрузить ваши материалы'
    })
  } finally {
    materialsLoading.value = false
  }
}

function startPhotographerEditing() {
  fillPhotographerForm()
  editingPhotographer.value = true
}

async function savePhotographer() {
  savingPhotographer.value = true
  try {
    await authStore.updatePhotographerProfile({ ...photographerForm.value })
    editingPhotographer.value = false
    $q.notify({ color: 'positive', icon: 'check', message: 'Профиль фотографа сохранён' })
  } catch (error) {
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: extractApiMessage(error, 'Не удалось сохранить профиль')
    })
  } finally {
    savingPhotographer.value = false
  }
}

async function handleAvatarUpload(file) {
  if (!file) return
  avatarLoading.value = true
  try {
    await authStore.uploadAvatar(file)
    avatarFile.value = null
    $q.notify({ color: 'positive', icon: 'check', message: 'Аватар обновлён' })
  } catch (error) {
    console.error('Failed to upload avatar:', error)
    $q.notify({ color: 'negative', icon: 'report_problem', message: 'Не удалось загрузить аватар' })
  } finally {
    avatarLoading.value = false
  }
}

async function updateCity(city) {
  if (!city) return
  await authStore.updateUserCity(city.id)
  cityStore.setSelectedCity(city)
  $q.notify({ color: 'positive', message: 'Город обновлён' })
}

async function logout() {
  await authStore.handleLogout()
  $q.notify({ color: 'positive', message: 'Вы вышли из аккаунта' })
  router.push('/')
}

function goToLocation(id) {
  router.push({ name: 'Location', params: { id } })
}

function openMyPage() {
  if (user.value?.id) {
    router.push({ name: 'PhotographerProfile', params: { id: user.value.id } })
  }
}
</script>

<style scoped>
.profile-card {
  width: 100%;
  max-width: 640px;
  border-radius: 16px;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.perks {
  margin: 0 0 14px;
  padding-left: 20px;
}

.perks li {
  margin-bottom: 4px;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
