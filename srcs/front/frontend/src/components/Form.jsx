import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css"
import LoadingIndicator from "./LoadingIndicator";

function Form({route, method}) {
	const [formData, setFormData] = useState({
		username: "",
		fname: "",
		lname: "",
		email: "",
		passwd: ""
	});
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const name = method === "login" ? "Login" : "Register";

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	const handleSubmit = async (e) => {
		setLoading(true);
		e.preventDefault();

		try {
			const submitData = {
				username: formData.username,
				passwd: formData.passwd
			}

			const res = await api.post(route, submitData);

			if (method === "register" && res.data.success === false) {
				alert(res.data.errors[0]);
				return;
			}

			if (method === "login") {
				localStorage.setItem(ACCESS_TOKEN, res.data.access);
				localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
				navigate("/");
			} else {
				navigate("/login");
			}
		} catch (error) {
			if (error.response) {
				alert(error.response.data.error || error.response.data.errors?.[0] || "An error occurred");
			} else if (error.request) {
				alert("No response received from server");
			} else {
				alert("Error setting up the request");
			}		} finally {
			setLoading(false);
		}
	}

	const handleRegister42Button = () => {
		window.location.href = "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-7d9b3db113309f1f8f8e8d51caa7921dbf75d8c0089d720e05afe67fd37d19dc&redirect_uri=https%3A%2F%2Flocalhost%3A9443%2F42connect&response_type=code";
	}

	return (
		<form onSubmit={handleSubmit} className="form-container">
			<h1>{name}</h1>
			<input
				className="form-input"
				type="text"
				name="username"
				value={formData.username}
				onChange={handleChange}
				placeholder="Username"
			/>
			<input
				className="form-input"
				type="password"
				name="passwd"
				value={formData.passwd}
				onChange={handleChange}
				placeholder="Password"
			/>

			{loading && <LoadingIndicator/>}
			<button className="form-button" type="submit">{name}</button>
			<button type="button" className="form-button-2" onClick={handleRegister42Button}>{method} with 42</button>
		</form>
	);
}

export default Form;