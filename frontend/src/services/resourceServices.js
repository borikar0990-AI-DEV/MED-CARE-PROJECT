import api from "./api";

/** HTML <input type="time"> emits "HH:MM". Pad to "HH:MM:SS" so the payload
 * always matches Python's time.isoformat() exactly, regardless of how
 * leniently (or not) the backend's parser handles a missing seconds part. */
function normalizeSchedules(schedules) {
  if (!Array.isArray(schedules)) return schedules;
  return schedules.map((s) => ({
    ...s,
    time: typeof s.time === "string" && s.time.length === 5 ? `${s.time}:00` : s.time,
  }));
}

/** Medicines: CRUD + pause/resume. */
export const medicationService = {
  async list({ search, type, isActive, sortBy = "created_at", sortDir = "desc", page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get("/medications", {
      params: { search, type, is_active: isActive, sort_by: sortBy, sort_dir: sortDir, page, page_size: pageSize },
    });
    return data; // { items, total, page, page_size, total_pages }
  },
  async get(id) {
    const { data } = await api.get(`/medications/${id}`);
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/medications", { ...payload, schedules: normalizeSchedules(payload.schedules) });
    return data;
  },
  async update(id, payload) {
    const { data } = await api.put(`/medications/${id}`, { ...payload, schedules: normalizeSchedules(payload.schedules) });
    return data;
  },
  async remove(id) {
    await api.delete(`/medications/${id}`);
  },
  async pause(id) {
    const { data } = await api.put(`/medications/${id}/pause`);
    return data;
  },
  async resume(id) {
    const { data } = await api.put(`/medications/${id}/resume`);
    return data;
  },
};

/** Individual reminder times (usually managed inline via medicationService, exposed standalone too). */
export const scheduleService = {
  async list(medicationId) {
    const { data } = await api.get("/schedules", { params: { medication_id: medicationId } });
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/schedules", { ...payload, time: normalizeSchedules([payload])[0].time });
    return data;
  },
  async update(id, payload) {
    const body = payload.time ? { ...payload, time: normalizeSchedules([payload])[0].time } : payload;
    const { data } = await api.put(`/schedules/${id}`, body);
    return data;
  },
  async remove(id) {
    await api.delete(`/schedules/${id}`);
  },
};

/** Dose occurrences: the Taken / Skipped actions, history, and calendar all read/write here. */
export const logService = {
  async list({ startDate, endDate, medicationId, status, page = 1, pageSize = 50 } = {}) {
    const { data } = await api.get("/logs", {
      params: {
        start_date: startDate,
        end_date: endDate,
        medication_id: medicationId,
        status,
        page,
        page_size: pageSize,
      },
    });
    return data;
  },
  async create(payload) {
    const { data } = await api.post("/logs", payload);
    return data;
  },
  /** status: "taken" | "skipped" | "missed" | "pending" */
  async setStatus(id, statusValue, notes) {
    const { data } = await api.put(`/logs/${id}`, { status: statusValue, notes });
    return data;
  },
};

/** Dashboard summary cards, today's timeline, and statistics charts. */
export const dashboardService = {
  async summary() {
    const { data } = await api.get("/dashboard/summary");
    return data;
  },
  async statistics(days = 7) {
    const { data } = await api.get("/dashboard/statistics", { params: { days } });
    return data;
  },
};

/** In-app notification feed (bell dropdown + full Notification Center page). */
export const notificationService = {
  async list({ unreadOnly = false, limit = 50 } = {}) {
    const { data } = await api.get("/notifications", { params: { unread_only: unreadOnly, limit } });
    return data;
  },
  async markRead(id) {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },
  async markAllRead() {
    const { data } = await api.put("/notifications/read-all");
    return data;
  },
  async remove(id) {
    await api.delete(`/notifications/${id}`);
  },
};

/** Profile management. */
export const userService = {
  async getProfile() {
    const { data } = await api.get("/users/profile");
    return data;
  },
  async updateProfile(payload) {
    const { data } = await api.put("/users/profile", payload);
    return data;
  },
  async changePassword({ currentPassword, newPassword, confirmNewPassword }) {
    const { data } = await api.put("/users/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    });
    return data;
  },
  async uploadPhoto(file) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/users/profile/photo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

/** AI-ready module — see backend app/routers/ai.py for what's real vs. future scope. */
export const aiService = {
  async parseMedicationText(text) {
    const { data } = await api.post("/ai/parse-medication-text", { text });
    return data;
  },
  async status() {
    const { data } = await api.get("/ai/status");
    return data;
  },
};
