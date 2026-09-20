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
      <q-tab v-if="isPhotographer" name="locations" icon="place" label="Мои локации" />
      <q-tab v-if="isPhotographer" name="photos" icon="photo_library" label="Мои фото" />
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

        <q-separator class="q-my-md" />

        <div class="text-subtitle2 text-negative">Удаление аккаунта</div>
        <div class="text-caption text-grey-7 q-mb-sm">
          Аккаунт, аватар и все ваши фотографии удаляются безвозвратно.
        </div>
        <q-btn
          outline
          color="negative"
          no-caps
          icon="delete_forever"
          label="Удалить аккаунт"
          class="full-width"
          @click="confirmAccountDeletion"
        />
      </q-tab-panel>

      <q-tab-panel name="locations">
        <div v-if="locationsLoading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="2.5em" />
        </div>

        <template v-else>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-medium">Мои локации ({{ myLocations.length }})</div>
            <q-btn flat dense no-caps icon="refresh" label="Обновить" color="primary" @click="loadMyLocations" />
          </div>

          <div v-if="myLocations.length === 0" class="text-body2 text-grey-7">
            Вы ещё не добавляли локации. Нажмите «Добавить локацию» в меню на карте.
          </div>
          <q-list v-else separator class="rounded-borders">
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
        </template>
      </q-tab-panel>

      <q-tab-panel name="photos">
        <div v-if="photosLoading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="2.5em" />
        </div>

        <template v-else>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-medium">Мои фото ({{ myPhotos.length }})</div>
            <q-btn flat dense no-caps icon="refresh" label="Обновить" color="primary" @click="loadMyPhotos" />
          </div>

          <div v-if="myPhotos.length === 0" class="text-body2 text-grey-7">
            Загруженные вами фото появятся здесь вместе со статусом проверки.
          </div>
          <div v-else class="photos-grid">
            <div v-for="photo in myPhotos" :key="photo.id" class="photo-cell">
              <div class="relative-position">
                <q-img :src="photo.full_url">
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
                <q-btn
                  round
                  dense
                  push
                  size="sm"
                  icon="delete"
                  color="negative"
                  class="absolute-top-right q-ma-xs"
                  aria-label="Удалить фотографию"
                  @click="askDeletePhoto(photo)"
                />
              </div>
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

const emit = defineEmits(['close'])

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

const locationsLoading = ref(false)
const photosLoading = ref(false)
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
  if (value === 'locations') loadMyLocations()
  if (value === 'photos') loadMyPhotos()
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

async function loadMyLocations() {
  locationsLoading.value = true
  try {
    myLocations.value = (await authStore.fetchMyLocations()) || []
  } catch (error) {
    console.error('Failed to load user locations:', error)
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: 'Не удалось загрузить ваши локации'
    })
  } finally {
    locationsLoading.value = false
  }
}

async function loadMyPhotos() {
  photosLoading.value = true
  try {
    myPhotos.value = (await authStore.fetchMyPhotos()) || []
  } catch (error) {
    console.error('Failed to load user photos:', error)
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: 'Не удалось загрузить ваши фото'
    })
  } finally {
    photosLoading.value = false
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

/**
 * Удаление своей фотографии из вкладки «Мои фото»: сначала подтверждение,
 * затем запрос к API и удаление карточки из локального списка.
 */
function askDeletePhoto(photo) {
  $q.dialog({
    title: 'Удалить фотографию?',
    message: 'Снимок исчезнет из галереи локации. Действие нельзя отменить.',
    persistent: true,
    ok: { label: 'Удалить', color: 'negative', noCaps: true },
    cancel: { label: 'Отмена', noCaps: true }
  }).onOk(async () => {
    try {
      await authStore.deletePhoto(photo.id)
      myPhotos.value = myPhotos.value.filter((item) => item.id !== photo.id)
      $q.notify({ color: 'positive', icon: 'check', message: 'Фотография удалена' })
    } catch (error) {
      $q.notify({
        color: 'negative',
        icon: 'report_problem',
        message: extractApiMessage(error, 'Не удалось удалить фотографию')
      })
    }
  })
}

/**
 * Удаление аккаунта: подтверждаем текущим паролем. После успеха закрываем
 * профиль и возвращаемся на карту — пользователь уже разлогинен.
 */
function confirmAccountDeletion() {
  $q.dialog({
    title: 'Удаление аккаунта',
    message:
      'Аккаунт, аватар и все ваши фотографии будут удалены безвозвратно. ' +
      'Введите пароль, чтобы подтвердить.',
    prompt: {
      model: '',
      type: 'password',
      label: 'Текущий пароль',
      outlined: true,
      isValid: (value) => Boolean(value)
    },
    persistent: true,
    ok: { label: 'Удалить аккаунт', color: 'negative', noCaps: true },
    cancel: { label: 'Отмена', noCaps: true }
  }).onOk(async (password) => {
    try {
      await authStore.deleteAccount(password)
      emit('close')
      $q.notify({ color: 'positive', icon: 'check', message: 'Аккаунт удалён' })
      router.push('/')
    } catch (error) {
      $q.notify({
        color: 'negative',
        icon: 'report_problem',
        message: extractApiMessage(error, 'Не удалось удалить аккаунт')
      })
    }
  })
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
  align-items: start;
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
