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

  // Check if YouTube is connected and handle URL parameters
  useEffect(() => {
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
    const redirectUri = `${window.location.origin}/api/youtube/oauth`;
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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          YouTube Integration
        </h2>
        {isConnected ? (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
          >
            Connect YouTube
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
          {error}
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


