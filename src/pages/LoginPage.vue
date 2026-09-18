<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="width: 400px">
      <q-card-section>
        <div class="text-h6">Вход в getlocsy</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin">
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            class="q-mb-md"
            :rules="[(val) => !!val || 'Укажите email']"
          />
          <q-input
            v-model="form.password"
            label="Пароль"
            type="password"
            outlined
            dense
            class="q-mb-md"
            :rules="[(val) => !!val || 'Введите пароль']"
          />

          <div class="text-right q-mb-md">
            <router-link to="/forgot-password" class="text-primary text-body2">
              Забыли пароль?
            </router-link>
          </div>

          <q-btn
            type="submit"
            label="Войти"
            color="primary"
            class="full-width"
            :loading="loading"
            no-caps
          />

          <div class="text-center text-body2 text-grey-7 q-mt-md">
            Нет аккаунта?
            <router-link to="/register" class="text-primary text-weight-medium">
              Зарегистрироваться
            </router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';

const $q = useQuasar();
const form = ref({
  email: '',
  password: '',
});

const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

function errorMessage(error, fallback) {
  if (error.response?.data?.errors) {
    return Object.values(error.response.data.errors).flat().join(' ');
  }

  return error.response?.data?.message || fallback;
}

const handleLogin = async () => {
  loading.value = true;
  try {
    await authStore.getCsrfCookie();
    // Захватываем ответ от сервера
    const response = await api.post('/api/login', form.value);

    // Извлекаем access_token из ответа
    const token = response.data.access_token;

    // Если токен получен, устанавливаем его через authStore
    if (token) {
      authStore.setAuthToken(token);
    }

    // Теперь fetchUser должен успешно получить данные пользователя, так как токен уже установлен
    await authStore.fetchUser();

    router.push('/');

  } catch (error) {
    const message = errorMessage(error, 'Не удалось войти. Проверьте email и пароль.');

    console.error('Login Error:', {
      message,
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
    });

    $q.notify({
      color: 'negative',
      icon: 'report_problem',
      message,
    });
  } finally {
    loading.value = false;
  }
};
</script>
