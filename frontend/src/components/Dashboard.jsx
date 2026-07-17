import React, { useState } from 'react';
import Overview from './Overview';
import CrimeMap from './CrimeMap';
import ComplaintAnalytics from './ComplaintAnalytics';
import NetworkGraph from './NetworkGraph';
import VoiceQuery from './VoiceQuery';
import AIClassifier from './AIClassifier';
import PredictiveIntel from './PredictiveIntel';
import AnomalyDetection from './AnomalyDetection';

// New Features imports
import FIRAssistant from './FIRAssistant';
import SuspectSearch from './SuspectSearch';
import CrimeBriefing from './CrimeBriefing';
import MissingPersons from './MissingPersons';
import LiveIntelFeed from './LiveIntelFeed';

// 6 Enhanced dashboards
import DistrictStats from './DistrictStats';
import CrimeCalendar from './CrimeCalendar';
import CaseTracker from './CaseTracker';
import ResourceDeployment from './ResourceDeployment';
import VictimRegistry from './VictimRegistry';
import EvidenceLocker from './EvidenceLocker';

import OverviewOfficial from './OverviewOfficial';

import { 
  LayoutDashboard, 
  Map, 
  SearchCode, 
  Share2, 
  Mic, 
  BrainCircuit, 
  LogOut, 
  ShieldAlert,
  Shield,
  TrendingUp,
  Clipboard,
  Search,
  FileText,
  UserX,
  Radio,
  Calendar,
  Briefcase,
  Users,
  Heart,
  Archive,
  BarChart3
} from 'lucide-react';

