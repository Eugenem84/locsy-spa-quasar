<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Create a new location</div>
    </q-card-section>

    <q-card-section>
      <q-form @submit="onSubmit">
        <q-input
          filled
          v-model="form.name"
          label="Name"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

        <q-input
          filled
          v-model="form.description"
          label="Description"
          type="textarea"
          lazy-rules
          :rules="[ val => val && val.length > 0 || 'Please type something']"
        />

        <q-file
          v-model="form.photos"
          label="Photos"
          multiple
          accept="image/*"
          @rejected="onRejected"
        >
          <template v-slot:prepend>
            <q-icon name="attach_file" />
          </template>
        </q-file>

        <q-btn label="Submit" type="submit" color="primary"/>
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref } from 'vue';
import { useLocationStore } from 'stores/location';

const locationStore = useLocationStore();

const form = ref({
  name: '',
  description: '',
  latitude: 55.751244, // Hardcoded for now
  longitude: 37.618423, // Hardcoded for now
  city_id: 1, // Hardcoded for now
  photos: [],
});

const onSubmit = async () => {
  const formData = new FormData();
  formData.append('name', form.value.name);
  formData.append('description', form.value.description);
  formData.append('latitude', form.value.latitude);
  formData.append('longitude', form.value.longitude);
  formData.append('city_id', form.value.city_id);

  for (const photo of form.value.photos) {
    formData.append('photos[]', photo);
  }

  await locationStore.createLocation(formData);
};

const onRejected = (rejectedEntries) => {
  // Notify the user that there was a problem with the file
  // For example, using Quasar's Notify plugin
  console.error('Rejected file:', rejectedEntries);
};
</script>
