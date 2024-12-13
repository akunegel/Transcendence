import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function RedirectHome() {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {

		if (location.pathname === "/") {
			navigate("/home");
		}

	}, [location, navigate]);

	return ;
	}

export default RedirectHome;