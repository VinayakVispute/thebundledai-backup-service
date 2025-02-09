import { SignIn, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function SignInPage() {
  const { userId } = useAuth();

  if (userId) {
    redirect("/");
  }
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4 mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Flair%20Collective-S8yYqOnFOwnuFuKFLmpKoPJVVDa2H8.png"
              alt="Bundled Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <span className="text-2xl font-semibold bg-gradient-to-r from-cyan-200 to-yellow-100 bg-clip-text text-transparent">
              Bundled.design
            </span>
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-8 flex justify-center items-center">
          <SignIn />
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          By signing in, you agree to our{" "}
          <Link
            href="#"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
