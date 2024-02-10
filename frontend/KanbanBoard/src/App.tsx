import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Register from './Components/Register';
import Login from "./Components/Login";
import KanbanBoard from "./Components/KanbanBoard";

const App = () => {
  // Simulate authentication state
  const isAuthenticated = () => {
    // You should replace this with your actual authentication logic
    return localStorage.getItem("isLoggedIn") === "true";
  };

  return (
    <Router>
      <Routes>
      <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Redirect to register by default */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mainpage" element={isAuthenticated() ? <KanbanBoard /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to="/login" />} /> {/* Redirect to login by default */}
      </Routes>
    </Router>
  );
};


export default App;