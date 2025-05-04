import { useTheme } from '../context/ThemeContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 ${
      resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className={`mt-6 text-center text-3xl font-extrabold ${
          resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Finanext
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-8 px-4 shadow sm:rounded-lg sm:px-10 ${
          resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}>
          {children}
        </div>
      </div>
    </div>
  );
}