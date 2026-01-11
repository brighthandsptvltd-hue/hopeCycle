import React from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabaseClient';
interface SidebarProps {
  role: UserRole;
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  verificationStatus?: string;
  paymentStatus?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface SidebarLink {
  id: string;
  icon: string;
  label: string;
  badge?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  role,
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  verificationStatus,
  paymentStatus,
  isMobileOpen,
  onMobileClose
}) => {
  const donorLinks: SidebarLink[] = [
    { id: 'donor-dashboard', icon: 'grid_view', label: 'Dashboard' },
    { id: 'donor-donations', icon: 'inventory_2', label: 'My Donations' },
    { id: 'donor-requests', icon: 'volunteer_activism', label: 'NGO Requests' },
    { id: 'donor-nearby', icon: 'location_on', label: 'Nearby NGOs' },
    { id: 'donor-messages', icon: 'chat', label: 'Messages' },
  ];

  const ngoLinks: SidebarLink[] = [
    { id: 'ngo-dashboard', icon: 'grid_view', label: 'Dashboard' },
    ...(verificationStatus === 'VERIFIED' ? [
      { id: 'ngo-inventory', icon: 'inventory_2', label: 'Inventory' },
      { id: 'ngo-requests', icon: 'volunteer_activism', label: 'Requests' },
      { id: 'donor-messages', icon: 'chat', label: 'Messages' },
      { id: 'ngo-analytics', icon: 'analytics', label: 'Analytics' },
    ] : [])
  ];

  const adminLinks: SidebarLink[] = [
    { id: 'admin-dashboard', icon: 'grid_view', label: 'Dashboard' },
    { id: 'admin-verification', icon: 'verified_user', label: 'NGO Verification' },
    { id: 'admin-donations', icon: 'volunteer_activism', label: 'Donations' },
    { id: 'admin-revenue', icon: 'payments', label: 'Revenue' },
  ];

  const links = role === 'DONOR' ? donorLinks : role === 'NGO' ? ngoLinks : adminLinks;

  const [unreadCount, setUnreadCount] = React.useState(0);
  const [alertCount, setAlertCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Messages
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      setUnreadCount(msgCount || 0);

      // Alerts
      const { count: ntfCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setAlertCount(ntfCount || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('sidebar_badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnread();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnread();
      })
      .subscribe();

    const handleLocalRead = () => fetchUnread();
    window.addEventListener('messagesRead', handleLocalRead);
    window.addEventListener('notificationsRead', handleLocalRead);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('messagesRead', handleLocalRead);
      window.removeEventListener('notificationsRead', handleLocalRead);
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={onMobileClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 bg-white dark:bg-brand-surface-dark border-r border-gray-200 dark:border-gray-800 z-[101]
        flex flex-col sidebar-transition
        lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72 lg:flex
      `}>
        <div className="h-20 flex items-center justify-between px-6 relative lg:justify-end lg:px-4">
          <div className="lg:hidden flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">eco</span>
            </div>
            <span className="font-black text-brand-text dark:text-white uppercase tracking-tighter">HopeCycle</span>
          </div>

          <button
            onClick={() => {
              if (onMobileClose && window.innerWidth < 1024) {
                onMobileClose();
              } else {
                onToggleCollapse();
              }
            }}
            className="size-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-brand-muted hover:text-primary transition-all flex items-center justify-center group"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {links.map((link) => {
            let displayBadge = link.badge;
            if (link.id === 'donor-messages' && unreadCount > 0) displayBadge = unreadCount.toString();
            if (link.id === 'notifications' && alertCount > 0) displayBadge = alertCount.toString();

            return (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  if (onMobileClose) onMobileClose();
                }}
                title={isCollapsed ? link.label : ''}
                className={`flex items-center w-full rounded-xl transition-all ${currentPage === link.id
                  ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20'
                  : 'text-brand-muted hover:bg-gray-50 dark:hover:bg-white/5 hover:text-brand-text dark:hover:text-white font-medium'
                  } ${isCollapsed ? 'lg:justify-center p-3' : 'px-4 py-3 justify-between'}`}
              >
                <div className={`flex items-center gap-3 w-full ${isCollapsed ? 'lg:justify-center lg:gap-0' : ''}`}>
                  <span className={`material-symbols-outlined shrink-0 ${currentPage === link.id ? 'material-symbols-filled' : ''}`}>
                    {link.icon}
                  </span>
                  {(!isCollapsed || (isMobileOpen)) && <span className="text-sm truncate">{link.label}</span>}
                </div>
                {(!isCollapsed || (isMobileOpen)) && displayBadge && (
                  <span className="bg-primary-light text-primary-deep text-[10px] font-black px-1.5 py-0.5 rounded-md">
                    {displayBadge}
                  </span>
                )}
                {isCollapsed && !isMobileOpen && displayBadge && (
                  <span className="absolute ml-6 mt-[-15px] size-2 bg-primary-light rounded-full border border-white"></span>
                )}
              </button>
            )
          })}
          <div className="h-px bg-gray-100 dark:bg-gray-800 my-4 mx-2"></div>
          <button
            onClick={() => {
              onNavigate('profile');
              if (onMobileClose) onMobileClose();
            }}
            className={`flex items-center gap-3 w-full text-brand-muted hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all ${isCollapsed ? 'lg:justify-center p-3' : 'px-4 py-3'} ${currentPage === 'profile' ? 'bg-primary/10 text-primary font-bold' : ''}`}
          >
            <span className={`material-symbols-outlined ${currentPage === 'profile' ? 'material-symbols-filled' : ''}`}>person</span>
            {(!isCollapsed || isMobileOpen) && <span className="text-sm font-medium">Profile</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              onNavigate('landing');
            }}
            className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gray-50 dark:bg-brand-dark text-brand-muted hover:text-red-500 transition-all font-bold text-sm ${isCollapsed ? 'lg:h-10' : 'h-12'} h-12`}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;