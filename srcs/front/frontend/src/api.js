import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem(ACCESS_TOKEN);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response && error.response.status === 401) {
			const refreshToken = localStorage.getItem(REFRESH_TOKEN);
			console.log("Access Token:", localStorage.getItem(ACCESS_TOKEN));
			console.log("Refresh Token:", localStorage.getItem(REFRESH_TOKEN));
			if (refreshToken) {
				try {
					const refreshResponse = await axios.post(
						`${import.meta.env.VITE_API_URL}/token/refresh/`,
						{ refresh: refreshToken }
					);
					const newAccessToken = refreshResponse.data.access;
					localStorage.setItem(ACCESS_TOKEN, newAccessToken);
					error.config.headers.Authorization = `Bearer ${newAccessToken}`;
					return axios(error.config);
				} catch (refreshError) {
					console.error("Token refresh failed:", refreshError);
					localStorage.clear();
					window.location.href = "/login";
				}
			}
		}
		return Promise.reject(error);
	}
);

export default api;
