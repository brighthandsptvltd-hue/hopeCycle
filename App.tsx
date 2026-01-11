import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import { supabase } from './services/supabaseClient';
import Landing from './pages/Landing';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DonorDashboard from './pages/DonorDashboard';
import NGODashboard from './pages/NGODashboard';
import AdminDashboard from './pages/AdminDashboard';
import DonorDonations from './pages/DonorDonations';
import DonorRequests from './pages/DonorRequests';
import DonorNearby from './pages/DonorNearby';
import DonorMessages from './pages/DonorMessages';
import NGOInventory from './pages/NGOInventory';
import NGORequests from './pages/NGORequests';
import NGOAnalytics from './pages/NGOAnalytics';
import NewDonation from './pages/NewDonation';
import DonationDetail from './pages/DonationDetail';
import NGODonationDetail from './pages/NGODonationDetail';
import EditDonation from './pages/EditDonation';
import NGOProfile from './pages/NGOProfile';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Impact from './pages/Impact';
import NewBroadcast from './pages/NewBroadcast';
import AdminVerification from './pages/AdminVerification';
import AdminDonations from './pages/AdminDonations';
import AdminRevenue from './pages/AdminRevenue';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NGOVerificationForm from './pages/NGOVerificationForm';
import NGOPayment from './pages/NGOPayment';


