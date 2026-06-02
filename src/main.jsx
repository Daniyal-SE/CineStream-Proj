import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Global fetch interceptor to bypass corrupted TMDB CDN/CloudFront caches
const originalFetch = window.fetch.bind(window);
window.fetch = function (input, init) {
  let urlStr = typeof input === "string" ? input : (input instanceof URL ? input.href : "");
  if (urlStr.includes("api.themoviedb.org") || urlStr.includes("api.tmdb.org")) {
    try {
      const url = new URL(urlStr);
      url.searchParams.set("_cb", Date.now().toString());
      if (typeof input === "string") {
        input = url.toString();
      } else if (input instanceof URL) {
        input = url;
      }
    } catch (e) {
      const sep = urlStr.includes("?") ? "&" : "?";
      if (typeof input === "string") {
        input = `${urlStr}${sep}_cb=${Date.now()}`;
      }
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
