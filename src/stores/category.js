import { defineStore } from 'pinia';
import { api } from 'boot/axios'; // Предполагается, что у вас есть настроенный axios

export const useCategoryStore = defineStore('category', {
  state: () => ({
    categories: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    allCategories: (state) => state.categories,
    getCategoryById: (state) => (id) => {
      return state.categories.find(category => category.id === id);
    },
  },

  actions: {
    async fetchCategories() {
      if (this.categories.length > 0 && !this.isLoading) {
        // Категории уже загружены, и нет активной загрузки
        return;
      }

      this.isLoading = true;
      this.error = null;
      try {
        const response = await api.get('/api/categories');
        this.categories = response.data;
      } catch (error) {
        this.error = 'Failed to fetch categories: ' + error.message;
        console.error(this.error, error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});
