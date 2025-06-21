// components/ProfileMenu.tsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Settings, User, HelpCircle, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from 'next/image';
import { useAuth } from "../context/AuthContext"; // Import useAuth
import { useRouter } from 'next/router';
// Firebase signOut and auth are no longer needed here directly for logout, as AuthContext handles it.
// import { signOut } from 'firebase/auth'; 
// import { auth } from '../lib/firebase/client';

// Remove local logout function, AuthContext will handle the full logout process
// export const logout = async () => {
//   await signOut(auth);
// };

type MenuItem = {
  icon: LucideIcon;
  label: string;
  path?: string;
  action?: () => Promise<void> | void;
  color?: string;
  divider?: boolean;
  disabled?: boolean;
  external?: boolean;
};

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  // Destructure user AND the logout function from AuthContext
  const { user, logout: authContextLogout } = useAuth(); 

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Updated handleLogout to use the logout function from AuthContext
  const handleLogoutClick = async () => {
    setIsLoggingOut(true);
    try {
      await authContextLogout(); // Call the logout from AuthContext
      // Navigation to /auth/login is now handled within AuthContext's logout function
      // router.push('/auth/login'); // This line can be removed if AuthContext handles redirect
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Error state is likely handled by AuthContext, but you could add local feedback if needed
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false); // Close menu regardless of outcome, AuthContext might redirect anyway
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  const menuItems: MenuItem[] = [
    {
      icon: User,
      label: 'Meu Perfil',
      disabled: false,
      action: () => handleNavigation('/profile')
    },
    {
      icon: Settings,
      label: 'Configurações',
      disabled: false,
      action: () => handleNavigation('/configuracoes')
    },
    {
      icon: Mail,
      label: 'Suporte',
      divider: true,
      external: true,
      action: () => { 
        window.open('mailto:suporte@seudominio.com', '_blank');
        setIsOpen(false); // Close menu after action
        return;
      }
    },
    {
      icon: HelpCircle,
      label: 'Documentação',
      external: true,
      action: () => { 
        window.open('https://docs.seudominio.com', '_blank');
        setIsOpen(false); // Close menu after action
        return;
      }
    },
    {
      icon: LogOut,
      label: isLoggingOut ? 'Saindo...' : 'Sair',
      action: handleLogoutClick, // Use the updated handler that calls AuthContext logout
      color: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
    },
  ];

  // Use user.name (from MongoDB via AuthContext) if available, then try displayName, then email
  const userName = user?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const userPhoto = user?.photoUrl || user?.photoURL; // Prioritize photoUrl from MongoDB via AuthContext

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        aria-label="Menu do usuário"
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={`
          flex items-center space-x-2 p-2 rounded-full transition-all
          hover:bg-gray-200 dark:hover:bg-gray-700
          ${isOpen ? 'bg-gray-200 dark:bg-gray-700' : ''}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          {userPhoto ? (
            <Image
              src={userPhoto}
              alt={`Avatar de ${userName}`}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              priority // Consider if priority is always needed here
            />
          ) : (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {getInitials(userName)}
            </span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-gray-700 dark:text-gray-300" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 ring-1 ring-black/5 dark:ring-white/10"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'Não autenticado'}
              </p>
            </div>
            
            <div className="py-2">
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.divider && (
                    <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  )}
                  <button
                    className={`
                      w-full flex items-center space-x-3 p-3 text-sm transition-colors
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      ${item.color || 'text-gray-700 dark:text-gray-300'}
                      ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={async () => {
                      if (!item.disabled && item.action) {
                        await item.action();
                      }
                    }}
                    disabled={item.disabled || (isLoggingOut && item.label.includes('Sair'))}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="text-left">{item.label}</span>
                    {item.external && (
                      <span className="text-xs text-gray-400 ml-auto">↗</span>
                    )}
                  </button>
                </React.Fragment>
              ))}
            </div>

            <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
              v{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
