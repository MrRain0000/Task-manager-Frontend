import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import InvitationsPage from './pages/InvitationsPage'
import TeamPage from './pages/TeamPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailsPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
        <Route path="/team" element={<TeamPage />} />
      </Routes>
    </Router>
  )
}

export default App
