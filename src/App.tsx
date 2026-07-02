import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import ProjectPage from '@/pages/ProjectPage';
import CommissioningPage from '@/pages/CommissioningPage';
import SchedulePage from '@/pages/SchedulePage';
import Zones from '@/pages/Zones';
import ZoneDetail from '@/pages/ZoneDetail';
import AssetsPage from '@/pages/AssetsPage';
import IssuesPage from '@/pages/IssuesPage';
import FieldDataPage from '@/pages/FieldDataPage';
import OwnersPage from '@/pages/OwnersPage';
import ProjectsPage from '@/pages/ProjectsPage';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project" element={<ProjectPage />} />
            <Route path="/commissioning" element={<CommissioningPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/zones/:zoneName" element={<ZoneDetail />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/field-data" element={<FieldDataPage />} />
            <Route path="/team" element={<OwnersPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
