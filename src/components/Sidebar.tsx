"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-surface fixed left-0 top-0 p-4">
      <div className="flex flex-col gap-4">
        <Link
          href="/"
          className={`p-2 rounded-lg ${
            pathname === "/" ? "bg-primary text-background" : ""
          }`}
        >
          Search
        </Link>
        <Link
          href="/ranks"
          className={`p-2 rounded-lg ${
            pathname === "/ranks" ? "bg-primary text-background" : ""
          }`}
        >
          Ranks
        </Link>
      </div>
    </div>
  );
}
