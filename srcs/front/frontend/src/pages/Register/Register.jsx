import Form from "../../components/Form"
import {useNavigate} from "react-router-dom"
import styles from "./Register.module.css";
import logo from "../../assets/images/logo_shadowed.png";
import sublogo from "../../assets/images/logo_under.png";
import React from "react";

function Register() {

    const navigate = useNavigate();

    const handleGoToLoginButton = () => {
        localStorage.clear();
        navigate("/login")
    }

    return (
        <>
            <div className={styles.logo_container}>
                <img className={styles.up_logo} src={logo} alt="TRANSCENDENCE"/>
                <br/>
                <img className={styles.sub_logo} src={sublogo}/>
            </div>
            <div style={{padding: '8%'}}>
                {localStorage.clear()}
                <Form route="/user/register/" method="register"/>
                <button className="go-to-register-button" onClick={() => handleGoToLoginButton()}>Login</button>
            </div>
        </>
    );
}

export default Register