"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FiSearch, FiAward, FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: "/", label: "Search", icon: FiSearch },
    { path: "/ranks", label: "Rankings", icon: FiAward },
  ];

  const MenuItem = ({ path, label, icon: Icon }) => {
    const isActive = pathname === path;
    return (
      <Link
        href={path}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group ${
          isActive
            ? "bg-primary text-background shadow-lg shadow-primary/25"
            : "hover:bg-surface/80 text-foreground/80 hover:text-foreground"
        }`}
      >
        <div
          className={`p-2 rounded-lg ${
            isActive
              ? "bg-background/10"
              : "bg-background/5 group-hover:bg-background/10"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              isActive ? "" : "group-hover:scale-110"
            } transition-transform`}
          />
        </div>
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        initial={false}
        animate={{ scale: isOpen ? 0.9 : 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-xl bg-card border border-border/50 shadow-lg"
      >
        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
      </motion.button>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : -320,
          opacity: isOpen ? 1 : 0.5,
        }}
        className="lg:translate-x-0 lg:opacity-100 w-[280px] h-screen bg-card/50 backdrop-blur-xl fixed left-0 top-0 p-6 border-r border-border/50 shadow-xl shadow-black/5 z-40"
      >
        <div className="flex flex-col gap-2 pt-16 lg:pt-4">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GitHub Stats
            </h1>
            <p className="text-sm text-muted mt-1">Explore & Compare</p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <MenuItem key={item.path} {...item} />
            ))}
          </nav>

          {/* Bottom content */}
          <div className="mt-auto pt-8">
            <div className="p-4 rounded-xl bg-surface/50 border border-border/50">
              <p className="text-xs text-muted text-center">
                Made with ♥️ for GitHub community
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
