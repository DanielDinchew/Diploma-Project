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
  return (
    <Router>
      <Routes>  
        <Route path="/" element={<Navigate to="/Login" />} /> {/* Redirect to login by default */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/KanbanBoard" element={ <KanbanBoard /> } />
      </Routes>
    </Router>
  );
};

export default App;