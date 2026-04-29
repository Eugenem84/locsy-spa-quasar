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

  function logApiError(context, error) {
    console.error(`[AuthStore] ${context}`, {
      message: error?.message,
      status: error?.response?.status,
      url: error?.config?.url,
      method: error?.config?.method,
      response: error?.response?.data,
    });
  }

  async function getCsrfCookie() {
    try {
      await api.get('/sanctum/csrf-cookie');
    } catch (error) {
      logApiError('Failed to get CSRF cookie', error);
      throw error;
    }
  }

  async function fetchUser() {
    await getCsrfCookie();
    try {
      const { data } = await api.get('/api/user');
      setUser(data);
    } catch (error) {
      logApiError('Failed to fetch user', error);
      clearUser();
    }
  }

  async function handleLogout() {
    try {
      await getCsrfCookie();
      await api.post('/api/logout');
    } catch (error) {
      logApiError('Failed to logout', error);
    } finally {
      clearUser();
    }
  }

  async function updateUserCity(cityId) {
    try {
      const { data } = await api.put('/api/user/city', { city_id: cityId });
      setUser(data.user);
    } catch (error) {
      logApiError('Failed to update user city', error);
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
      logApiError('Failed to upload avatar', error);
      throw error; // Re-throw to be handled by the component
    }
  }

  return {
    user,
    isLoggedIn,
    userName,
    setUser,
    clearUser,
    getCsrfCookie,
    fetchUser,
    handleLogout,
    updateUserCity,
    uploadAvatar, // Export the new action
  };
});
