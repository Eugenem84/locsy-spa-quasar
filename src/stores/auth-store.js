import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'boot/axios';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);

  // Getters
  const isLoggedIn = computed(() => !!user.value);
  const userName = computed(() => user.value?.name);

  // Actions
  function setUser(newUser) {
    user.value = newUser;
  }

  function clearUser() {
    user.value = null;
  }

  async function fetchUser() {
    try {
      const { data } = await api.get('/api/user');
      setUser(data);
    } catch (error) {
      clearUser();
      console.error('Failed to fetch user', error);
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

  return {
    user,
    isLoggedIn,
    userName,
    setUser,
    clearUser,
    fetchUser,
    handleLogout,
  };
});
