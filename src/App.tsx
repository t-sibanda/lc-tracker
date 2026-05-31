import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Tasks from '@/pages/Tasks';
import Zones from '@/pages/Zones';
import ZoneDetail from '@/pages/ZoneDetail';
import EquipmentPage from '@/pages/EquipmentPage';
import IssuesPage from '@/pages/IssuesPage';
import ChecklistsPage from '@/pages/ChecklistsPage';
import OwnersPage from '@/pages/OwnersPage';
import PhasesPage from '@/pages/PhasesPage';
import ActivityPage from '@/pages/ActivityPage';
import MediaGallery from '@/pages/MediaGallery';
import InventoryPage from '@/pages/InventoryPage';
import DataPage from '@/pages/DataPage';

function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/zones" element={<Zones />} />
            <Route path="/zones/:zoneName" element={<ZoneDetail />} />
            <Route path="/equipment" element={<EquipmentPage />} />
            <Route path="/issues" element={<IssuesPage />} />
            <Route path="/checklists" element={<ChecklistsPage />} />
            <Route path="/owners" element={<OwnersPage />} />
            <Route path="/phases" element={<PhasesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/media" element={<MediaGallery />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/data" element={<DataPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}

export default App;
