import React, { useState } from 'react';
import Navbar from './components/Navbar';
import StatusCounters from './components/StatusCounters';
import TopologyCanvas from './components/dashboard/TopologyCanvas';
import InventoryTable from './components/inventory/InventoryTable';
import FloorplanEditor from './components/mapping/FloorplanEditor';
import ReportsView from './components/reports/ReportsView';
import LoginPage from './components/auth/LoginPage';
import { LogOut } from 'lucide-react';
import { DeviceProvider } from './context/DeviceContext';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedNetwork, setSelectedNetwork] = useState('ALL'); // 'ALL' | 'LAN' | 'CCTV'

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <DeviceProvider>
      <div className="min-h-screen bg-[#0a0e17] text-slate-100 flex flex-col font-sans">
        {/* Top Navbar dengan Switcher Multi-Network */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedNetwork={selectedNetwork}
          setSelectedNetwork={setSelectedNetwork}
        />

        <main className="flex-1 w-full mx-auto p-4 flex flex-col gap-4">
          {/* Status Counter Bar */}
          <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/80">
            <StatusCounters />

            <div className="flex items-center gap-4">
              <div className="text-xs font-mono text-slate-400 hidden sm:block">
                Cikampek, {new Date().toLocaleTimeString('id-ID')} WIB
              </div>

              <button
                onClick={() => setIsAuthenticated(false)}
                className="flex items-center gap-1.5 text-xs font-bold font-mono px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                title="Keluar Aplikasi"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>

          {/* Dynamic Navigation Views */}
          {activeTab === 'dashboard' && (
            <TopologyCanvas selectedNetwork={selectedNetwork} />
          )}
          {activeTab === 'inventory' && <InventoryTable />}

          {/* 2. Tampilkan FloorplanEditor saat tab 'mapping' aktif */}
          {activeTab === 'mapping' && <FloorplanEditor />}

          {activeTab === 'reports' && <ReportsView />}
        </main>
      </div>
    </DeviceProvider>
  );
}