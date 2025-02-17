import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from "./Register.module.css"
import logo from "../../assets/images/logo_register.png"
import { useTranslation } from "react-i18next";

const Register = () => {
    const navigate = useNavigate()
    const [displayError, setDisplayError] = useState("");
	const	{ t } = useTranslation();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        passwordVerif: '',
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.passwordVerif) {
            setDisplayError(t("Passwords do not match!"))
            return
        }

        if (formData.username.length > 17) {
            setDisplayError(t("Username must be 17 characters or less. (-_Dark_Sasubaka_- might be available)"))
            return
        }

        const submitData = {
            username: formData.username,
            password: formData.password,
			language: "English", //need to be put in the player table in the database, this is handled in user table
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}users/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            })

            const data = await response.json()

            if (response.ok)
                navigate('/login')
        } catch (error) {
            setDisplayError(t("Username is already taken or/and can't end with 42"))
        }
    }

    return (
        <div className={styles.center_container}>
            <img className={styles.login_image} src={logo} alt="Login logo"/>
            <form onSubmit={handleSubmit} className={styles.form_container}>
                <input
                    type="text"
                    name="username"
                    placeholder={t("Enter Username")}
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder={t("Enter Password")}
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="passwordVerif"
                    placeholder={t("Confirm Password")}
                    value={formData.passwordVerif}
                    onChange={handleChange}
                    required
                />
                {displayError && <p className={styles.error_message}>{displayError}</p>}
                <input type="submit" value={t("Register")}/>
            </form>
        </div>
    )
}

export default Register 