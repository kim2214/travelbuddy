import { TDSMobileAITProvider } from "@toss/tds-mobile-ait";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import config from "../granite.config.ts";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import { CountryProvider } from "./context/CountryProvider.tsx";
import { ExchangeRateProvider } from "./context/ExchangeRateProvider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TDSMobileAITProvider brandPrimaryColor={config.brand.primaryColor}>
      {/* Provider 안쪽에 두어 에러 화면(TDS Result)도 TDS 테마로 렌더돼요. */}
      <AppErrorBoundary>
        <CountryProvider>
          <ExchangeRateProvider>
            <App />
          </ExchangeRateProvider>
        </CountryProvider>
      </AppErrorBoundary>
    </TDSMobileAITProvider>
  </StrictMode>,
);
