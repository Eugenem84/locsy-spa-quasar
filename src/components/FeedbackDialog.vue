<template>
  <q-card class="feedback-card">
    <q-btn
      flat
      dense
      round
      icon="close"
      class="absolute-top-right q-ma-sm z-top"
      aria-label="Закрыть"
      @click="emit('close')"
    />

    <q-card-section>
      <div class="row items-center no-wrap">
        <q-icon name="forum" color="primary" size="26px" class="q-mr-sm" />
        <div>
          <div class="text-h6">Обратная связь</div>
          <div class="text-caption text-grey-7">
            Сообщите об ошибке или предложите улучшение
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-form @submit="submit">
      <q-card-section class="q-gutter-y-md">
        <q-select
          v-model="type"
          :options="typeOptions"
          emit-value
          map-options
          option-value="value"
          option-label="label"
          label="Тема обращения"
          filled
          dense
        />

        <q-input
          v-model="message"
          label="Сообщение"
          type="textarea"
          filled
          autogrow
          maxlength="2000"
          counter
          :rules="[
            (val) => (val && val.trim().length >= 5) || 'Опишите, что случилось (минимум 5 символов)'
          ]"
        />

        <q-input
          v-model="email"
          label="Email для ответа (необязательно)"
          type="email"
          filled
          dense
          :rules="[(val) => !val || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val) || 'Проверьте адрес']"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat no-caps label="Отмена" color="grey-8" @click="emit('close')" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="send"
          label="Отправить"
          type="submit"
          :loading="sending"
        />
      </q-card-actions>
    </q-form>
  </q-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import { useAuthStore } from 'stores/auth-store'
import { extractApiMessage } from 'src/utils/api-message.js'

const emit = defineEmits(['close'])

const $q = useQuasar()
const authStore = useAuthStore()

const type = ref('error')
const message = ref('')
const email = ref('')
const sending = ref(false)

// Тема обращения совпадает со значениями enum FeedbackType на бэкенде
const typeOptions = [
  { value: 'error', label: 'Сообщить об ошибке' },
  { value: 'suggestion', label: 'Есть предложение об улучшении' },
  { value: 'other', label: 'Другое' }
]

onMounted(() => {
  // Подставляем email авторизованного пользователя — чтобы было куда ответить
  email.value = authStore.user?.email || ''
})

async function submit() {
  sending.value = true

  try {
    // Sanctum: перед stateful POST убеждаемся, что CSRF-cookie установлена
    // (гость мог ни разу не открывать форму входа — тогда cookie ещё нет)
    await api.get('/sanctum/csrf-cookie')

    await api.post('/api/feedback', {
      type: type.value,
      message: message.value.trim(),
      email: email.value.trim() || null,
      page_url: window.location.href
    })

    $q.notify({ color: 'positive', icon: 'check', message: 'Спасибо! Сообщение отправлено.' })
    emit('close')
  } catch (error) {
    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message: extractApiMessage(error, 'Не удалось отправить сообщение. Попробуйте ещё раз.')
    })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.feedback-card {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
}
</style>
