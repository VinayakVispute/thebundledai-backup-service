"use client";

import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-4 mr-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Flair%20Collective-S8yYqOnFOwnuFuKFLmpKoPJVVDa2H8.png"
            alt="theBundledai Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-semibold bg-gradient-to-r from-cyan-200 to-yellow-100 bg-clip-text text-transparent">
            Bundled.design
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant={pathname === "/" ? "secondary" : "ghost"} asChild>
            <Link href="/">Dashboard</Link>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <UserButton afterSignOutUrl="/signin" />
        </div>
      </div>
    </div>
  );
}