const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [userRole, setUserRole] = useState<UserRole>('DONOR');
  const [userName, setUserName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED'>('UNVERIFIED');
  const [paymentStatus, setPaymentStatus] = useState<'UNPAID' | 'PAID'>('UNPAID');
  const [isAdminVerified, setIsAdminVerified] = useState(localStorage.getItem('hopeCycle_admin_verified') === 'true');
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKeyError, setAdminKeyError] = useState(false);
  const [rememberAdmin, setRememberAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const syncUser = async (session: any, event?: string) => {
      if (!session?.user) {
        if (mounted) {
          setIsLoggedIn(false);
          setUserName('');
          setCurrentPage('landing');
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch real-time profile data
        console.log("🔍 [DEBUG] Syncing user:", session.user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("❌ [DEBUG] Supabase Profile Error:", profileError);
        }

        console.log("📋 [DEBUG] Profile Data fetched:", profile);
        console.log("🔑 [DEBUG] User Metadata:", session.user.user_metadata);

        if (mounted) {
          const rawRole = profile?.role || session.user.user_metadata?.role || 'DONOR';
          const role = rawRole.toUpperCase();
          const name = profile?.full_name || session.user.user_metadata?.full_name || '';

          console.log("🎯 [DEBUG] Final Assigned Role:", role);
          console.log("👤 [DEBUG] User Name:", name);

          setUserRole(role as UserRole);
          setUserName(name);
          setIsLoggedIn(true);

          if (role === 'NGO' && profile) {
            const vStatus = (profile.verification_status || 'UNVERIFIED').toUpperCase();
            const pStatus = (profile.payment_status || 'UNPAID').toUpperCase();

            console.log("🛠️ [DEBUG] NGO Statuses - Verification:", vStatus, "Payment:", pStatus);

            setVerificationStatus(vStatus as any);
            setPaymentStatus(pStatus as any);
          }

          // Handle routing on initial load or fresh sign in
          if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && ['landing', 'login', 'signup'].includes(currentPage))) {
            console.log("🚀 [DEBUG] Triggering redirection for event:", event);
            if (role === 'DONOR') {
              console.log("➡️ [DEBUG] Redirecting to Donor Dashboard");
              setCurrentPage('donor-dashboard');
            } else if (role === 'NGO') {
              console.log("➡️ [DEBUG] Redirecting to NGO Dashboard");
              setCurrentPage('ngo-dashboard');
            } else if (role === 'ADMIN') {
              console.log("➡️ [DEBUG] Redirecting to Admin Dashboard");
              setCurrentPage('admin-dashboard');
            }
          }
        }
      } catch (err) {
        console.error('Sync user error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      syncUser(session, event);
    });

    const timer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null); // Keep for backward compatibility
  const [pageParams, setPageParams] = useState<any>({});

  const handleNavigate = (page: string, params?: any) => {
    if (params) {
      setPageParams(params);
      if (params.id) {
        setSelectedDonationId(params.id);
      }
    } else {
      setPageParams({});
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleRoleChange = (role: UserRole) => {
    const normalizedRole = role.toUpperCase();
    setUserRole(normalizedRole as UserRole);
    if (normalizedRole === 'DONOR') setCurrentPage('donor-dashboard');
    else if (normalizedRole === 'NGO') setCurrentPage('ngo-dashboard');
    else if (normalizedRole === 'ADMIN') setCurrentPage('admin-dashboard');
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKeyInput === 'Hopecycle_Abhishek_2026') {
      setIsAdminVerified(true);
      if (rememberAdmin) {
        localStorage.setItem('hopeCycle_admin_verified', 'true');
      }
      setAdminKeyError(false);
    } else {
      setAdminKeyError(true);
    }
  };

  const renderNGOProtected = (component: React.ReactNode) => {
    console.log("🛡️ [SECURITY GATE] Checking NGO Access:", {
      verificationStatus,
      paymentStatus,
      currentPage
    });

    if (verificationStatus === 'UNVERIFIED') {
      console.log("🚫 [SECURITY] Status is UNVERIFIED - Showing Registration Form");
      return <NGOVerificationForm onComplete={() => {
        setVerificationStatus('PENDING');
        setCurrentPage('ngo-dashboard');
      }} />;
    }
    if (verificationStatus === 'PENDING') {
      console.log("⏳ [SECURITY] Status is PENDING - Showing Under Review screen");
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
          <div className="size-24 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-6 animate-pulse">
            <span className="material-symbols-outlined text-5xl">hourglass_empty</span>
          </div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white mb-3">Verification Pending</h2>
          <p className="text-brand-muted dark:text-gray-400 max-w-md mx-auto font-medium">
            Thank you for submitting your details! Our admin team is currently reviewing your documentation. You'll be notified once you're approved to proceed.
          </p>
          <button
            onClick={() => handleNavigate('landing')}
            className="mt-8 text-primary font-black uppercase tracking-widest text-xs hover:underline"
          >
            Back to Home
          </button>
        </div>
      );
    }
    if ((verificationStatus === 'APPROVED' || verificationStatus === 'VERIFIED') && paymentStatus === 'UNPAID') {
      console.log("💰 [SECURITY] NGO is Approved/Verified but UNPAID - Forcing Payment Page");
      return <NGOPayment onComplete={() => {
        setPaymentStatus('PAID');
        setVerificationStatus('VERIFIED');
        setCurrentPage('ngo-dashboard');
      }} />;
    }

    console.log("✅ [SECURITY] NGO is VERIFIED - Access Granted");
    return component;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <Landing onGetStarted={() => setCurrentPage('donor-dashboard')} onNavigate={handleNavigate} />;
      case 'profile':
        return <Profile role={userRole} />;
      case 'settings':
        return <Settings />;
      case 'impact':
        return <Impact role={userRole} />;
      case 'notifications':
        return <Notifications />;
      case 'login':
        return <Login onLogin={handleRoleChange} onNavigate={handleNavigate} />;
      case 'signup':
        return <Signup onSignup={handleRoleChange} onNavigate={handleNavigate} />;
      case 'donor-dashboard':
        return <DonorDashboard userName={userName} onNavigate={handleNavigate} />;
      case 'donor-donations':
        return <DonorDonations onNavigate={handleNavigate} />;
      case 'donation-detail':
        if (userRole === 'NGO') {
          return (
            <NGODonationDetail
              donationId={pageParams.id || selectedDonationId || ''}
              onBack={() => handleNavigate('ngo-dashboard')}
              onNavigate={handleNavigate}
            />
          );
        }
        return (
          <DonationDetail
            donationId={pageParams.id || selectedDonationId || ''}
            userRole={userRole}
            onBack={() => handleNavigate(userRole === 'DONOR' ? 'donor-donations' : 'ngo-dashboard')}
            onMessage={(ngoId) => handleNavigate('donor-messages', { recipientId: ngoId })}
            onEdit={(id) => handleNavigate('edit-donation', { id })}
          />
        );
      case 'edit-donation':
        const editId = pageParams.id || selectedDonationId || '';
        return (
          <EditDonation
            donationId={editId}
            onCancel={() => handleNavigate('donation-detail', { id: editId })}
            onSuccess={() => handleNavigate('donation-detail', { id: editId })}
          />
        );
      case 'new-donation':
        const initialData = pageParams.requestId ? {
          title: pageParams.requestTitle,
          requestId: pageParams.requestId
        } : undefined;

        return (
          <NewDonation
            initialData={initialData}
            onCancel={() => handleNavigate(userRole === 'DONOR' ? 'donor-dashboard' : 'ngo-dashboard')}
            onSuccess={() => handleNavigate(userRole === 'DONOR' ? 'donor-donations' : 'ngo-dashboard')}
          />
        );
      case 'donor-requests':
        return <DonorRequests />;
      case 'donor-nearby':
        return <DonorNearby onSelectNGO={(id) => handleNavigate('ngo-profile', { id })} />;
      case 'ngo-profile':
        return <NGOProfile ngoId={pageParams.id} onMessage={() => handleNavigate('donor-messages', { recipientId: pageParams.id })} />;
      case 'donor-messages':
        return <DonorMessages initialRecipientId={pageParams.recipientId} />;
      case 'ngo-dashboard':
        return renderNGOProtected(<NGODashboard userName={userName} isVerified={verificationStatus === 'VERIFIED'} onRequestDonation={() => handleNavigate('new-broadcast')} onNavigate={handleNavigate} />);
      case 'ngo-inventory':
        return renderNGOProtected(<NGOInventory onNavigate={handleNavigate} />);
      case 'ngo-requests':
        return renderNGOProtected(<NGORequests onNewBroadcast={() => handleNavigate('new-broadcast')} />);
      case 'new-broadcast':
        return renderNGOProtected(<NewBroadcast onComplete={() => handleNavigate('ngo-requests')} />);
      case 'ngo-analytics':
        return renderNGOProtected(<NGOAnalytics />);
      case 'admin-dashboard':
        return <AdminDashboard userName={userName} onNavigate={handleNavigate} />;
      case 'admin-verification':
        return <AdminVerification />;
      case 'admin-donations':
        return <AdminDonations />;
      case 'admin-revenue':
        return <AdminRevenue />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <span className="material-symbols-outlined text-6xl text-slate-200">construction</span>
            <h2 className="text-2xl font-bold text-slate-400">Page under construction</h2>
            <button onClick={() => setCurrentPage('landing')} className="text-primary font-bold hover:underline">Back to Safety</button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-brand-dark transition-colors duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="size-20 border-4 border-primary/20 rounded-full"></div>
            <div className="size-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold text-brand-text dark:text-white tracking-tight">HopeCycle</h3>
            <p className="text-brand-muted font-bold animate-pulse uppercase tracking-[0.2em] text-[10px]">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn && userRole === 'ADMIN' && !isAdminVerified) {
    return (
      <div className="min-h-screen bg-brand-background dark:bg-brand-dark flex flex-col items-center justify-center p-6 bg-dots">
        <div className="max-w-md w-full bg-white dark:bg-brand-surface-dark rounded-[3rem] p-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-500">
          <div className="size-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center text-amber-600 mb-8 mx-auto">
            <span className="material-symbols-outlined text-5xl">admin_panel_settings</span>
          </div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white text-center mb-2 tracking-tight">Admin Gate</h2>
          <p className="text-brand-muted text-center mb-8 text-sm font-medium">Please enter your emergency secret key to access the control panel.</p>

          <form onSubmit={handleAdminVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Emergency Secret Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className={`material-symbols-outlined ${adminKeyError ? 'text-red-500' : 'text-amber-500'} transition-colors`}>key</span>
                </div>
                <input
                  type="password"
                  autoFocus
                  value={adminKeyInput}
                  onChange={(e) => { setAdminKeyInput(e.target.value); setAdminKeyError(false); }}
                  placeholder="••••••••••••"
                  className={`block w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-brand-dark border-2 ${adminKeyError ? 'border-red-200 ring-red-100' : 'border-slate-100 dark:border-gray-700 focus:border-amber-400'} rounded-2xl text-lg font-mono tracking-widest focus:outline-none transition-all`}
                />
              </div>
              {adminKeyError && <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter px-1 animate-pulse">Incorrect Secret Key • Access Denied</p>}
            </div>

            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberAdmin}
                onChange={(e) => setRememberAdmin(e.target.checked)}
                className="size-5 rounded-lg border-gray-200 text-amber-500 focus:ring-amber-500/20"
              />
              <label htmlFor="remember" className="text-sm font-bold text-slate-500 cursor-pointer select-none">Remember this device</label>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 dark:bg-primary text-white dark:text-primary-deep font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Verify Identity
              <span className="material-symbols-outlined text-xl">verified_user</span>
            </button>

            <button
              type="button"
              onClick={() => {
                supabase.auth.signOut();
                setIsLoggedIn(false);
              }}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors pt-2"
            >
              Cancel & Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Determine if we need to show the login gate for protected pages
  const dashboardPages = [
    'donor-dashboard', 'donor-donations', 'donor-requests', 'donor-nearby',
    'donor-messages', 'ngo-dashboard', 'ngo-inventory', 'ngo-requests',
    'new-broadcast', 'ngo-analytics', 'admin-dashboard', 'admin-verification',
    'admin-donations', 'admin-revenue', 'new-donation', 'edit-donation',
    'donation-detail', 'profile', 'settings', 'impact', 'ngo-profile'
  ];

  if (!isLoggedIn && dashboardPages.includes(currentPage)) {
    return (
      <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300">
        <Login onLogin={handleRoleChange} onNavigate={handleNavigate} />
      </div>
    );
  }

  if (currentPage === 'login' || currentPage === 'signup') {
    return (
      <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300">
        {renderPage()}
      </div>
    );
  }

  if (currentPage === 'landing') {
    return (
      <div className="min-h-screen bg-white dark:bg-brand-dark transition-colors duration-300">
        <Navbar
          isLoggedIn={isLoggedIn}
          role={userRole}
          onSetRole={handleRoleChange}
          onNavigate={handleNavigate}
          currentPage={currentPage}
          onToggleMobileMenu={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        {renderPage()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-background dark:bg-brand-dark transition-colors duration-300">
      <Navbar
        isLoggedIn={isLoggedIn}
        role={userRole}
        onSetRole={handleRoleChange}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onToggleMobileMenu={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      <div className="flex relative">
        <Sidebar
          role={userRole}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          verificationStatus={verificationStatus}
          paymentStatus={paymentStatus}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
        <main className={`flex-1 min-w-0 overflow-x-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 w-full">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;