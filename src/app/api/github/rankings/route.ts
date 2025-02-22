/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import {
  UserStats,
  PaginatedResponse,
  RankingFilters,
  GitHubUserResponse,
  GitHubRepoResponse,
} from "@/types/github";

async function fetchWithAuth(url: string) {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
}

interface GitHubSearchResponse {
  items: GitHubUserResponse[];
  total_count: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: RankingFilters = {
      type: (searchParams.get("type") || "all") as RankingFilters["type"],
      country: searchParams.get("country") || "global",
      page: parseInt(searchParams.get("page") || "1"),
      perPage: parseInt(searchParams.get("perPage") || "20"),
      sortBy: (searchParams.get("sortBy") ||
        "followers") as RankingFilters["sortBy"],
    };

    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GitHub token is not configured");
    }

    let query = "followers:>1000";
    if (filters.type !== "all") {
      query += ` type:${filters.type}`;
    }

    const response = await fetchWithAuth(
      `https://api.github.com/search/users?q=${query}&sort=followers&per_page=100`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'GitHub API request failed');
    }

    const searchData: GitHubSearchResponse = await response.json();
    
    if (!searchData || !Array.isArray(searchData.items)) {
      throw new Error('Invalid response from GitHub API');
    }

    let users = await Promise.all(
      searchData.items.map(async (user: GitHubUserResponse) => {
        try {
          const [userDetails, repos] = await Promise.all([
            fetchWithAuth(`https://api.github.com/users/${user.login}`)
              .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch user details')),
            fetchWithAuth(`https://api.github.com/users/${user.login}/repos`)
              .then(res => res.ok ? res.json() : Promise.reject('Failed to fetch repos'))
          ]);

          const totalStars = repos.reduce(
            (acc: number, repo: GitHubRepoResponse) => acc + (repo.stargazers_count || 0),
            0
          );

          const contributions = Math.floor((userDetails.public_repos * 50) + (userDetails.followers * 2));

          return {
            ...userDetails,
            totalStars,
            contributions,
          } as UserStats;
        } catch (error) {
          console.error(`Error fetching data for user ${user.login}:`, error);
          return null;
        }
      })
    );

    // Filter out failed requests
    users = users.filter((user): user is UserStats => user !== null);

    // Filter by country if specified
    if (filters.country !== "global") {
      users = users.filter((user) =>
        user.location?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Sort users
    users.sort((a, b) => b[filters.sortBy] - a[filters.sortBy]);

    // Paginate results
    const startIndex = (filters.page - 1) * filters.perPage;
    const paginatedUsers = users.slice(
      startIndex,
      startIndex + filters.perPage
    );

    const result: PaginatedResponse<UserStats> = {
      items: paginatedUsers,
      total: users.length,
      page: filters.page,
      perPage: filters.perPage,
      totalPages: Math.ceil(users.length / filters.perPage),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to fetch rankings",
        items: [],
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0
      },
      { status: 500 }
    );
  }
}
