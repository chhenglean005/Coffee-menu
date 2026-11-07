import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

function toMenuFormData(product) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(product)) {
    if (key === "imageFile") {
      if (value) formData.append("image", value);
    } else if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  }
  return formData;
}

export function resolveImageUrl(image) {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return new URL(image, "http://localhost:5000").toString();
}

export async function fetchProducts() {
  const { data } = await api.get("/menu");
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function createProduct(product) {
  const { data } = await api.post("/menu", toMenuFormData(product));
  return data;
}

export async function updateProduct(id, product) {
  const { data } = await api.put(`/menu/${id}`, toMenuFormData(product));
  return data;
}

export async function deleteProduct(id) {
  const { data } = await api.delete(`/menu/${id}`);
  return data;
}

export async function getCurrentUser() {
  try {
    const { data } = await api.get("/auth/me");
    return data.user;
  } catch (error) {
    if (error.response?.status === 401) return null;
    throw error;
  }
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchUsers() {
  const { data } = await api.get("/auth/users");
  return data;
}

export async function createStaffUser(email, password) {
  const { data } = await api.post("/auth/users", { email, password });
  return data.user;
}

export async function deleteStaffUser(id) {
  await api.delete(`/auth/users/${id}`);
}

export default api;
