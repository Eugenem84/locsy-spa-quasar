<template>
  <q-page class="flex flex-center q-pa-md auth-page">
    <q-card class="auth-card q-pa-sm">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Новый пароль</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Придумайте новый пароль для входа в getlocsy.
        </div>
      </q-card-section>

      <q-card-section v-if="!hasLink">
        <q-banner dense class="bg-orange-1 text-orange-9 rounded-borders">
          <template v-slot:avatar><q-icon name="link_off" /></template>
          Ссылка неполная или уже использована — запросите письмо заново.
        </q-banner>

        <q-btn
          to="/forgot-password"
          label="Запросить письмо"
          color="primary"
          class="full-width q-mt-md"
          no-caps
        />
      </q-card-section>

      <q-card-section v-else>
        <q-banner
          v-if="linkFailed"
          dense
          class="bg-orange-1 text-orange-9 rounded-borders q-mb-md"
        >
          <template v-slot:avatar><q-icon name="link_off" /></template>
          Ссылка недействительна или устарела.
          <router-link to="/forgot-password" class="text-primary text-weight-medium">
            Запросить новую
          </router-link>
        </q-banner>

        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="form.password"
            label="Новый пароль"
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
            :rules="[
              (val) => !!val || 'Повторите пароль',
              (val) => val === form.password || 'Пароли не совпадают'
            ]"
          />

          <q-btn
            type="submit"
            label="Сохранить пароль"
            color="primary"
            class="full-width"
            :loading="loading"
            no-caps
          />

          <div class="text-center text-body2 text-grey-7">
            <router-link to="/login" class="text-primary text-weight-medium">Вернуться ко входу</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'
import { extractApiMessage, translateMessage } from 'src/utils/api-message.js'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

// Токен и email приходят во фрагменте ссылки: /#/reset-password?token=…&email=…
const token = String(route.query.token || '')
const email = String(route.query.email || '')

const hasLink = computed(() => token !== '' && email !== '')
const form = reactive({ password: '', password_confirmation: '' })
const loading = ref(false)
const linkFailed = ref(false)

async function handleSubmit() {
  loading.value = true
  linkFailed.value = false

  try {
    // Sanctum: POST-запросы в группе web защищены CSRF, поэтому сначала берём куку
    await authStore.getCsrfCookie()

    const { data } = await api.post('/api/reset-password', {
      token,
      email,
      ...form
    })

    $q.notify({
      color: 'positive',
      icon: 'check',
      message: translateMessage(data?.message) || 'Пароль обновлён — войдите с новым паролем'
    })

    router.push('/login')
  } catch (error) {
    const errors = error.response?.data?.errors
    const isInvalidToken = error.response?.status === 422 && !errors

    if (isInvalidToken) {
      linkFailed.value = true
    }

    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: extractApiMessage(error, 'Не удалось сменить пароль. Попробуйте ещё раз.')
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
  max-width: 480px;
  border-radius: 16px;
}
</style>
