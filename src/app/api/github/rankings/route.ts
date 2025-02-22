/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import {
  UserStats,
  PaginatedResponse,
  RankingFilters,
  GitHubUserResponse,
  GitHubRepoResponse,
} from "@/types/github";

// Add these utility functions at the top
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (response.status === 403) {
        const resetTime = response.headers.get('x-ratelimit-reset');
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        console.warn(`Rate limit remaining: ${rateLimitRemaining}`);
        
        if (resetTime) {
          const waitTime = (parseInt(resetTime) * 1000) - Date.now();
          if (waitTime > 0 && i < retries - 1) {
            await delay(Math.min(waitTime + 1000, 5000));
            continue;
          }
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Add a small delay between successful requests
      await delay(1000);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
  throw new Error('Max retries reached');
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

    // Modify the query to include location if country is specified
    let query = "followers:>100";
    if (filters.type !== "all") {
      query += ` type:${filters.type}`;
    }
    if (filters.country !== "global") {
      // Add location to the search query
      query += ` location:"${filters.country}"`;
    }

    const searchResponse = await fetchWithRetry(
      `https://api.github.com/search/users?q=${encodeURIComponent(query)}&sort=followers&per_page=30`
    );

    const searchData: GitHubSearchResponse = await searchResponse.json();
    
    // Process users in smaller batches
    const batchSize = 5;
    const processedUsers: UserStats[] = [];

    for (let i = 0; i < searchData.items.length; i += batchSize) {
      const batch = searchData.items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (user: GitHubUserResponse) => {
          try {
            const [userDetails, repos] = await Promise.all([
              fetchWithRetry(`https://api.github.com/users/${user.login}`)
                .then(res => res.json()),
              fetchWithRetry(`https://api.github.com/users/${user.login}/repos?per_page=100`)
                .then(res => res.json())
            ]);

            const totalStars = repos.reduce(
              (acc: number, repo: GitHubRepoResponse) => 
                acc + (repo.stargazers_count || 0),
              0
            );

            const contributions = Math.floor(
              (userDetails.public_repos * 50) + (userDetails.followers * 2)
            );

            return {
              ...userDetails,
              totalStars,
              contributions,
            } as UserStats;
          } catch (error) {
            console.error(`Error processing user ${user.login}:`, error);
            return null;
          }
        })
      );

      // Filter out failed requests and add successful ones to the result
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          processedUsers.push(result.value);
        }
      });

      // Add a delay between batches
      await delay(2000);
    }

    // Continue with existing filtering and pagination logic
    let users = processedUsers;

    // Improve country filtering
    if (filters.country !== "global") {
      users = users.filter((user) => {
        const userLocation = user.location?.toLowerCase() || "";
        const searchCountry = filters.country.toLowerCase();
        return userLocation.includes(searchCountry);
      });
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
