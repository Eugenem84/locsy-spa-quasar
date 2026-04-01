<template>
  <q-card style="width: 500px">
    <q-card-section>
      <div class="text-h6">Добавить новую локацию</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit.prevent="submitForm">
        <q-input
          v-model="form.name"
          label="Название"
          filled
          required
          :error="!!errors.name"
          :error-message="errors.name?.join(', ')"
        />

        <q-input
          v-model="form.description"
          label="Описание"
          type="textarea"
          filled
          required
          class="q-mt-md"
          :error="!!errors.description"
          :error-message="errors.description?.join(', ')"
        />

        <!-- Поле для выбора категорий -->
        <q-select
          v-model="form.category_ids"
          label="Категории"
          filled
          multiple
          :options="categoryOptions"
          option-value="id"
          option-label="name"
          emit-value
          map-options
          use-chips
          class="q-mt-md"
          :loading="categoryStore.isLoading"
          :error="!!errors.category_ids"
          :error-message="errors.category_ids?.join(', ')"
        >
          <template v-slot:no-option>
            <q-item>
              <q-item-section class="text-grey">
                {{ categoryStore.isLoading ? 'Загрузка категорий...' : 'Категории не найдены' }}
              </q-item-section>
            </q-item>
</template>
        </q-select>

        <q-file
          v-model="form.photos"
          label="Фотографии"
          filled
          multiple
          accept="image/*"
          class="q-mt-md"
          :error="!!errors.photos"
          :error-message="errors.photos?.join(', ')"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>

        <q-card-actions align="right" class="q-mt-md">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn type="submit" label="Создать" color="primary" :loading="loading" />
        </q-card-actions>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useLocationStore } from "stores/location";
import { useCityStore } from "stores/city";
import { useCategoryStore } from "stores/category";
//import { error } from '@quasar/app-vite/lib/utils/logger.js'

const props = defineProps({
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['location-created']);

const $q = useQuasar();
const locationStore = useLocationStore();
const cityStore = useCityStore();
const categoryStore = useCategoryStore();

const form = ref({
  name: '',
  description: '',
  category_ids: [],
  photos: [],
});
const errors = ref({});
const loading = ref(false);

// Вычисляемое свойство для опций категорий
const categoryOptions = computed(() => {
  return categoryStore.categories.map(category => ({
    id: category.id,
    name: category.name
  }));
});

// Загружаем категории при монтировании компонента
onMounted(async () => {
  try {
    await categoryStore.fetchCategories();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    $q.notify({
        color: 'negative',
      message: 'Ошибка при загрузке категорий',
        icon: 'report_problem',
      });
    }
});

async function submitForm() {
  if (!cityStore.selectedCity) {
    $q.notify({
      color: 'negative',
      message: 'Пожалуйста, выберите город перед созданием локации.',
      icon: 'report_problem',
    });
    return;
  }

  loading.value = true;
  errors.value = {};

  console.log('Submitting with category IDs:', form.value.category_ids);

  const formData = new FormData();
  formData.append('name', form.value.name);
  formData.append('description', form.value.description);
  formData.append('latitude', props.latitude);
  formData.append('longitude', props.longitude);
  formData.append('city_id', cityStore.selectedCity.id);

  // Добавляем выбранные категории
  if (form.value.category_ids && form.value.category_ids.length > 0) {
    form.value.category_ids.forEach(categoryId => {
      formData.append('category_ids[]', categoryId);
    });
}

  if (form.value.photos && form.value.photos.length > 0) {
    for (const photo of form.value.photos) {
      formData.append('photos[]', photo);
    }
  }

  try {
    await locationStore.createLocation(formData);

    $q.notify({
      color: 'positive',
      message: 'Локация успешно создана!',
      icon: 'check',
    });

    emit('location-created');

  } catch (error) {
    if (error.response && error.response.status === 422) {
      errors.value = error.response.data.errors;
    } else {
      $q.notify({
        color: 'negative',
        message: 'Ошибка при создании локации. Пожалуйста, попробуйте еще раз.',
        icon: 'report_problem',
      });
    }
  } finally {
    loading.value = false;
  }
}
</script>
