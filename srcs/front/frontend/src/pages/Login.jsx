import Form from "../components/Form"
import axios from "axios";
import {useNavigate} from "react-router-dom"

function Login() {
    const navigate = useNavigate();

    const handleGoToRegisterButton = () => {
        localStorage.clear();
        navigate("/register")
    }

    return (
        <div style={{padding:'8%'}}>
            {localStorage.clear()}
            <Form route="/api/user/token/" method="login"/>
            <button className="go-to-register-button" onClick={() => handleGoToRegisterButton()}>Create an account</button>
        </div>
    );
}

export default Login