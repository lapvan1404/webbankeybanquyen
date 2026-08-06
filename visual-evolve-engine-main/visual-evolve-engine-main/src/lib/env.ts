export type AppEnv = {
  apiBaseUrl: string;
  appName: string;
  appTitle: string;
  enableDevLog: boolean;
};

const runtimeHost = typeof window !== "undefined" ? window.location.hostname : undefined;
const defaultApiHost = runtimeHost ?? "localhost";

const env: AppEnv = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL?.trim() ?? `http://${defaultApiHost}:4000`,
  appName: import.meta.env.VITE_APP_NAME?.trim() ?? "Công Ty TNHH Công Nghệ Nam Nguyễn",
  appTitle:
    import.meta.env.VITE_APP_TITLE?.trim() ??
    "Phần mềm bản quyền Windows, Office, Antivirus chính hãng",
  enableDevLog: import.meta.env.VITE_ENABLE_DEV_LOG === "true",
};

export default env;
