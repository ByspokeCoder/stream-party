import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import IntegrationForm from "./components/IntegrationForm";

export default async function Dashboard() {
  const user = await currentUser();

  if (!user) {
    redirect("/login");
  }

  const username = user.username || user.firstName || user.emailAddresses[0]?.emailAddress || "User";

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-6">Dashboard</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <p className="text-xl text-center text-gray-700 dark:text-gray-300">
            Logged in as <span className="font-semibold">{username}</span>
          </p>
          {user.emailAddresses[0] && (
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
              {user.emailAddresses[0].emailAddress}
            </p>
          )}
        </div>
        <IntegrationForm />
      </div>
    </main>
  );
}

