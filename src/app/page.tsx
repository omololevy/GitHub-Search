"use client";

import { useState } from "react";
import UserSearch from "@/components/UserSearch";
import LoadingSpinner from "@/components/LoadingSpinner";
import { UserStats } from "@/types/github";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [users, setUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUser = async (username: string) => {
    if (!username.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First, search for the user using GitHub's search API
      const searchResponse = await fetch(
        `https://api.github.com/search/users?q=${username}+in:login`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to search GitHub users');
      }

      const searchData = await searchResponse.json();
      
      if (searchData.total_count === 0) {
        setError(`No user found with username: ${username}`);
        setLoading(false);
        return;
      }

      // Then fetch detailed user data through our API
      const response = await fetch(`/api/github?username=${username}`);
      const userData = await response.json();

      if (!response.ok) {
        throw new Error(userData.error || 'Failed to fetch user details');
      }

      setUsers(prevUsers => {
        // Avoid duplicates
        const exists = prevUsers.some(user => user.login === userData.login);
        if (exists) return prevUsers;
        return [...prevUsers, userData];
      });
      
    } catch (error) {
      console.error("Error fetching user:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  const groupedUsers = users.reduce((acc, user) => {
    const country = user.location || "Unknown";
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(user);
    return acc;
  }, {} as Record<string, UserStats[]>);

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-2xl lg:text-4xl font-bold mb-6 lg:mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          GitHub User Rankings
        </h1>

        <div className="w-full lg:w-auto">
          <UserSearch onSearch={searchUser} />
          {error && (
            <p className="mt-4 text-red-500 text-sm">
              {error}
            </p>
          )}
        </div>

        {loading && <LoadingSpinner />}

        <AnimatePresence>
          {Object.entries(groupedUsers).map(([country, users]) => (
            <motion.div
              key={country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <h2 className="text-lg lg:text-xl font-bold mb-4">{country}</h2>
              <div className="grid gap-4">
                {users
                  .sort(
                    (a, b) =>
                      b.followers + b.totalStars - (a.followers + a.totalStars)
                  )
                  .map((user) => (
                    <div key={user.login} className="p-4 border rounded-lg">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                        <img
                          src={user.avatar_url}
                          alt={user.login}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold">
                            {user.name || user.login}
                          </h3>
                          <p className="text-sm text-muted break-words">
                            Followers: {user.followers} | Stars:{" "}
                            {user.totalStars} | Repos: {user.public_repos} |
                            Contributions: {user.contributions}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
