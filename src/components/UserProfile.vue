<template>
  <q-card>
    <q-btn
      flat
      dense
      icon="close"
      @click="$emit('close')"
      class="absolute-top-right q-ma-sm z-top"
    />
    <q-card-section class="flex flex-center column">
      <div class="text-h6">Профиль пользователя</div>
      <q-avatar size="100px" class="q-mb-md">
        <img :src="user.avatar || 'https://cdn.quasar.dev/img/avatar.png'" alt="User Avatar">
      </q-avatar>
      <q-file
        v-model="avatarFile"
        label="Загрузить аватар"
        filled
        dense
        accept="image/*"
        @update:model-value="handleAvatarUpload"
        style="max-width: 200px"
      />
    </q-card-section>

    <q-card-section>
      <p>Имя: {{ user.name }}</p>
      <p>Email: {{ user.email }}</p>
      <q-select
        filled
        v-model="selectedCity"
        :options="cities"
        label="Город"
        @update:model-value="updateCity"
        @popup-show="() => cityStore.fetchCities()"
      >
        <template v-slot:before-options>
          <q-item>
            <q-item-section>
              <q-input
                dense
                autofocus
                placeholder="Поиск..."
                @update:model-value="val => cityStore.fetchCities(val)"
                debounce="300"
              />
            </q-item-section>
          </q-item>
        </template>
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              Город не найден
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </q-card-section>

    <q-separator />

    <q-card-actions align="right">
      <q-btn flat label="Выйти" color="primary" @click="logout" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useAuthStore } from 'stores/auth-store';
import { useCityStore } from 'stores/city';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar'; // Import useQuasar for notifications

defineEmits(['close']);

const authStore = useAuthStore();
const cityStore = useCityStore();
const router = useRouter();
const $q = useQuasar(); // Initialize useQuasar

const user = computed(() => authStore.user);
const cities = computed(() => cityStore.cities);
const selectedCity = ref(null);
const avatarFile = ref(null); // To hold the selected file

onMounted(async () => {
  if (user.value && user.value.city_id) {
    const userCity = cityStore.cities.find(c => c.id === user.value.city_id);
    if (userCity) {
      selectedCity.value = userCity;
    } else {
      await cityStore.fetchCities();
      const foundCity = cityStore.cities.find(c => c.id === user.value.city_id);
       if (foundCity) {
         selectedCity.value = foundCity;
       }
    }
  }
});

async function handleAvatarUpload(file) {
  if (!file) {
    return;
  }
  try {
    await authStore.uploadAvatar(file);
    $q.notify({
      type: 'positive',
      message: 'Аватар успешно обновлен!'
    });
    avatarFile.value = null; // Clear the file input
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке аватара: ' + (error.response?.data?.message || error.message)
    });
  }
}

async function updateCity(city) {
  selectedCity.value = city;
  await authStore.updateUserCity(city.id);
  cityStore.setSelectedCity(city);
}

async function logout() {
  await authStore.logout();
  router.push('/');
}
</script>

<style scoped>
.q-card {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}
</style>
