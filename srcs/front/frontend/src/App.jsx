import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Home from "./pages/Home/Home";
import Profile from "./pages/Profile/Profile";
import Lobby from "./pages/Lobby/Lobby";
import LocalPong from "./pages/LocalPong/LocalPong";
import OnlinePong from "./pages/OnlinePong/OnlinePong";
import NotFound from "./pages/404/NotFound";
import RedirectHome from "./pages/RedirectHome";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Friends from "./pages/Friends/Friends.jsx";
import { AuthProvider} from "./context/AuthContext.jsx";

function App() {

	return (
		<Router>
			<AuthProvider>
				<Header />
				<Routes>
					<Route path="/" element={<RedirectHome />} />
					<Route path="*" element={<NotFound />} />
					<Route path="/login" element={<Login />} />
					<Route path="/register" element={<Register />} />
					<Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
					<Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
					<Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
					<Route path="/play" element={<ProtectedRoute><RedirectHome /></ProtectedRoute>} />
					<Route path="/local" element={<ProtectedRoute><LocalPong /></ProtectedRoute>} />
					<Route path="/play/:roomId" element={<ProtectedRoute><OnlinePong /></ProtectedRoute>} />
					<Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
				</Routes>
			</AuthProvider>
		</Router>
	);
}

export default App;
