import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage    from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import Workspace    from "./pages/Workspace.jsx";
import { getToken } from "./api.js";

function RequireAuth({ children }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to="/login" replace />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/projects"  element={<RequireAuth><ProjectsPage /></RequireAuth>} />
        <Route path="/workspace" element={<RequireAuth><Workspace /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
