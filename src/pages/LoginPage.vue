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

const form = ref({
  email: '',
  password: '',
});

const loading = ref(false);
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  try {
    // Ensure we have a CSRF cookie
    await api.get('/sanctum/csrf-cookie');

    // Attempt to login
    await api.post('/login', form.value);

    // Get the user data
    const response = await api.get('/api/user');
    console.log('User logged in:', response.data);

    // TODO: Save user data in a store (e.g., Pinia)

    router.push('/');

  } catch (error) {
    let errorMessage = 'Login failed. Please check your credentials.';
    if (error.response && error.response.data && error.response.data.errors) {
      errorMessage = Object.values(error.response.data.errors).flat().join(' ');
    } else if (error.response && error.response.data && error.response.data.message) {
      errorMessage = error.response.data.message;
    }
    console.error('Login Error:', errorMessage);
    // Here you would use $q.notify, but we are using console.error for now
  } finally {
    loading.value = false;
  }
};
</script>
