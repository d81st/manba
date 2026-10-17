"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Default Supabase email links (invite, password recovery) return the session
// in the URL fragment, which never reaches the server. Pick it up here and
// store it in cookies, then continue on the server-rendered pages.
export function AuthHashHandler() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.has("error_code")) {
      window.location.replace("/auth/error");
      return;
    }

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) return;

    const type = params.get("type");
    // Drop the tokens from the address bar and history right away.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );

    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          window.location.replace("/auth/error");
          return;
        }
        const setsPassword = type === "invite" || type === "recovery";
        window.location.replace(setsPassword ? "/account/password" : "/");
      });
  }, []);

  return null;
}
