import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { WebSocketProvider } from './context/WebSocketContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ThreatChecker } from './components/ThreatChecker.tsx';
import { ThreatCategories } from './components/ThreatCategories.tsx';
import { ComplaintPortal } from './components/ComplaintPortal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { UserDashboard } from './components/UserDashboard.tsx';
import { AwarenessSection } from './components/AwarenessSection.tsx';
import { EmergencyHelpModal } from './components/EmergencyHelpModal.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { Footer } from './components/Footer.tsx';

function MainApp() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // Pre-fill state when jumping from ThreatChecker or Category to Complaints
  const [complaintPrefill, setComplaintPrefill] = useState<{
    category?: string;
    description?: string;
    url?: string;
  }>({});

  const handleReportPrefill = (data: { category: string; description: string; url?: string }) => {
    setComplaintPrefill(data);
    setCurrentTab('complaints');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReportCategory = (categoryTitle: string) => {
    setComplaintPrefill({
      category: categoryTitle,
      description: `Report regarding incidents involving ${categoryTitle}.`,
    });
    setCurrentTab('complaints');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-cyber-grid text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      
      {/* Top Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEmergency={() => setEmergencyOpen(true)}
      />

      {/* Main Viewport Routing */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <div className="space-y-16">
            <HeroSection
              onCheckThreat={() => {
                setCurrentTab('threat-checker');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onReportIncident={() => {
                setComplaintPrefill({});
                setCurrentTab('complaints');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Inlined interactive Threat Scanner */}
            <ThreatChecker onReportPrefill={handleReportPrefill} />

            {/* Cyber Threat Categories Dossier */}
            <ThreatCategories onReportCategory={handleReportCategory} />

            {/* Cyber Awareness Spotlights */}
            <AwarenessSection onReportIncident={handleReportCategory} />
          </div>
        )}

        {currentTab === 'threat-checker' && (
          <div className="pt-6">
            <ThreatChecker onReportPrefill={handleReportPrefill} />
          </div>
        )}

        {currentTab === 'threats' && (
          <div className="pt-6">
            <ThreatCategories onReportCategory={handleReportCategory} />
          </div>
        )}

        {currentTab === 'complaints' && (
          <div className="pt-6">
            <ComplaintPortal
              initialCategory={complaintPrefill.category}
              initialDescription={complaintPrefill.description}
              initialUrl={complaintPrefill.url}
            />
          </div>
        )}

        {currentTab === 'awareness' && (
          <div className="pt-6">
            <AwarenessSection onReportIncident={handleReportCategory} />
          </div>
        )}

        {currentTab === 'dashboard' && (
          <div className="pt-6">
            <UserDashboard onNavigate={(tab) => setCurrentTab(tab)} />
          </div>
        )}

        {currentTab === 'admin' && (
          <div>
            <AdminPortal />
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigate={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenEmergency={() => setEmergencyOpen(true)}
      />

      {/* Emergency Modal */}
      <EmergencyHelpModal
        isOpen={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onFileComplaint={() => {
          setComplaintPrefill({});
          setCurrentTab('complaints');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Real-Time WebSocket Toast Notifications */}
      <ToastContainer />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainApp />
      </WebSocketProvider>
    </AuthProvider>
  );
}
