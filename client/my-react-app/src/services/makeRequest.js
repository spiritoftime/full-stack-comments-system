import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});
export function makeRequest(url, options) {
  return api(url, options)
    .then((res) => res.data)
    .catch((err) => {
      return Promise.reject(err?.response?.data?.message ?? "Error");
    });
}
// the optional chaining is for a frontend error
//err.response.data.message is only errors from our server
