"use client";

import { useState, useEffect } from "react";
import { UserStats, RankingFilters, PaginatedResponse } from "@/types/github";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";
import { countries } from "@/utils/countries";

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
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<string[]>([]);

  useEffect(() => {
    fetchRankings();
  }, [filters]);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        type: filters.type,
        country: filters.country,
        page: filters.page.toString(),
        perPage: filters.perPage.toString(),
        sortBy: filters.sortBy,
      });

      const response = await fetch(`/api/github/rankings?${params}`);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch rankings');
      }

      if (!responseData.items) {
        throw new Error('Invalid response format from API');
      }

      setData(responseData);

      // Update countries list
      if (filters.country === "global") {
        const validLocations = responseData.items
          .map(user => user.location)
          .filter((location): location is string => 
            typeof location === 'string' && location.length > 0
          );
          
        const uniqueCountries = [...new Set(validLocations)].sort();
        setCountries(uniqueCountries);
      }
    } catch (error) {
      console.error("Error fetching rankings:", error);
      setError(error instanceof Error ? error.message : 'Failed to fetch rankings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8 bg-card rounded-xl p-4 lg:p-6 shadow-soft-lg">
        <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          GitHub Rankings
        </h1>

        {/* Filters */}
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
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
            <optgroup label="Countries">
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </optgroup>
          </select>

          {/* Sort buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "followers", label: "Followers" },
              { key: "totalStars", label: "Total Stars" },
              { key: "contributions", label: "Contributions" },
              { key: "public_repos", label: "Repositories" }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() =>
                  setFilters((f) => ({ ...f, sortBy: key as RankingFilters["sortBy"], page: 1 }))
                }
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  filters.sortBy === key
                    ? "bg-primary text-white shadow-lg scale-105"
                    : "bg-surface hover:bg-opacity-80"
                }`}
                title={`Sort by ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

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
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
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
                    <div className="grid grid-cols-2 gap-2 lg:gap-4 w-full lg:w-auto">
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
            <div className="mt-8 flex flex-wrap justify-center gap-2">
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
