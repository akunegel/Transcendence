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
			<button type="button" className="form-button-2">{method} with 42</button>
		</form>
	);
}

export default Form;