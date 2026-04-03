import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'boot/axios';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);

  // Getters
  const isLoggedIn = computed(() => !!user.value);
  const userName = computed(() => {
    if (user.value?.photographer_profile?.display_name) {
      return user.value.photographer_profile.display_name;
    }
    return user.value?.name;
  });

  // Actions
  function setUser(newUser) {
    user.value = newUser;
    console.log('User object set in store:', user.value); // Added for debugging
  }

  function clearUser() {
    user.value = null;
  }

  async function getCsrfCookie() {
    // This action is crucial for Laravel Sanctum authentication.
    // It fetches the CSRF token that Sanctum needs to verify subsequent requests.
    try {
      await api.get('/sanctum/csrf-cookie');
    } catch (error) {
      console.error('Failed to get CSRF cookie', error);
    }
  }

  async function fetchUser() {
    // We must get the CSRF cookie before trying to fetch the user.
    await getCsrfCookie();
    try {
      const { data } = await api.get('/api/user');
      setUser(data);
    } catch (error) {
      console.error(error)
      clearUser();
      // No need to log error here as it's expected if user is not logged in.
    }
  }

  async function handleLogout() {
    try {
      await api.post('/logout');
      clearUser();
    } catch (error) {
      console.error('Failed to logout', error);
    }
  }

  async function updateUserCity(cityId) {
    try {
      const { data } = await api.put('/api/user/city', { city_id: cityId });
      setUser(data.user);
    } catch (error) {
      console.error('Failed to update user city', error);
    }
  }

  async function uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser(data.user); // Assuming the backend returns the updated user object
    } catch (error) {
      console.error('Failed to upload avatar', error);
      throw error; // Re-throw to be handled by the component
    }
  }

  return {
    user,
    isLoggedIn,
    userName,
    setUser,
    clearUser,
    getCsrfCookie, // Exporting for potential use elsewhere
    fetchUser,
    handleLogout,
    updateUserCity,
    uploadAvatar, // Export the new action
  };
});
