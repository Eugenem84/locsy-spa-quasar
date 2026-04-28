<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md" style="width: 400px">
      <q-card-section>
        <div class="text-h6">Register</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleRegister">
          <q-input
            v-model="form.name"
            label="Name"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Name is required']"
          />
          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Email is required', val => /.+@.+\..+/.test(val) || 'Please enter a valid email']"
          />
          <q-select
            v-model="form.city_id"
            :options="cityStore.cities"
            label="Выберите город"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            outlined
            dense
            use-input
            clearable
            @filter="(val, update) => cityStore.fetchCities(val).then(() => update())"
            class="q-mb-md"
            :rules="[val => !!val || 'City is required']"
          >
            <template v-slot:no-option>
              <q-item>
                <q-item-section class="text-grey">
                  Город не найден
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-input
            v-model="form.password"
            label="Password"
            type="password"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => !!val || 'Password must be at least 8 characters']"
          />
          <q-input
            v-model="form.password_confirmation"
            label="Confirm Password"
            type="password"
            outlined
            dense
            class="q-mb-md"
            :rules="[val => val === form.password || 'Passwords do not match']"
          />
          <q-btn
            type="submit"
            label="Register"
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
import { ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useRouter } from 'vue-router';
import { useCityStore } from 'stores/city';

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  city_id: null
});

const cityStore = useCityStore();
const loading = ref(false);
const router = useRouter();

onMounted(() => {
  cityStore.fetchCities();
});

const handleRegister = async () => {
  loading.value = true;
  try {
    // First, get the CSRF cookie. This is crucial for web routes.
    await api.get('/sanctum/csrf-cookie');

    // Then, attempt to register using the web route.
    await api.post('/api/register', form.value);

    // If registration is successful, you might want to automatically log the user in
    // or redirect them to the login page. Here we redirect to home.
    console.log('Registration successful! Please log in.');
    router.push('/'); // Or '/login'

  } catch (error) {
    let errorMessage = 'An error occurred during registration.';
    if (error.response && error.response.data) {
        // Extract validation errors
        const errors = error.response.data;
        if (error.response.status === 419) {
            errorMessage = 'Your session has expired. Please refresh the page.';
        } else if (errors.errors) { // Laravel validation errors are under 'errors' key
            const firstErrorKey = Object.keys(errors.errors)[0];
            errorMessage = errors.errors[firstErrorKey][0];
        } else if (errors.message) {
            errorMessage = errors.message;
        }
    } else if (error.message) {
        errorMessage = error.message;
    }
    console.error('Registration Error:', errorMessage);
  } finally {
    loading.value = false;
  }
};
</script>
