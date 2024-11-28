import { createStore } from "vuex";

export default createStore({
  state: {
    categories: [],
  },
  mutations: {
    setCategories(state, categories) {
      state.categories = categories;
    },
  },
  actions: {
    updateCategories({ commit }, categories) {
      commit("setCategories", categories);
    },
  },
  getters: {
    getCategories: (state) => state.categories,
  },
});
