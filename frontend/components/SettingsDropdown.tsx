// components/SettingsDropdown.tsx
import { Settings, Moon, Sun, Monitor, Bell, BellOff, Check } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/router";
import { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

type Theme = "light" | "dark" | "system";

interface ThemeItem {
  value: Theme;
  icon: ComponentType<LucideProps>;
  label: string;
  active: boolean;
  action: () => void;
}

interface NotificationItem {
  icon: ComponentType<LucideProps>;
  label: string;
  action: () => void;
  rightElement: React.ReactNode;
}

export const SettingsDropdown = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  
  const themeOptions: ThemeItem[] = [
    { 
      value: "light", 
      icon: Sun, 
      label: "Claro", 
      active: theme === "light", 
      action: () => setTheme("light") 
    },
    { 
      value: "dark", 
      icon: Moon, 
      label: "Escuro", 
      active: theme === "dark", 
      action: () => setTheme("dark") 
    },
    { 
      value: "system", 
      icon: Monitor, 
      label: "Sistema", 
      active: theme === "system", 
      action: () => setTheme("system") 
    }
  ];

  const notificationItems: NotificationItem[] = [
    {
      icon: Bell,
      label: "Ativar notificações",
      action: () => console.log("Notificações ativadas"),
      rightElement: <ToggleSwitch checked={true} onChange={() => {}} />
    },
    {
      icon: BellOff,
      label: "Modo silencioso",
      action: () => console.log("Modo silencioso ativado"),
      rightElement: <ToggleSwitch checked={false} onChange={() => {}} />
    }
  ];

  const quickSettings = [
    {
      label: "Tema",
      items: themeOptions
    },
    {
      label: "Notificações",
      items: notificationItems
    }
  ];

  return (
    <div className="p-2 space-y-4">
      {quickSettings.map((section, index) => (
        <div key={index}>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-2">
            {section.label}
          </h3>
          <div className="space-y-1">
            {section.items.map((item, itemIndex) => (
              <button
                key={itemIndex}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-2 rounded-md text-sm ${
                  'active' in item && item.active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <item.icon size={16} className="mr-2" />
                  <span>{item.label}</span>
                </div>
                {'rightElement' in item ? item.rightElement : ('active' in item && item.active && <Check size={16} />)}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => router.push('/settings')}
          className="w-full flex items-center p-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Settings size={16} className="mr-2" />
          <span>Todas as configurações</span>
        </button>
      </div>
    </div>
  );
};

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
  </label>
);