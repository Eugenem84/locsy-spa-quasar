<template>
  <q-page class="flex flex-center q-pa-md auth-page">
    <q-card class="auth-card q-pa-sm">
      <q-card-section>
        <div class="text-h5 text-weight-bold">Подтверждение почты</div>
      </q-card-section>

      <q-card-section>
        <!-- Перешли по ссылке из письма — адрес подтверждён -->
        <template v-if="status === 'verified'">
          <q-banner dense class="bg-green-1 text-green-9 rounded-borders">
            <template v-slot:avatar><q-icon name="mark_email_read" /></template>
            Почта подтверждена — аккаунт активирован. Теперь доступны избранное, локации и фото.
          </q-banner>
          <q-btn
            to="/"
            label="Перейти на карту"
            color="primary"
            class="full-width q-mt-md"
            no-caps
          />
        </template>

        <!-- Ссылка недействительна или устарела -->
        <template v-else-if="status === 'invalid'">
          <q-banner dense class="bg-orange-1 text-orange-9 rounded-borders">
            <template v-slot:avatar><q-icon name="link_off" /></template>
            Ссылка недействительна или устарела.
          </q-banner>
          <q-btn
            v-if="isLoggedIn && !isEmailVerified"
            :label="resendLabel"
            :loading="loading"
            :disable="cooldown > 0"
            color="primary"
            class="full-width q-mt-md"
            no-caps
            @click="resend"
          />
          <q-btn
            v-else
            to="/login"
            label="Войти"
            color="primary"
            class="full-width q-mt-md"
            no-caps
          />
        </template>

        <!-- Ожидание подтверждения -->
        <template v-else>
          <template v-if="isLoggedIn && isEmailVerified">
            <q-banner dense class="bg-green-1 text-green-9 rounded-borders">
              <template v-slot:avatar><q-icon name="check_circle" /></template>
              Почта уже подтверждена.
            </q-banner>
            <q-btn to="/" label="На главную" color="primary" class="full-width q-mt-md" no-caps />
          </template>

          <template v-else-if="isLoggedIn">
            <div class="text-body2 text-grey-8">
              Мы отправили письмо со ссылкой на <b>{{ userEmail }}</b>. Перейдите по ней —
              и аккаунт активируется.
            </div>
            <div class="text-caption text-grey-7 q-mt-sm">
              Не видно письма? Проверьте папку «Спам».
            </div>
            <q-btn
              :label="resendLabel"
              :loading="loading"
              :disable="cooldown > 0"
              color="primary"
              class="full-width q-mt-md"
              no-caps
              @click="resend"
            />
          </template>

          <template v-else>
            <div class="text-body2 text-grey-8">
              Войдите, чтобы подтвердить почту, или создайте новый аккаунт.
            </div>
            <q-btn to="/login" label="Войти" color="primary" class="full-width q-mt-md" no-caps />
            <q-btn
              to="/register"
              label="Зарегистрироваться"
              flat
              color="primary"
              class="full-width q-mt-xs"
              no-caps
            />
          </template>
        </template>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store'

const $q = useQuasar()
const route = useRoute()
const authStore = useAuthStore()

// Бэкенд после перехода по ссылке уводит сюда со статусом verified/invalid
const status = String(route.query.status || '')
const loading = ref(false)
const cooldown = ref(0)

const isLoggedIn = computed(() => authStore.isLoggedIn)
const isEmailVerified = computed(() => authStore.isEmailVerified)
const userEmail = computed(() => authStore.user?.email || '')

const resendLabel = computed(() =>
  cooldown.value > 0 ? `Отправить снова через ${cooldown.value} с` : 'Отправить письмо повторно'
)

/**
 * Повторную отправку ограничиваем на клиенте: на бэкенде запросы лимитированы,
 * и пользователю спокойнее видеть таймер, чем 429.
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

async function resend() {
  loading.value = true

  try {
    const data = await authStore.resendVerificationEmail()
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
      message: error.response?.data?.message || 'Не удалось отправить письмо. Попробуйте ещё раз.'
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // После перехода по ссылке обновляем пользователя, чтобы SPA сразу увидел
  // статус подтверждения и снял баннер «подтвердите почту».
  if (authStore.isLoggedIn) {
    await authStore.fetchUser()
  }
})
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
