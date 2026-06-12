const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    message: "Invalid server response",
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
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};
