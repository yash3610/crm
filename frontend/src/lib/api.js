const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_URL, window.location.origin).origin;

function getToken() {
  return localStorage.getItem("billpro_token");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => ({
    success: false,
    message:
      response.status === 413
        ? "The upload is too large. Choose smaller images and try again."
        : "Invalid server response",
  }));

  if (!response.ok) {
    const error = new Error(result.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  return result.data;
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, data) =>
    apiRequest(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) =>
    apiRequest(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) =>
    apiRequest(path, { method: "PATCH", body: JSON.stringify(data) }),
  upload: (path, file) =>
    apiRequest(path, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};

export function assetUrl(value) {
  if (!value || value.startsWith("data:") || /^https?:\/\//i.test(value)) {
    return value;
  }
  return new URL(value, API_ORIGIN).toString();
}
