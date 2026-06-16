import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage    from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import Workspace    from "./pages/Workspace.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to="/login" replace />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/register"  element={<RegisterPage />} />
        <Route path="/projects"  element={<ProjectsPage />} />
        <Route path="/workspace" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;