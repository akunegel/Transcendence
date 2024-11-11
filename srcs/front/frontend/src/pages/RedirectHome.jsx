import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// When on root url '/', client will be automatically redirected to '/home'
function RedirectHome() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {

		if (location.pathname === "/") {
			navigate("/home");
		}

	}, [location, navigate]);

	return (<></>);
	}

export default RedirectHome;