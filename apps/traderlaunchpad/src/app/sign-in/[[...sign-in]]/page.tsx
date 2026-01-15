import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="container mx-auto flex min-h-screen max-w-md items-center justify-center py-10">
      <SignIn routing="path" path="/sign-in" />
    </main>
  );
}


