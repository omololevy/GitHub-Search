/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserStats, PaginatedResponse, RankingFilters } from "@/types/github";
import { findCountryByLocation, countries } from "@/utils/countries";

// Add these utility functions at the top
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
        const resetTime = response.headers.get("x-ratelimit-reset");
        const rateLimitRemaining = response.headers.get(
          "x-ratelimit-remaining"
        );
        console.warn(`Rate limit remaining: ${rateLimitRemaining}`);

        if (resetTime) {
          const waitTime = parseInt(resetTime) * 1000 - Date.now();
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
  throw new Error("Max retries reached");
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

    let whereClause = {};

    if (filters.country !== "global") {
      const selectedCountry = countries.find((c) => c.code === filters.country);
      if (selectedCountry) {
        whereClause = {
          country: selectedCountry.name,
        };
      }
    }

    // Query the database with improved country filtering
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { [filters.sortBy]: "desc" },
      skip: (filters.page - 1) * filters.perPage,
      take: filters.perPage,
    });

    const total = await prisma.user.count({
      where: whereClause,
    });

    // Enhance user data with better country detection
    const enhancedUsers = users.map((user) => ({
      ...user,
      detectedCountry: user.location
        ? findCountryByLocation(user.location)?.name
        : null,
    }));

    const result: PaginatedResponse<UserStats> = {
      items: enhancedUsers,
      total,
      page: filters.page,
      perPage: filters.perPage,
      totalPages: Math.ceil(total / filters.perPage),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Rankings API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch rankings",
        items: [],
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0,
      },
      { status: 500 }
    );
  }
}
