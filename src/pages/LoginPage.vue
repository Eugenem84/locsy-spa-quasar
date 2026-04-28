<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="width: 400px">
      <q-card-section>
        <div class="text-h6">Login</div>
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
            :rules="[val => !!val || 'Email is required']"
          />
          <q-input
            v-model="form.password"
            label="Password"
            type="password"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Password is required']"
          />
          <q-btn
            type="submit"
            label="Login"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { api } from 'boot/axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'stores/auth-store';

const form = ref({
  email: '',
  password: '',
});

const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  loading.value = true;
  try {
    await api.get('/sanctum/csrf-cookie');
    await api.post('/api/login', form.value);

    // Fetch user data and save it in the store
    await authStore.fetchUser();

    router.push('/');

  } catch (error) {
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.response?.data?.errors) {
      errorMessage = Object.values(error.response.data.errors).flat().join(' ');
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    console.error('Login Error:', errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>
