import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Stethoscope, Bell } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [latestPubs, setLatestPubs] = useState([]);
  const [loadingPubs, setLoadingPubs] = useState(false);
  const [errorPubs, setErrorPubs] = useState(null);

  const fetchLatestPubs = async () => {
    setLoadingPubs(true);
    setErrorPubs(null);
    try {
      const url = import.meta.env.VITE_API_URL + '/medical/search';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "", max_results: 5, user_id: user.id })
      });
      if (response.ok) {
        const data = await response.json();
        setLatestPubs(data.results || data || []);
      } else {
        setErrorPubs(t('navbar.noPublications'));
      }
    } catch (error) {
      console.error(error);
      setErrorPubs(t('navbar.noPublications'));
    } finally {
      setLoadingPubs(false);
    }
  };

  const handleBellClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
    if (!isDropdownOpen && latestPubs.length === 0) {
      fetchLatestPubs();
    }
  };

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const url = import.meta.env.VITE_API_URL + `/notifications/unread/count?user_id=${user.id}`;
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setUnreadCount(data.data.count);
            }
          }
        } catch (error) {
          console.error("Failed to fetch notifications count", error);
        }
      };
      fetchUnread();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-card sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
          <Stethoscope size={24} />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">MedAI</span>
      </div>
      
      {user && (
        <div className="flex items-center gap-6">
          <div className="relative">
            <div onClick={handleBellClick} className="relative flex items-center justify-center p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-600">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
              )}
            </div>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">{t('navbar.latestPublications')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user.role === 'patient' ? t('navbar.byPathologies') : t('navbar.bySpecialty')}
                  </p>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {loadingPubs ? (
                    <div className="p-8 text-center text-slate-500 text-sm">{t('navbar.searchingPublications')}</div>
                  ) : errorPubs ? (
                    <div className="p-8 text-center text-red-500 text-sm">{errorPubs}</div>
                  ) : latestPubs.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {latestPubs.map((pub, idx) => (
                        <a key={idx} href={pub.url} target="_blank" rel="noopener noreferrer" className="block p-4 hover:bg-slate-50 transition-colors">
                          <h4 className="text-sm font-medium text-slate-800 line-clamp-2 leading-tight mb-1">{pub.title}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">{pub.source}</span>
                            {pub.published_date && <span className="text-xs text-slate-400">{pub.published_date}</span>}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-sm">{t('navbar.noPublications')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Link to={user.role === 'doctor' ? "/doctor/profile" : "/profile"} className="flex flex-col items-end hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
            <span className="text-sm font-medium text-slate-800">{user.name}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{user.role}</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 hover:text-red-500 cursor-pointer"
            title={t('navbar.changeRole')}
          >
            <LogOut size={20} />
          </button>
        </div>
      )}
    </nav>
  );
}
