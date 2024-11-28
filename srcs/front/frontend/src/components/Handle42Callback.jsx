import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function Handle42Callback() {
    const location = useLocation();
    const navigate = useNavigate();
    const [hasExchangedCode, setHasExchangedCode] = useState(false);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');

        if (code && !hasExchangedCode) {
            setHasExchangedCode(true);
            const exchangeOAuthCode = async () => {
                try {
                    const response = await api.get(`/oauth/42/?code=${code}`);
                    localStorage.setItem(ACCESS_TOKEN, response.data.access);
                    localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
                    navigate("/home");
                } catch {
                    ;
                }
            };

            exchangeOAuthCode();
        }
    }, [location, navigate, hasExchangedCode]);


    return <div>Processing 42 Login...</div>;
}

export default Handle42Callback