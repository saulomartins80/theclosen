import { useState, useEffect, useRef, useCallback } from 'react';
import { FiX, FiSun, FiMoon, FiMonitor, FiMenu, FiSearch, FiBell, FiSettings, FiUser, FiLogOut, FiChevronRight } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import Image from 'next/image'; // Importe o componente Image do Next.js

type Theme = 'light' | 'dark' | 'system';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
}

export default function Header({ isSidebarOpen, toggleMobileSidebar }: HeaderProps) {
  const { user, logout: authContextLogout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setShowThemeDropdown(false);
      setShowProfileDropdown(false);
      setShowNotifications(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  // Dados otimizados para evitar recriação
  const themeOptions = [
    { value: 'light', icon: FiSun, label: 'Claro' },
    { value: 'dark', icon: FiMoon, label: 'Escuro' },
    { value: 'system', icon: FiMonitor, label: 'Sistema' }
  ];

  const notifications = [
    { id: 1, text: 'Nova mensagem recebida', read: false },
    { id: 2, text: 'Atualização do sistema disponível', read: true }
  ];

  if (!user) {
    return null; 
  }

  if (!mounted) {
    return (
      <header className="h-16 bg-white dark:bg-gray-800 shadow-sm">
        <div className="h-full flex items-center justify-between px-4">
          <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="flex space-x-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-20
        h-16 flex items-center justify-between
        px-4 shadow-sm
        ${resolvedTheme === 'dark'       
          ? 'bg-gray-800 border-b border-gray-700' 
          : 'bg-white border-b border-gray-200'
        }
      `} 
      ref={dropdownRef}
    >
      {/* Botão do menu mobile otimizado */}
      <button
        onClick={toggleMobileSidebar}
        className={`
          p-2 rounded-full md:hidden
          ${resolvedTheme === 'dark' 
            ? 'hover:bg-gray-700 text-white' 
            : 'hover:bg-gray-200 text-gray-900'
          }
          transition-colors duration-200
        `}
        aria-label={isSidebarOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isSidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Logo/Título otimizado */}
      <div className="flex items-center ml-2 md:ml-4">
        <Link href="/" className="text-xl font-bold cursor-pointer">
          {/* Seu Logo ou Nome do App aqui */}
        </Link>
      </div>

      {/* Barra de pesquisa (desktop) */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className={`
          relative w-full
          ${resolvedTheme === 'dark'
            ? 'bg-gray-700 text-white'
            : 'bg-gray-100 text-gray-900'
          } rounded-lg transition-colors
        `}>
          <input
            type="text"
            placeholder="Buscar..."
            className={`
              w-full py-2 px-4 pl-10
              bg-transparent outline-none
              ${resolvedTheme === 'dark' ? 'placeholder-gray-400' : 'placeholder-gray-500'}
            `}
          />
          <FiSearch className={`
            absolute left-3 top-1/2 transform -translate-y-1/2
            ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}
          `} />
        </div>
      </div>

      {/* Ícones de controle */}
      <div className="flex items-center space-x-3">
        {/* Seletor de Tema */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeDropdown(!showThemeDropdown);
              setShowProfileDropdown(false);
              setShowNotifications(false);
            }}
            className={`
              p-2 rounded-full
              ${resolvedTheme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-200 text-gray-700'
              }
            `}
            aria-label="Alterar tema"
          >
            {resolvedTheme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>

          {showThemeDropdown && (
            <div className={`
              absolute right-0 mt-2 w-48 z-40
              rounded-md shadow-lg py-1
              ${resolvedTheme === 'dark'
                ? 'bg-gray-700 border border-gray-600'
                : 'bg-white border border-gray-200'
              }
            `}>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value as Theme);
                    setShowThemeDropdown(false);
                  }}
                  className={`
                    w-full px-4 py-2 text-left flex items-center
                    ${theme === option.value
                      ? resolvedTheme === 'dark'
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-blue-100 text-blue-800'
                      : resolvedTheme === 'dark'
                        ? 'hover:bg-gray-600 text-gray-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }
                  `}
                >
                  <option.icon className="mr-3" />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowThemeDropdown(false);
              setShowProfileDropdown(false);
            }}
            className={`
              p-2 rounded-full relative
              ${resolvedTheme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-200 text-gray-700'
              }
            `}
            aria-label="Notificações"
          >
            <FiBell size={20} />
            {notifications.some(n => !n.read) && (
              <span className={`
                absolute top-0 right-0 w-2 h-2 rounded-full
                ${resolvedTheme === 'dark' ? 'bg-red-500' : 'bg-red-600'}
              `}></span>
            )}
          </button>

          {showNotifications && (
            <div className={`
              absolute right-0 mt-2 w-72 z-40
              rounded-md shadow-lg py-1
              ${resolvedTheme === 'dark'
                ? 'bg-gray-700 border border-gray-600'
                : 'bg-white border border-gray-200'
              }
            `}>
              <div className={`
                px-4 py-2 border-b
                ${resolvedTheme === 'dark' 
                  ? 'border-gray-600 text-white' 
                  : 'border-gray-200 text-gray-800'
                }
              `}>
                <h3 className="font-medium">Notificações</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`
                        px-4 py-3 border-b
                        ${!notification.read 
                          ? resolvedTheme === 'dark' 
                            ? 'bg-blue-900/20 border-blue-800' 
                            : 'bg-blue-50 border-blue-100'
                          : resolvedTheme === 'dark'
                            ? 'border-gray-600'
                            : 'border-gray-100'
                        }
                      `}
                    >
                      <p className={`
                        ${resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
                      `}>
                        {notification.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center text-gray-500">
                    Nenhuma notificação
                  </div>
                )}
              </div>
              <div className={`
                px-4 py-2 text-center
                ${resolvedTheme === 'dark' 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
                }
              `}>
                <Link href="/notificacoes" className="hover:underline">
                  Ver todas
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Perfil do usuário */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileDropdown(!showProfileDropdown);
              setShowThemeDropdown(false);
              setShowNotifications(false);
            }}
            className={`
              flex items-center gap-2 p-2 rounded
              ${resolvedTheme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-200 text-gray-700'
              }
            `}
            aria-label="Menu do usuário"
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center overflow-hidden
              ${resolvedTheme === 'dark'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-300 text-gray-700'
              }
            `}>
              {(user.photoUrl || user.photoURL) ? (
                <Image 
                  src={user.photoUrl || user.photoURL || ''} 
                  alt="Avatar do usuário"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
              )}
            </div>
            <span className="hidden md:inline">{user.name || user.email}</span>
            <FiChevronRight className={`
              ${showProfileDropdown ? 'transform rotate-90' : ''}
              transition-transform
            `} />
          </button>

          {showProfileDropdown && (
            <div className={`
              absolute right-0 mt-2 w-56 z-40
              rounded-md shadow-lg py-1
              ${resolvedTheme === 'dark'
                ? 'bg-gray-700 border border-gray-600'
                : 'bg-white border border-gray-200'
              }
            `}>
              <div className={`
                px-4 py-3 border-b
                ${resolvedTheme === 'dark' 
                  ? 'border-gray-600 text-white' 
                  : 'border-gray-200 text-gray-800'
                }
              `}>
                <p className="font-medium truncate">{user.name || user.email}</p>
                <p className="text-sm text-gray-400 truncate">{user.email}</p>
              </div>
              <Link
                href="/perfil"
                className={`
                  w-full px-4 py-3 text-left flex items-center
                  ${resolvedTheme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-200'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                onClick={() => setShowProfileDropdown(false)}
              >
                <FiUser className="mr-3" />
                Perfil
              </Link>
              <Link
                href="/configuracoes"
                className={`
                  w-full px-4 py-3 text-left flex items-center
                  ${resolvedTheme === 'dark'
                    ? 'hover:bg-gray-600 text-gray-200'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                onClick={() => setShowProfileDropdown(false)}
              >
                <FiSettings className="mr-3" />
                Configurações
              </Link>
              <div className={`
                px-4 py-3 border-t
                ${resolvedTheme === 'dark'
                  ? 'border-gray-600 hover:bg-gray-600 text-red-400'
                  : 'border-gray-200 hover:bg-gray-100 text-red-600'
                }
              `}>
                <button
                  onClick={async () => {
                    await authContextLogout();
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left flex items-center"
                >
                  <FiLogOut className="mr-3" />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}