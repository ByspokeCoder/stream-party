"use client";

import { useState, useEffect } from "react";

interface Subscription {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  publishedAt?: string;
}

export default function YouTubeIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component only runs on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if YouTube is connected and handle URL parameters
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    
    try {
      // Check for success/error messages in URL
      const params = new URLSearchParams(window.location.search);
      if (params.get("youtube_connected") === "true") {
        setError(null);
        setIsConnected(true);
        fetchSubscriptions();
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      } else if (params.get("error")) {
        setError(params.get("error") || "Connection failed");
        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);
      } else {
        checkConnection();
      }
    } catch (error) {
      console.error("Error in YouTube integration useEffect:", error);
      // Still show the component even if there's an error
    }
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/youtube/subscriptions");
      if (response.ok) {
        setIsConnected(true);
        fetchSubscriptions();
      } else if (response.status === 404) {
        setIsConnected(false);
      } else {
        const data = await response.json();
        setError(data.error || "Connection check failed");
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnected(false);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/youtube/subscriptions");
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to fetch subscriptions");
        if (response.status === 401) {
          setIsConnected(false); // Token expired, need to reconnect
        }
      }
    } catch (error) {
      setError("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setError(null);
    
    // Get the actual origin from the current URL (handles Codespaces forwarding)
    // Use the full URL and extract origin to avoid localhost issues
    const currentUrl = new URL(window.location.href);
    const redirectUri = `${currentUrl.protocol}//${currentUrl.hostname}/api/youtube/oauth`;
    
    console.log("Initiating OAuth with redirect URI:", redirectUri);
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError("Google OAuth not configured");
      return;
    }

    // Build OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/youtube.readonly");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    // Redirect to Google OAuth
    window.location.href = authUrl.toString();
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect YouTube?")) return;

    try {
      const response = await fetch("/api/integrations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform: "youtube" }),
      });

      if (response.ok) {
        setIsConnected(false);
        setSubscriptions([]);
      } else {
        setError("Failed to disconnect");
      }
    } catch (error) {
      setError("Failed to disconnect");
    }
  };

  // Don't render until mounted (prevents hydration issues)
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          YouTube Integration
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            YouTube Integration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect your YouTube account to view your subscriptions
          </p>
        </div>
        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
          {error.includes("not configured") && (
            <p className="text-xs mt-2">
              This feature requires administrator setup. Please contact support.
            </p>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="text-center py-6">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Connect Your YouTube Account
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Click the button below to sign in with Google and connect your YouTube account.
            We'll only access your subscription list - no videos will be downloaded.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Secure connection • Read-only access • Encrypted storage
          </p>
        </div>
      )}

      {isConnected && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Your Subscriptions
            </h3>
            <button
              onClick={fetchSubscriptions}
              disabled={loading}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loading && subscriptions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Loading subscriptions...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No subscriptions found.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  {sub.thumbnail && (
                    <img
                      src={sub.thumbnail}
                      alt={sub.title}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200">
                      {sub.title}
                    </h4>
                    {sub.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {sub.description}
                      </p>
                    )}
                    {sub.publishedAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Subscribed: {new Date(sub.publishedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


