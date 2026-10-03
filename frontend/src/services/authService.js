import api, { tokenStorage } from "./api";

export const authService = {
  async register({ name, email, password, confirmPassword, phone }) {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
      confirm_password: confirmPassword,
      phone: phone || undefined,
    });
    tokenStorage.set(data.access_token, true);
    return data.user;
  },

  async login({ email, password, rememberMe }) {
    const { data } = await api.post("/auth/login", { email, password, remember_me: !!rememberMe });
    tokenStorage.set(data.access_token, !!rememberMe);
    return data.user;
  },

  async logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      tokenStorage.clear();
    }
  },

  async logoutAllSessions() {
    const { data } = await api.post("/users/logout-all");
    tokenStorage.clear();
    return data;
  },

  async me() {
    const { data } = await api.get("/auth/me");
    return data;
  },

  hasToken() {
    return !!tokenStorage.get();
  },
};

export default authService;
