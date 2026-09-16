<template>
  <q-page class="flex flex-center q-pa-md auth-page">
    <q-card class="auth-card q-pa-sm">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Регистрация в Locsy</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Выберите, как вы будете пользоваться сервисом. Это можно изменить позже.
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-btn-toggle
          v-model="form.role"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          :options="[
            { value: 'user', slot: 'user' },
            { value: 'photographer', slot: 'photographer' }
          ]"
        >
          <template v-slot:user>
            <div class="column items-center q-py-xs">
              <q-icon name="travel_explore" size="22px" />
              <div>Ищу места</div>
            </div>
          </template>
          <template v-slot:photographer>
            <div class="column items-center q-py-xs">
              <q-icon name="camera_alt" size="22px" />
              <div>Я фотограф</div>
            </div>
          </template>
        </q-btn-toggle>

        <q-banner
          v-if="isPhotographer"
          dense
          class="bg-orange-1 text-orange-9 q-mt-md rounded-borders"
        >
          <template v-slot:avatar><q-icon name="info" /></template>
          Профиль фотографа сейчас бесплатный: получите страницу с портфолио и картой мест,
          где вы снимали, — на неё удобно отправлять клиентов.
        </q-banner>
      </q-card-section>

      <q-card-section>
        <q-form ref="formRef" @submit.prevent="handleRegister" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Имя"
            outlined
            dense
            :rules="[(val) => !!val || 'Укажите имя']"
          />
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Укажите email',
              (val) => /.+@.+\..+/.test(val) || 'Некорректный email'
            ]"
          />
          <q-select
            v-model="form.city_id"
            :options="cityStore.cities"
            label="Ваш город"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            outlined
            dense
            use-input
            clearable
            @filter="(val, update) => cityStore.fetchCities(val).then(() => update())"
            :rules="[(val) => !!val || 'Выберите город']"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">Город не найден</q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input
            v-model="form.password"
            label="Пароль"
            type="password"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Придумайте пароль',
              (val) => (val || '').length >= 8 || 'Минимум 8 символов'
            ]"
          />
          <q-input
            v-model="form.password_confirmation"
            label="Повторите пароль"
            type="password"
            outlined
            dense
            :rules="[(val) => val === form.password || 'Пароли не совпадают']"
          />

          <!-- Дополнительные поля фотографа -->
          <q-slide-transition>
            <div v-show="isPhotographer">
              <q-separator class="q-my-md" />
              <div class="text-subtitle1 text-weight-medium q-mb-sm">Профиль фотографа</div>
              <div class="q-gutter-md">
                <q-input
                  v-model="form.display_name"
                  label="Как вас показывать (имя или бренд)"
                  outlined
                  dense
                  hint="Оставьте пустым — используем ваше имя"
                />
                <q-select
                  v-model="form.work_types"
                  :options="workTypeOptions"
                  label="Типы съёмок"
                  multiple
                  use-chips
                  outlined
                  dense
                />
                <q-input
                  v-model="form.description"
                  label="О себе"
                  type="textarea"
                  autogrow
                  outlined
                  dense
                  hint="Опыт, стиль, в каких городах снимаете"
                />
                <div class="row q-col-gutter-sm">
                  <div class="col-12 col-sm-6">
                    <q-input v-model="form.instagram" label="Instagram" outlined dense prefix="@" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="form.telegram" label="Telegram" outlined dense prefix="@" />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input v-model="form.vk" label="VK" outlined dense />
                  </div>
                  <div class="col-12 col-sm-6">
                    <q-input
                      v-model="form.website"
                      label="Сайт"
                      outlined
                      dense
                      :rules="[
                        (val) =>
                          !val || /^https?:\/\//.test(val) || 'Ссылка должна начинаться с http(s)://'
                      ]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </q-slide-transition>

          <q-btn
            type="submit"
            :label="isPhotographer ? 'Создать профиль фотографа' : 'Зарегистрироваться'"
            color="primary"
            class="full-width q-mt-md"
            :loading="loading"
            no-caps
          />

          <div class="text-center text-body2 text-grey-7">
            Уже есть аккаунт?
            <router-link to="/login" class="text-primary text-weight-medium">Войти</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCityStore } from 'stores/city'
import { useAuthStore } from 'stores/auth-store'
import { WORK_TYPES } from 'src/constants/photographer.js'

const $q = useQuasar()
const router = useRouter()
const cityStore = useCityStore()
const authStore = useAuthStore()

const formRef = ref(null)
const loading = ref(false)
const workTypeOptions = WORK_TYPES

const form = ref({
  role: 'user',
  name: '',
  email: '',
  city_id: null,
  password: '',
  password_confirmation: '',
  display_name: '',
  description: '',
  work_types: [],
  instagram: '',
  telegram: '',
  vk: '',
  website: ''
})

const isPhotographer = computed(() => form.value.role === 'photographer')

onMounted(() => {
  cityStore.fetchCities()
})

function extractError(error) {
  const data = error?.response?.data
  if (data?.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  return data?.message || 'Не удалось зарегистрироваться. Попробуйте ещё раз.'
}

async function handleRegister() {
  const valid = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    const payload = {
      name: form.value.name,
      email: form.value.email,
      city_id: form.value.city_id,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
      role: form.value.role
    }

    if (isPhotographer.value) {
      Object.assign(payload, {
        display_name: form.value.display_name || form.value.name,
        description: form.value.description || null,
        work_types: form.value.work_types,
        instagram: form.value.instagram || null,
        telegram: form.value.telegram || null,
        vk: form.value.vk || null,
        website: form.value.website || null
      })
    }

    await authStore.register(payload)

    $q.notify({
      color: 'positive',
      icon: 'check',
      message: isPhotographer.value
        ? 'Профиль фотографа создан — можно делиться ссылкой!'
        : 'Добро пожаловать в Locsy!'
    })

    if (isPhotographer.value && authStore.user?.id) {
      router.push({ name: 'PhotographerProfile', params: { id: authStore.user.id } })
    } else {
      router.push('/')
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: extractError(error)
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  background: #f6f8fb;
}

.auth-card {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
}
</style>
