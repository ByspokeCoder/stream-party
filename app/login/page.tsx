import { SignIn } from "@clerk/nextjs";

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          routing="path"
          path="/login"
          signUpUrl="/signup"
          afterSignInUrl="/dashboard"
        />
      </div>
    </main>
  );
}

