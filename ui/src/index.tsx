import { ConfigProvider, message } from "antd";
import { extend as extendDayJsWith } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { UserDetailsProvider } from "./contexts/UserDetails";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { Router } from "src/components/shared/Router";
import { EnvProvider } from "src/contexts/Env";
import { IssuerStateProvider } from "src/contexts/IssuerState";
import { theme } from "src/styles/theme";
import { TOAST_NOTIFICATION_TIMEOUT } from "src/utils/constants";

import "src/styles/index.scss";

extendDayJsWith(relativeTime);

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root HTML element could not be found in the DOM");
}

const root = createRoot(rootElement);

message.config({ duration: TOAST_NOTIFICATION_TIMEOUT });

root.render(
  <StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <EnvProvider>
          <IssuerStateProvider>
            <UserDetailsProvider>
              <Router />
            </UserDetailsProvider>
          </IssuerStateProvider>
        </EnvProvider>
      </ConfigProvider>
    </BrowserRouter>
  </StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
