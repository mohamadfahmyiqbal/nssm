import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TopologyCanvas from './components/dashboard/TopologyCanvas';
import InventoryTable from './components/inventory/InventoryTable';
import FloorplanEditor from './components/mapping/FloorplanEditor';
import ReportsView from './components/reports/ReportsView';
import IncidentManagerView from './components/incidents/IncidentManagerView';
import UserManagementView from './components/users/UserManagementView';
import ScheduleGanttView from './components/schedules/ScheduleGanttView';
import WorkOrderManagerView from './components/workorders/WorkOrderManagerView';
import LoginPage from './components/auth/LoginPage';
import { DeviceProvider } from './context/DeviceContext';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabTitles = useMemo(() => ({
    dashboard: 'Network Topology Visualizer',
    inventory: 'Device Inventory & Configurations',
    schedules: 'ITAM Maintenance Schedules & Gantt Timeline',
    workorders: 'Work Order & Man Power Allocation',
    incidents: 'Incident & Anomaly Management',
    mapping: 'Location & Floorplan Mapping',
    reports: 'System Reports & SLA Analytics',
    users: 'User & Access Control Management'
  }), []);

  const [preselectedIncidentTask, setPreselectedIncidentTask] = useState(null);

  const handleNavigateToIncidents = (task) => {
    setPreselectedIncidentTask(task);
    setActiveTab('incidents');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <AuthProvider>
      <DeviceProvider>
        <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex font-sans overflow-hidden">
          {/* Left Mini Sidebar */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={() => setIsAuthenticated(false)}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            {/* Top Header Navbar */}
            <Navbar activeTabTitle={tabTitles[activeTab] || 'NTMS Portal'} />

            {/* Scrollable Viewport / Canvas Container */}
            <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Dynamic Navigation Views */}
              {activeTab === 'dashboard' && (
                <TopologyCanvas 
                  selectedNetwork="ALL" 
                  onNavigateToIncidents={handleNavigateToIncidents}
                />
              )}
              {activeTab === 'inventory' && <InventoryTable />}
              {activeTab === 'schedules' && <ScheduleGanttView />}
              {activeTab === 'workorders' && <WorkOrderManagerView />}
              {activeTab === 'incidents' && (
                <IncidentManagerView 
                  initialTask={preselectedIncidentTask}
                  onClearInitialTask={() => setPreselectedIncidentTask(null)}
                />
              )}
              {activeTab === 'mapping' && <FloorplanEditor />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'users' && <UserManagementView />}
            </main>
          </div>
        </div>
      </DeviceProvider>
    </AuthProvider>
  );
}