import React, { useState, useEffect } from 'react';
import Overview from './Overview';
import CrimeMap from './CrimeMap';
import ComplaintAnalytics from './ComplaintAnalytics';
import NetworkGraph from './NetworkGraph';
import VoiceQuery from './VoiceQuery';
import AIClassifier from './AIClassifier';
import PredictiveIntel from './PredictiveIntel';
import AnomalyDetection from './AnomalyDetection';

// Operations and support
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
import ErrorBoundary from './ErrorBoundary';

import { 
  LayoutDashboard, 
  Map, 
  Share2, 
  TrendingUp, 
  ShieldAlert, 
  Radio, 
  Clipboard, 
  Search, 
  Briefcase, 
  Users, 
  UserX, 
  Heart, 
  Archive, 
  FileText, 
  Calendar, 
  BarChart3, 
  LogOut, 
  Bell, 
  BellOff, 
  Menu, 
  X, 
  Shield 
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
  
  // Sidebar responsive collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(window.innerWidth <= 1024);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(localStorage.getItem('ksp_muted') === 'true');
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Auto-resize handler for sidebar collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Time ticker in header: "HH:MM:SS"
  useEffect(() => {
    const updateHeaderTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}:${s}`);
    };
    updateHeaderTime();
    const interval = setInterval(updateHeaderTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update browser tab name based on active route
  useEffect(() => {
    document.title = `KSP Intel — ${getActiveLabel()} | Classified`;
  }, [activeTab]);

  const toggleMute = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    localStorage.setItem('ksp_muted', String(nextVal));
  };

  const getOfficerInitials = () => {
    if (!user?.name) return 'KK';
    const parts = user.name.replace(/SP\s+|DSP\s+|IPS/g, '').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const renderActiveView = () => {
    // Inject the global fade transition class on mount
    return (
      <div className="page-fade-in" key={activeTab} style={{ height: '100%' }}>
        {(() => {
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
            case 'fir':
              return <FIRAssistant />;
            case 'suspect':
              return <SuspectSearch />;
            case 'briefing':
              return <CrimeBriefing />;
            case 'missing':
              return (
                <ErrorBoundary>
                  <MissingPersons />
                </ErrorBoundary>
              );
            case 'live':
              return <LiveIntelFeed />;
            case 'district-stats':
              return (
                <ErrorBoundary>
                  <DistrictStats onNavigateToCase={(caseId) => {
                    setSearchCaseId(caseId);
                    setActiveTab('case-tracker');
                  }} />
                </ErrorBoundary>
              );
            case 'crime-calendar':
              return (
                <ErrorBoundary>
                  <CrimeCalendar onNavigateToCase={(caseId) => {
                    setSearchCaseId(caseId);
                    setActiveTab('case-tracker');
                  }} />
                </ErrorBoundary>
              );
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
        })()}
      </div>
    );
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
      title: 'VICTIM & EVIDENCE',
      items: [
        { id: 'missing', label: 'Missing Persons', icon: UserX },
        { id: 'victim-registry', label: 'Victim Registry', icon: Heart },
        { id: 'evidence-locker', label: 'Evidence Locker', icon: Archive }
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { id: 'briefing', label: 'Crime Briefing', icon: FileText }
      ]
    }
  ];

  const getActiveLabel = () => {
    for (const sec of menuSections) {
      const match = sec.items.find(i => i.id === activeTab);
      if (match) return match.label;
    }
    return 'Overview';
  };

  const getActiveIcon = () => {
    for (const sec of menuSections) {
      const match = sec.items.find(i => i.id === activeTab);
      if (match) return match.icon;
    }
    return LayoutDashboard;
  };

  const getActiveSectionTitle = () => {
    for (const sec of menuSections) {
      const match = sec.items.some(i => i.id === activeTab);
      if (match) return sec.title;
    }
    return 'ANALYTICS';
  };

  // Get active security badge
  const getSecurityLevelBadge = () => {
    const username = user?.email || user?.name || '';
    if (username.includes('admin')) {
      return { text: 'ADMIN', border: 'var(--border-gold)', color: 'var(--gold)' };
    } else if (username.includes('Ramesh') || role === 'higher_official') {
      return { text: 'TOP SECRET', border: 'var(--border-red)', color: 'var(--red)' };
    } else {
      return { text: 'RESTRICTED', border: 'var(--border-amber)', color: 'var(--amber)' };
    }
  };

  const badgeInfo = getSecurityLevelBadge();
  const ActiveHeaderIcon = getActiveIcon();

  return (
    <div style={styles.appContainer}>
      {/* Sidebar Navigation */}
      <aside 
        style={{
          ...styles.sidebar,
          width: isSidebarCollapsed ? '64px' : '220px'
        }}
      >
        {/* LOGO SECTION */}
        <div style={styles.sidebarLogoBox}>
          <Shield size={20} color="var(--cyan)" style={{ flexShrink: 0 }} />
          {!isSidebarCollapsed && <span style={styles.logoText}>KSP INTEL</span>}
        </div>

        {/* OFFICER INFO BAR */}
        {!isSidebarCollapsed ? (
          <div style={styles.officerBar}>
            <div style={styles.avatarCircle}>
              {getOfficerInitials()}
            </div>
            <div style={styles.officerMeta}>
              <div style={styles.officerName}>{user?.name || 'SP Kiran Kumar IPS'}</div>
              <div style={styles.badgeRow}>
                <span style={styles.officerActiveDot}>●</span>
                <span style={styles.officerStatusText}>ACTIVE SESSION</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '12px 0', display: 'flex', justifyContent: 'center', borderBottom: 'var(--border)' }}>
            <div style={{ ...styles.avatarCircle, width: '24px', height: '24px', fontSize: '9px' }}>
              {getOfficerInitials()}
            </div>
          </div>
        )}

        {/* NAVIGATION LIST */}
        <div style={styles.navScrollArea}>
          {menuSections.map((section) => (
            <div key={section.title} style={{ marginBottom: '10px' }}>
              {!isSidebarCollapsed && (
                <div style={styles.sectionTitle}>
                  {section.title}
                </div>
              )}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        ...styles.navItem,
                        ...(isActive ? styles.navItemActive : {}),
                        justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                        padding: isSidebarCollapsed ? '12px 0' : '10px 20px'
                      }}
                      title={item.label}
                    >
                      <Icon 
                        size={14} 
                        color={isActive ? 'var(--cyan)' : 'var(--text-label)'} 
                        style={{ flexShrink: 0 }}
                      />
                      {!isSidebarCollapsed && (
                        <span style={{ color: isActive ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '12px', letterSpacing: '0.5px' }}>
                          {item.label}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* BOTTOM OF SIDEBAR */}
        <div style={styles.sidebarFooter}>
          {!isSidebarCollapsed ? (
            <div style={{ marginBottom: '12px' }}>
              <div style={styles.syncLabel}>CCTNS SYNC STATUS</div>
              <div style={styles.progressBarBg}>
                <div style={styles.progressBarFill}></div>
              </div>
              <div style={styles.syncStatusText}>100% SYNCED</div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }} title="100% Synced">
              <span className="pulse-dot" style={{ backgroundColor: 'var(--green)', boxShadow: '0 0 6px var(--green)' }}></span>
            </div>
          )}

          <button 
            onClick={onLogout} 
            style={{
              ...styles.logoutBtn,
              padding: isSidebarCollapsed ? '8px 0' : '10px'
            }}
            title="Terminate Session"
          >
            {isSidebarCollapsed ? (
              <LogOut size={12} />
            ) : (
              <span>TERMINATE SESSION</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main 
        style={{
          ...styles.mainView,
          left: isSidebarCollapsed ? '64px' : '220px'
        }}
      >
        {/* TOP HEADER BAR */}
        <header style={styles.topBar}>
          {/* LEFT: Collapse Button + Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              onClick={() => setIsSidebarCollapsed(p => !p)} 
              style={styles.collapseToggleBtn}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
            </button>
            <div style={styles.breadcrumbWrapper}>
              <ActiveHeaderIcon size={16} color="var(--cyan)" style={{ flexShrink: 0 }} />
              <span style={styles.breadcrumbActiveName}>{getActiveLabel()}</span>
              <span style={styles.breadcrumbDivider}>/</span>
              <span style={styles.breadcrumbSectionName}>{getActiveSectionTitle()}</span>
            </div>
          </div>

          {/* CENTER: Classification Badge */}
          <div 
            style={{
              ...styles.classificationBadge,
              borderColor: badgeInfo.border,
              color: badgeInfo.color
            }}
          >
            {badgeInfo.text}
          </div>

          {/* RIGHT: Status tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Sound Toggle preference */}
            <button 
              onClick={toggleMute} 
              style={styles.headerIconButton}
              title={isMuted ? 'Unmute Portal Sounds' : 'Mute Portal Sounds'}
            >
              {isMuted ? (
                <BellOff size={16} color="var(--red)" />
              ) : (
                <Bell size={16} color="var(--text-label)" />
              )}
            </button>

            {/* Level 2 DSP District Badge */}
            {user?.email === 'DSP-Kumar' && (
              <div style={styles.dspDistrictBadge}>
                DIST: BENGALURU URBAN
              </div>
            )}

            {/* Live pulsing indicator */}
            <div style={styles.liveIndicator}>
              <span className="pulse-dot" style={styles.livePulse}></span>
              <span>LIVE</span>
            </div>

            {/* Live Clock */}
            <div style={styles.headerClock}>
              {currentTimeStr}
            </div>

            {/* User Dropdown Avatar */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setAvatarDropdownOpen(p => !p)} 
                style={styles.headerAvatar}
              >
                {getOfficerInitials()}
              </button>
              {avatarDropdownOpen && (
                <>
                  <div style={styles.dropdownBackdrop} onClick={() => setAvatarDropdownOpen(false)} />
                  <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownUserBlock}>
                      <div style={styles.dropdownUserName}>{user?.name || 'SP Kiran Kumar IPS'}</div>
                      <div style={styles.dropdownUserBadge}>{user?.badge || 'KSP-2026-9812'}</div>
                      <div style={{ ...styles.dropdownUserRole, color: badgeInfo.color }}>{badgeInfo.text} ACCESS</div>
                    </div>
                    <div style={styles.dropdownDivider}></div>
                    <button 
                      onClick={() => {
                        setAvatarDropdownOpen(false);
                        onLogout();
                      }} 
                      style={styles.dropdownLogoutBtn}
                    >
                      <LogOut size={12} />
                      <span>SIGN OUT SESSION</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <div style={styles.viewport}>
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)'
  },
  sidebar: {
    height: '100%',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: 'var(--border)',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    zIndex: 200,
    transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  sidebarLogoBox: {
    height: '64px',
    borderBottom: 'var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '0 20px',
    flexShrink: 0,
    overflow: 'hidden'
  },
  logoText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '3px'
  },
  officerBar: {
    padding: '12px 20px',
    borderBottom: 'var(--border)',
    backgroundColor: 'var(--bg-panel)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0
  },
  avatarCircle: {
    width: '28px',
    height: '28px',
    backgroundColor: 'var(--cyan)',
    borderRadius: '50%',
    color: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '11px',
    flexShrink: 0
  },
  officerMeta: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  officerName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden'
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '2px'
  },
  officerActiveDot: {
    color: 'var(--green)',
    fontSize: '9px'
  },
  officerStatusText: {
    fontSize: '9px',
    color: 'var(--green)',
    letterSpacing: '1px',
    fontFamily: 'var(--font-mono)'
  },
  navScrollArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '10px 0'
  },
  sectionTitle: {
    padding: '16px 20px 6px',
    fontSize: '9px',
    letterSpacing: '2px',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    borderLeft: '2px solid transparent',
    transition: 'var(--transition)',
    userSelect: 'none'
  },
  navItemActive: {
    background: 'var(--cyan-dim)',
    borderLeft: '2px solid var(--cyan)',
    boxShadow: 'inset 3px 0 8px var(--cyan-bg)'
  },
  sidebarFooter: {
    marginTop: 'auto',
    padding: '16px 20px',
    borderTop: 'var(--border)',
    flexShrink: 0
  },
  syncLabel: {
    fontSize: '9px',
    color: 'var(--text-dim)',
    letterSpacing: '0.5px',
    marginBottom: '6px'
  },
  progressBarBg: {
    width: '100%',
    height: '3px',
    backgroundColor: 'var(--border-subtle)',
    borderRadius: '1px',
    overflow: 'hidden',
    marginBottom: '4px'
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--cyan)'
  },
  syncStatusText: {
    fontSize: '10px',
    color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600'
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'var(--border-red)',
    color: 'var(--red)',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    letterSpacing: '1px',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)'
  },
  mainView: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  topBar: {
    height: '56px',
    backgroundColor: 'rgba(8, 12, 20, 0.95)',
    borderBottom: 'var(--border)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    zIndex: 150
  },
  collapseToggleBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    transition: 'var(--transition)'
  },
  breadcrumbWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  breadcrumbActiveName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff'
  },
  breadcrumbDivider: {
    color: 'var(--text-dim)',
    fontSize: '12px'
  },
  breadcrumbSectionName: {
    fontSize: '12px',
    color: 'var(--text-label)',
    fontFamily: 'var(--font-mono)'
  },
  classificationBadge: {
    border: '1px solid transparent',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '10px',
    letterSpacing: '2px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700'
  },
  headerIconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '50%'
  },
  dspDistrictBadge: {
    border: 'var(--border-amber)',
    color: 'var(--amber)',
    fontSize: '9px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '20px',
    fontFamily: 'var(--font-mono)'
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '10px',
    color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    letterSpacing: '1px'
  },
  livePulse: {
    width: '6px',
    height: '6px',
    backgroundColor: 'var(--green)',
    boxShadow: '0 0 6px var(--green)'
  },
  headerClock: {
    fontSize: '12px',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)'
  },
  headerAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: 'var(--cyan)',
    borderRadius: '50%',
    color: '#000000',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '12px'
  },
  dropdownBackdrop: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 900
  },
  dropdownMenu: {
    position: 'absolute',
    top: '40px',
    right: 0,
    width: '200px',
    backgroundColor: 'var(--bg-panel)',
    border: 'var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
    zIndex: 950,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  dropdownUserBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  dropdownUserName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff'
  },
  dropdownUserBadge: {
    fontSize: '10px',
    color: 'var(--text-label)',
    fontFamily: 'var(--font-mono)'
  },
  dropdownUserRole: {
    fontSize: '9px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    letterSpacing: '0.5px',
    marginTop: '4px'
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: 'var(--border-subtle)',
    margin: '4px 0'
  },
  dropdownLogoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    color: 'var(--red)',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    padding: '6px 0'
  },
  viewport: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px'
  }
};

export default Dashboard;
