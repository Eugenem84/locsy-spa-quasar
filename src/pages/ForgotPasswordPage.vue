<template>
  <q-page class="flex flex-center q-pa-md auth-page">
    <q-card class="auth-card q-pa-sm">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Восстановление пароля</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Укажите почту, с которой регистрировались, — пришлём ссылку для смены пароля.
        </div>
      </q-card-section>

      <q-card-section>
        <q-banner
          v-if="sent"
          dense
          class="bg-green-1 text-green-9 rounded-borders q-mb-md"
        >
          <template v-slot:avatar><q-icon name="mark_email_read" /></template>
          Письмо отправлено. Проверьте входящие — и папку «Спам», если его не видно.
        </q-banner>

        <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Укажите email',
              (val) => /.+@.+\..+/.test(val) || 'Некорректный email'
            ]"
          />

          <q-btn
            type="submit"
            :label="cooldown > 0 ? `Отправить снова через ${cooldown} с` : 'Отправить ссылку'"
            color="primary"
            class="full-width"
            :loading="loading"
            :disable="cooldown > 0"
            no-caps
          />

          <div class="text-center text-body2 text-grey-7">
            Вспомнили пароль?
            <router-link to="/login" class="text-primary text-weight-medium">Войти</router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'

const $q = useQuasar()
const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const cooldown = ref(0)

function errorMessage(error, fallback) {
  const errors = error.response?.data?.errors
  if (errors) {
    return Object.values(errors).flat().join(' ')
  }

  return error.response?.data?.message || fallback
}

/**
 * Повторную отправку ограничиваем на клиенте: на бэкенде запросы лимитированы
 * по email+IP, и пользователю спокойнее видеть таймер, чем 429.
 */
function startCooldown(seconds = 60) {
  cooldown.value = seconds
  const timer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

async function handleSubmit() {
  loading.value = true

  try {
    // Sanctum: POST-запросы в группе web защищены CSRF, поэтому сначала берём куку
    await authStore.getCsrfCookie()

    const { data } = await api.post('/api/forgot-password', { email: email.value })

    sent.value = true
    startCooldown()
    $q.notify({
      color: 'positive',
      icon: 'mark_email_read',
      message: data?.message || 'Письмо отправлено'
    })
  } catch (error) {
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: errorMessage(error, 'Не удалось отправить письмо. Попробуйте ещё раз.')
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
