import "../styles/Profil.css"
import api from "../api";
import { useState } from "react";

function Profil() {
    const [user, setUser] = useState([])

    const getUser = async () => {
        const response = await api.get("/api/user/getUser/?asd")
        return (response.data)
    }
    
    const inituser = async () => {
        const TMPuser = await getUser()
        setUser(TMPuser);
    }

    // inituser()
    console.log("data", user)


    return (
        <section className="bg-profil">
            <div className="content-profil">
                Profil
            </div>
        </section>
    );
}

export default Profil