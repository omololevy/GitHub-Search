/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import {
  GitHubUserResponse,
  GitHubRepoResponse,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "GitHub API request failed");
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  if (remaining && parseInt(remaining) < 10) {
    console.warn("GitHub API rate limit is running low:", remaining);
  }

  return response;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error("GitHub token is not configured. Set GITHUB_TOKEN in your .env.local file.");
    }

    // Fetch user data
    const userResponse = await fetchWithAuth(`${GITHUB_API}/users/${username}`);
    const userData: GitHubUserResponse = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetchWithAuth(
      `${GITHUB_API}/users/${username}/repos?per_page=100`
    );
    const reposData: GitHubRepoResponse[] = await reposResponse.json();

    // Calculate total stars
    const totalStars = reposData.reduce(
      (acc: number, repo: GitHubRepoResponse) => acc + repo.stargazers_count,
      0
    );

    // Calculate contributions based on user data instead of random
    const mockContributions = Math.floor(
      (userData.public_repos * 50) + (userData.followers * 2)
    );

    return NextResponse.json({
      ...userData,
      totalStars,
      contributions: mockContributions,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch user data",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
