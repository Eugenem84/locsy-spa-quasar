<template>
  <q-card>
    <q-btn
      flat
      dense
      icon="close"
      @click="$emit('close')"
      class="absolute-top-right q-ma-sm z-top"
    />
    <q-card-section>
      <div class="text-h6">Профиль пользователя</div>
    </q-card-section>

    <q-card-section>
      <!-- Здесь будет информация о пользователе -->
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

defineEmits(['close']);

const authStore = useAuthStore();
const cityStore = useCityStore();
const router = useRouter();

const user = computed(() => authStore.user);
const cities = computed(() => cityStore.cities);
const selectedCity = ref(null);

onMounted(async () => {
  // We don't need to fetch all cities on mount,
  // as the user's city is already in the user object.
  // We will fetch cities when the user opens the select dropdown.
  if (user.value && user.value.city_id) {
    // Find the city in the potentially already loaded list or create a temporary one
    const userCity = cityStore.cities.find(c => c.id === user.value.city_id);
    if (userCity) {
      selectedCity.value = userCity;
    } else {
      // If the city is not in the list, we can pre-fill it with the known data
      // This assumes the user object from the backend contains city info.
      // Let's assume we need to fetch it to get the label.
      // A better approach is to have the city name available in the user object.
      // For now, let's just set the initial value for the select.
      // The full city list will be loaded on popup-show.
      await cityStore.fetchCities(); // fetch all to find the one
      const foundCity = cityStore.cities.find(c => c.id === user.value.city_id);
       if (foundCity) {
         selectedCity.value = foundCity;
       }
    }
  }
});


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
