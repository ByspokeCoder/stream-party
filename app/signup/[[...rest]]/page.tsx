import { SignUp } from "@clerk/nextjs";

export default function Signup() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
          routing="hash"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </main>
  );
}

