/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import {
  GitHubUserResponse,
  GitHubRepoResponse,
  GitHubContributionsResponse,
} from "@/types/github";

const GITHUB_API = "https://api.github.com";

async function fetchWithAuth(url: string) {
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
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
    const userResponse = await fetchWithAuth(`${GITHUB_API}/users/${username}`);
    const userData: GitHubUserResponse = await userResponse.json();

    const reposResponse = await fetchWithAuth(
      `${GITHUB_API}/users/${username}/repos`
    );
    const reposData: GitHubRepoResponse[] = await reposResponse.json();

    const contributionsResponse = await fetchWithAuth(
      `${GITHUB_API}/users/${username}/contributions`
    );
    const contributionsData: GitHubContributionsResponse =
      await contributionsResponse.json();

    const totalStars = reposData.reduce(
      (acc: number, repo: GitHubRepoResponse) => acc + repo.stargazers_count,
      0
    );

    return NextResponse.json({
      ...userData,
      totalStars,
      contributions: contributionsData.total,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
