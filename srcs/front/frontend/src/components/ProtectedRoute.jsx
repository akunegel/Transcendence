import { Navigate, useLocation } from "react-router-dom";
import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
    const location = useLocation();
    let { user } = useContext(AuthContext)

    return user ? (children) : (<Navigate to="/login" replace state={{ from: location }} />);
};

export default ProtectedRoute;
