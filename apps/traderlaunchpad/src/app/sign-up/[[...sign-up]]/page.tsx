import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="container mx-auto flex min-h-screen max-w-md items-center justify-center py-10">
      <SignUp routing="path" path="/sign-up" />
    </main>
  );
}


