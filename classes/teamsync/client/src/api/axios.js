import axios from "axios";

// The ACCESS token lives only in memory (a JS variable) - never in localStorage.
// The REFRESH token lives in an HttpOnly cookie that JavaScript cannot read.
let accessToken = null;
let onAuthFail = () => {};

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const setAuthFailHandler = (fn) => { onAuthFail = fn; };

const baseURL = import.meta.env.VITE_API_URL || "/api";
const api = axios.create({ baseURL, withCredentials: true });

// Attach the access token to every request.
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

// Ask the server for a new access token. If several requests need it at once they share ONE call
// (important because refresh tokens rotate - a token can only be used once).
let refreshPromise = null;
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.data.accessToken);
        return res.data.data;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

// If a request fails with 401 (expired access token): refresh once, then retry the request.
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.includes("/auth/");
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        await refreshAccessToken();
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        onAuthFail();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
