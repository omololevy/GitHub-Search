"use client";

import { useState, useEffect } from "react";
import { UserStats, RankingFilters, PaginatedResponse } from "@/types/github";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function RanksPage() {
  const [filters, setFilters] = useState<RankingFilters>({
    type: "all",
    country: "global",
    page: 1,
    perPage: 20,
    sortBy: "followers",
  });
  const [data, setData] = useState<PaginatedResponse<UserStats> | null>(null);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchRankings();
  }, [filters]);

  const fetchRankings = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      type: filters.type,
      country: filters.country,
      page: filters.page.toString(),
      perPage: filters.perPage.toString(),
      sortBy: filters.sortBy,
    });

    try {
      const response = await fetch(`/api/github/rankings?${params}`);
      const data = await response.json();
      setData(data);

      // Extract unique countries for the filter
      if (filters.country === "global") {
        const uniqueCountries = [
          ...new Set(
            data.items.map((user: UserStats) => user.location).filter(Boolean)
          ),
        ];
        setCountries(uniqueCountries);
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8 bg-card rounded-xl p-6 shadow-soft-lg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          GitHub Rankings
        </h1>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                type: e.target.value as RankingFilters["type"],
                page: 1,
              }))
            }
            className="px-4 py-2 rounded-lg bg-surface"
          >
            <option value="all">All</option>
            <option value="user">Users</option>
            <option value="organization">Organizations</option>
          </select>

          <select
            value={filters.country}
            onChange={(e) =>
              setFilters((f) => ({ ...f, country: e.target.value, page: 1 }))
            }
            className="px-4 py-2 rounded-lg bg-surface"
          >
            <option value="global">Global</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>

          {/* Sort buttons */}
          <div className="flex gap-2">
            {(["followers", "totalStars", "contributions", "public_repos"] as const).map((key) => (
              <button
                key={key}
                onClick={() =>
                  setFilters((f) => ({ ...f, sortBy: key, page: 1 }))
                }
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  filters.sortBy === key
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-surface hover:bg-opacity-80"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <AnimatePresence>
            <div className="grid gap-4">
              {data?.items.map((user, index) => (
                <motion.div
                  key={user.login}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-card p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <motion.div
                        className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full opacity-75 blur"
                        animate={{
                          scale: [1, 1.2, 1],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      />
                      <img
                        src={user.avatar_url}
                        alt={user.login}
                        className="w-16 h-16 rounded-full relative"
                      />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold">
                        {user.name || user.login}
                      </h2>
                      <p className="text-muted">{user.location}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <StatCard
                        label="Followers"
                        value={user.followers}
                        highlight={filters.sortBy === "followers"}
                      />
                      <StatCard
                        label="Stars"
                        value={user.totalStars}
                        highlight={filters.sortBy === "totalStars"}
                      />
                      <StatCard
                        label="Contributions"
                        value={user.contributions}
                        highlight={filters.sortBy === "contributions"}
                      />
                      <StatCard
                        label="Repositories"
                        value={user.public_repos}
                        highlight={filters.sortBy === "public_repos"}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {data && (
            <div className="mt-8 flex justify-center gap-2">
              {Array.from({ length: data.totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    data.page === i + 1
                      ? "bg-primary text-white"
                      : "bg-surface hover:bg-opacity-80"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div
      className={`p-3 rounded-lg ${
        highlight ? "bg-primary text-white" : "bg-surface"
      }`}
    >
      <div className="text-sm">{label}</div>
      <div className="text-xl font-bold">{value.toLocaleString()}</div>
    </div>
  );
}