function Dashboard({ 
  token, 
  user, 
  role,
  flaggedCases,
  addFlaggedCase,
  scrbEscalations,
  addScrbEscalation,
  removeScrbEscalation,
  onLogout 
}) {
  const [activeTab, setActiveTab] = useState(role === 'higher_official' ? 'overview-official' : 'overview');
  const [searchCaseId, setSearchCaseId] = useState('');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview-official':
        return (
          <OverviewOfficial 
            scrbEscalations={scrbEscalations} 
            removeScrbEscalation={removeScrbEscalation} 
          />
        );
      case 'overview':
        return (
          <Overview 
            flaggedCases={flaggedCases}
            scrbEscalations={scrbEscalations}
          />
        );
      case 'crimemap':
        return <CrimeMap />;
      case 'analytics':
        return <ComplaintAnalytics />;
      case 'network':
        return <NetworkGraph />;
      case 'predictive':
        return <PredictiveIntel />;
      case 'anomaly':
        return (
          <AnomalyDetection 
            flaggedCases={flaggedCases}
            addFlaggedCase={addFlaggedCase}
            scrbEscalations={scrbEscalations}
            addScrbEscalation={addScrbEscalation}
          />
        );
      case 'voice':
        return <VoiceQuery />;
      case 'classifier':
        return <AIClassifier />;
      
      // Operations and support
      case 'fir':
        return <FIRAssistant />;
      case 'suspect':
        return <SuspectSearch />;
      case 'briefing':
        return <CrimeBriefing />;
      case 'missing':
        return <MissingPersons />;
      case 'live':
        return <LiveIntelFeed />;
        
      // 6 Enhanced cases
      case 'district-stats':
        return <DistrictStats onNavigateToCase={(caseId) => {
          setSearchCaseId(caseId);
          setActiveTab('case-tracker');
        }} />;
      case 'crime-calendar':
        return <CrimeCalendar onNavigateToCase={(caseId) => {
          setSearchCaseId(caseId);
          setActiveTab('case-tracker');
        }} />;
      case 'case-tracker':
        return <CaseTracker initialSearchId={searchCaseId} clearInitialSearchId={() => setSearchCaseId("")} />;
      case 'resource-deployment':
        return <ResourceDeployment />;
      case 'victim-registry':
        return <VictimRegistry onNavigateToCase={(caseId) => {
          setSearchCaseId(caseId);
          setActiveTab('case-tracker');
        }} />;
      case 'evidence-locker':
        return <EvidenceLocker />;
        
      default:
        return role === 'higher_official' ? <OverviewOfficial scrbEscalations={scrbEscalations} removeScrbEscalation={removeScrbEscalation} /> : <Overview flaggedCases={flaggedCases} scrbEscalations={scrbEscalations} />;
    }
  };

  const menuSections = [
    {
      title: 'ANALYTICS',
      items: [
        { id: role === 'higher_official' ? 'overview-official' : 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'crimemap', label: 'Crime Map', icon: Map },
        { id: 'district-stats', label: 'District Statistics', icon: BarChart3 },
        { id: 'crime-calendar', label: 'Crime Calendar', icon: Calendar }
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'network', label: 'Network Analysis', icon: Share2 },
        { id: 'predictive', label: 'Predictive Intelligence', icon: TrendingUp },
        { id: 'anomaly', label: 'Anomaly Detection', icon: ShieldAlert },
        { id: 'live', label: 'Live Intel Feed', icon: Radio }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'fir', label: 'FIR Assistant', icon: Clipboard },
        { id: 'suspect', label: 'Suspect Search', icon: Search },
        { id: 'case-tracker', label: 'Case Tracker', icon: Briefcase },
        { id: 'resource-deployment', label: 'Resource Deployment', icon: Users }
      ]
    },
    {
      title: 'SUPPORT',
      items: [
        { id: 'missing', label: 'Missing Persons', icon: UserX },
        { id: 'victim-registry', label: 'Victim Registry', icon: Heart },
        { id: 'evidence-locker', label: 'Evidence Locker', icon: Archive },
        { id: 'briefing', label: 'Crime Briefing', icon: FileText }
      ]
    }
  ];

  // Helper to find label text for breadcrumbs
  const getActiveLabel = () => {
    for (const sec of menuSections) {
      const match = sec.items.find(i => i.id === activeTab);
      if (match) return match.label;
    }
    return 'Overview';
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar" style={{ height: '100vh', overflowY: 'auto' }}>
        <div className="sidebar-header" style={{ padding: '20px 24px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="#00e5ff" />
            <span className="sidebar-title">KSP INTEL</span>
          </div>
          <span className="sidebar-subtitle">CYBER CRIME PORTAL</span>
        </div>

        <div style={{ padding: '0 10px 20px' }}>
          {menuSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '14px' }}>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '9px', 
                color: '#4f616d', 
                padding: '6px 12px 4px', 
                letterSpacing: '1px',
                fontWeight: 'bold'
              }}>
                {section.title}
              </div>
              <ul className="sidebar-menu" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li
                      key={item.id}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveTab(item.id)}
                      style={{ 
                        padding: '8px 12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        cursor: 'pointer',
                        borderRadius: '4px',
                        marginBottom: '2px',
                        background: isActive ? '#0d1117' : 'transparent',
                        borderLeft: isActive ? '2px solid #00e5ff' : '2px solid transparent'
                      }}
                    >
                      <Icon size={14} color={isActive ? '#00e5ff' : '#8a9ba8'} />
                      <span style={{ 
                        fontSize: '11px', 
                        color: isActive ? '#00e5ff' : '#c4d1db', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        width: '100%',
                        fontFamily: 'sans-serif'
                      }}>
                        <span>{item.label}</span>
                        {(item.id === 'overview' || item.id === 'overview-official') && <span className="pulse-dot"></span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '16px 20px' }}>
          <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#4f616d', letterSpacing: '0.5px' }}>OPERATOR DETAILS</div>
          <div className="sidebar-user" style={{ margin: '6px 0 12px' }}>
            <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>{user?.name || 'SP Kiran Kumar IPS'}</div>
            <div style={{ color: '#4f616d', fontSize: '10px', marginTop: '2px', fontFamily: 'monospace' }}>BADGE: {user?.badge || 'KSP-2026-9812'}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <LogOut size={12} />
              <span>TERMINATE SESSION</span>
            </div>
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="#00e5ff" />
            <div className="top-bar-title" style={{ fontWeight: '700', letterSpacing: '1px' }}>
              KSP | INTELLIGENCE PORTAL
            </div>
          </div>
          {role === 'higher_official' ? (
            <div style={{ 
              border: '1px solid #FFD700', 
              color: '#FFD700', 
              fontSize: '10px', 
              fontWeight: 'bold', 
              padding: '4px 8px', 
              fontFamily: 'monospace' 
            }}>
              HIGHER OFFICIAL VIEW — SCRB ACCESS
            </div>
          ) : (
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span>ONLINE</span>
            </div>
          )}
        </header>

        <div className="viewport" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>

          {/* Breadcrumbs */}
          <div className="breadcrumb" style={{ fontFamily: 'monospace', fontSize: '10px', color: '#8a9ba8', padding: '10px 20px', background: '#070a12', borderBottom: '1px solid #1e2d3d' }}>
            Home &gt; {getActiveLabel()}
          </div>

          <div style={{ flexGrow: 1, padding: '20px' }}>
            {renderActiveView()}
          </div>

          {/* Zoho Catalyst Powered Footer */}
          <footer className="app-footer">
            Karnataka State Police | Cyber Crime Wing | Powered by Zoho Catalyst
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
