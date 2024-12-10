import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        passwordVerif: '',
        first_name: '',
        last_name: '',
        email: '',
        profile_picture: ''
    })
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (formData.password !== formData.passwordVerif) {
            alert("Passwords do not match!")
            return
        }

        const submitData = {
            username: formData.username,
            password: formData.password,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            profile_picture: formData.profile_picture || null
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(submitData)
            })

            const data = await response.json()

            if (response.ok) {
                navigate('/login')
            } else {
                alert(JSON.stringify(data))
            }
        } catch (error) {
            console.error('Registration error:', error)
            alert('Registration failed')
        }
    }

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    placeholder="Enter Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Enter Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="passwordVerif"
                    placeholder="Confirm Password"
                    value={formData.passwordVerif}
                    onChange={handleChange}
                    required
                />
                <input
                    type="text"
                    name="profile_picture"
                    placeholder="Profile Picture URL (optional)"
                    value={formData.profile_picture}
                    onChange={handleChange}
                />
                <input type="submit" value="Register"/>
            </form>
        </div>
    )
}

export default Register