"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BiChat } from 'react-icons/bi';
import { PiPlantFill } from 'react-icons/pi';
import { IoBookOutline } from 'react-icons/io5';
import { FiUser, FiLogIn, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

interface TabProps {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}

const Tab = ({ href, label, active, icon }: TabProps) => {
  return (
    <Link href={href} className="block relative h-[46px]">
      <div className={`group absolute right-0 flex items-center gap-2 px-3 py-3 rounded-l-md transition-all duration-300 shadow-lg hover:translate-x-1 overflow-hidden ${
        active 
          ? 'bg-gradient-to-r from-purple-900 to-purple-800 text-purple-100 font-medium border-l-4 border-purple-500 hover:w-auto w-[46px] z-20' 
          : 'bg-gray-800/90 hover:bg-gray-700 text-gray-300 border-l border-purple-900/30 hover:w-auto w-[42px] z-10'
      }`}>
        <div className={`w-5 h-5 min-w-5 ${active ? 'text-purple-200' : 'text-gray-400 group-hover:text-gray-200'}`}>
          {icon}
        </div>
        <span className="whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden">
          {label}
        </span>
      </div>
    </Link>
  );
};

export default function TabNavigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  
  // Core navigation tabs
  const coreTabs = [
    { 
      href: '/chat', 
      label: 'Chat', 
      icon: <BiChat size={20} />,
      requiresAuth: true,
    },
    { 
      href: '/myplants', 
      label: 'My Plants', 
      icon: <PiPlantFill size={20} />,
      requiresAuth: true,
    },
    { 
      href: '/encyclopedia', 
      label: 'Encyclopedia', 
      icon: <IoBookOutline size={20} />,
      requiresAuth: false,
    }
  ];
  
  // Auth tabs change based on authentication status
  const authTabs = isAuthenticated
    ? [
        { 
          href: '/profile', 
          label: 'Profile', 
          icon: <FiUser size={20} />,
          requiresAuth: true,
          onClick: null,
        },
        { 
          href: '#', 
          label: 'Logout', 
          icon: <FiLogOut size={20} />,
          requiresAuth: true,
          onClick: logout,
        }
      ]
    : [
        { 
          href: '/auth/login', 
          label: 'Login', 
          icon: <FiLogIn size={20} />,
          requiresAuth: false,
          onClick: null,
        }
      ];
  
  // Combine all tabs
  const allTabs = [...coreTabs, ...authTabs];
  
  // Filter tabs based on authentication status
  const visibleTabs = allTabs.filter(tab => !tab.requiresAuth || isAuthenticated);
  
  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10 w-0">
      {visibleTabs.map((tab, index) => (
        tab.onClick 
          ? (
            <div key={tab.label} className="block relative h-[46px]" onClick={tab.onClick}>
              <div className={`group absolute right-0 flex items-center gap-2 px-3 py-3 rounded-l-md transition-all duration-300 shadow-lg hover:translate-x-1 overflow-hidden cursor-pointer
                bg-gray-800/90 hover:bg-gray-700 text-gray-300 border-l border-purple-900/30 hover:w-auto w-[42px] z-10
              `}>
                <div className={`w-5 h-5 min-w-5 text-gray-400 group-hover:text-gray-200`}>
                  {tab.icon}
                </div>
                <span className="whitespace-nowrap transition-all duration-300 opacity-0 group-hover:opacity-100 w-0 group-hover:w-auto overflow-hidden">
                  {tab.label}
                </span>
              </div>
            </div>
          )
          : (
            <Tab 
              key={tab.label}
              href={tab.href}
              label={tab.label}
              icon={tab.icon}
              active={pathname === tab.href || 
                     (pathname === '/' && tab.href === '/myplants') ||
                     (pathname.startsWith('/chat') && tab.href === '/chat') ||
                     (pathname.startsWith(tab.href) && tab.href !== '/')}
            />
          )
      ))}
    </div>
  );
} 