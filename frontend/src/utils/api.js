import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("medguard_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const login = (email, password) => api.post("/api/auth/login", { email, password });

// Facilities
export const getFacilities = () => api.get("/api/facilities/");
export const getFacility = (id) => api.get(`/api/facilities/${id}`);
export const getFacilityStats = (id) => api.get(`/api/facilities/${id}/stats`);
export const registerFacility = (data) => api.post("/api/facilities/register", data);
export const uploadProofDocument = (facilityId, formData) =>
  api.post(`/api/facilities/${facilityId}/upload-proof`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getPendingFacilities = (adminKey) =>
  api.get(`/api/facilities/admin/pending-review?admin_key=${adminKey}`);
export const verifyFacility = (facilityId, adminKey) =>
  api.post(`/api/facilities/admin/${facilityId}/verify?admin_key=${adminKey}`);

// Medicines
export const getMedicines = (facilityId, status = "all") =>
  api.get(`/api/medicines/facility/${facilityId}?status=${status}`);
export const addMedicine = (data) => api.post("/api/medicines/", data);
export const updateQuantity = (id, quantity) =>
  api.put(`/api/medicines/${id}/quantity?quantity=${quantity}`);
export const deductStock = (id, deduct_quantity) =>
  api.put(`/api/medicines/${id}/deduct`, { deduct_quantity });
export const markDisposed = (id, disposed_by) =>
  api.put(`/api/medicines/${id}/dispose`, { disposed_by });
export const deleteMedicine = (id) => api.delete(`/api/medicines/${id}`);
export const getRedistributionSuggestions = () => api.get("/api/medicines/redistribution/suggestions");
export const getStockoutPredictions = () => api.get("/api/medicines/stockout/predictions");
export const getSupplierScores = () => api.get("/api/medicines/supplier/scores");

// Invoices
export const uploadInvoice = (formData) =>
  api.post("/api/invoices/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const confirmInvoice = (data) => api.post("/api/invoices/confirm", data);

// Alerts
export const getAlerts = (facilityId) => api.get(`/api/alerts/facility/${facilityId}`);
export const triggerAlerts = () => api.post("/api/alerts/trigger");
export const getComplianceReport = (facilityId) =>
  api.get(`/api/alerts/facility/${facilityId}/compliance-report`, { responseType: "blob" });

// Patient
export const searchMedicine = (name, lat, lng, govtOnly = false) =>
  api.get(`/api/patient/search?name=${encodeURIComponent(name)}&lat=${lat}&lng=${lng}&govt_only=${govtOnly}`);
export const scanPrescription = (formData, lat, lng) =>
  api.post(`/api/patient/prescription-scan?lat=${lat}&lng=${lng}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const registerNotification = (medicine_name, whatsapp_number) =>
  api.post("/api/patient/notify-me", { medicine_name, whatsapp_number });
export const getMyNotifications = (whatsapp_number) =>
  api.get(`/api/patient/my-notifications?whatsapp_number=${encodeURIComponent(whatsapp_number)}`);
export const getTopSearches = () => api.get("/api/patient/top-searches");
export const getFacilityMedicines = (facilityId) => api.get(`/api/medicines/facility/${facilityId}`);

export default api;
