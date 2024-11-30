import Form from "../../components/Form"
import axios from "axios";
import {useNavigate} from "react-router-dom"
import styles from "../Register/Register.module.css";
import logo from "../../assets/images/logo_shadowed.png";
import sublogo from "../../assets/images/logo_under.png";
import React from "react";

function Login() {
    const navigate = useNavigate();

    const handleGoToRegisterButton = () => {
        localStorage.clear();
        navigate("/register")
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
                <Form route="/user/login/" method="login"/>
                <button className="go-to-register-button" onClick={() => handleGoToRegisterButton()}>Create an account
                </button>
            </div>
        </>
    );
}

export default Login