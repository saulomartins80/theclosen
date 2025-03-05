import type { AppProps } from "next/app";
import { ThemeProvider } from "../context/ThemeContext";
import { FinanceProvider } from "../context/FinanceContext";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <Component {...pageProps} />
      </FinanceProvider>
    </ThemeProvider>
  );
}

export default MyApp;