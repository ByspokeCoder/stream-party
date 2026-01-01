"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

export default function Navigation() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold">
                Stream Party
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className="border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
              >
                Home
              </Link>
              {isLoaded && (
                <>
                  {isSignedIn ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                      >
                        Dashboard
                      </Link>
                      <div className="flex items-center">
                        <UserButton afterSignOutUrl="/" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="border-transparent text-gray-300 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                      >
                        Signup
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className="bg-gray-900 border-gray-700 text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Home
          </Link>
          {isLoaded && (
            <>
              {isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="pl-3 pr-4 py-2">
                    <UserButton afterSignOutUrl="/" />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="border-transparent text-gray-300 hover:bg-gray-700 hover:border-gray-300 hover:text-white block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
                  >
                    Signup
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

