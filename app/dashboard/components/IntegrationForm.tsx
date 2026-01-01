"use client";

import { useState, useEffect } from "react";

interface Integration {
  id: string;
  platform: string;
  token?: string;
  createdAt: string;
}

export default function IntegrationForm() {
  const [platform, setPlatform] = useState("");
  const [token, setToken] = useState("");
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch existing integrations
  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integrations");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    }
  };

  // Load integrations on mount
  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `Token saved for ${platform}!` });
        setPlatform("");
        setToken("");
        fetchIntegrations(); // Refresh list
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save token" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save token" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this integration?")) return;

    try {
      const response = await fetch(`/api/integrations?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Integration deleted" });
        fetchIntegrations();
      } else {
        setMessage({ type: "error", text: "Failed to delete integration" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to delete integration" });
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Add Integration Token
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="platform"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Platform
            </label>
            <input
              type="text"
              id="platform"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              placeholder="e.g., youtube, twitch, custom"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label
              htmlFor="token"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Token
            </label>
            <input
              type="password"
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your token"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This token will be encrypted with AES-256 before storage
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Token"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
          Your Integrations
        </h2>
        {integrations.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No integrations saved yet.</p>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">
                    {integration.platform}
                  </p>
                  {integration.token ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Token: {integration.token.substring(0, 10)}...
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                      {integration.error || "Token unavailable"}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Created: {new Date(integration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(integration.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={fetchIntegrations}
          className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md transition-colors"
        >
          Refresh List
        </button>
      </div>
    </div>
  );
}

