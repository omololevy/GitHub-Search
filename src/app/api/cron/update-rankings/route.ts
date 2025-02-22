import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch top GitHub users
    const response = await fetchWithAuth(
      `${GITHUB_API}/search/users?q=followers:>1000&sort=followers&per_page=100`
    );
    const data = await response.json();

    // Process each user
    for (const user of data.items) {
      const [userDetails, repos] = await Promise.all([
        fetchWithAuth(`${GITHUB_API}/users/${user.login}`).then(res => res.json()),
        fetchWithAuth(`${GITHUB_API}/users/${user.login}/repos?per_page=100`).then(res => res.json()),
      ]);

      const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
      const contributions = Math.floor((userDetails.public_repos * 50) + (userDetails.followers * 2));

      // Update or create user in database
      await prisma.user.upsert({
        where: { login: userDetails.login },
        update: {
          name: userDetails.name,
          location: userDetails.location,
          public_repos: userDetails.public_repos,
          followers: userDetails.followers,
          avatar_url: userDetails.avatar_url,
          totalStars,
          contributions,
        },
        create: {
          login: userDetails.login,
          name: userDetails.name,
          location: userDetails.location,
          public_repos: userDetails.public_repos,
          followers: userDetails.followers,
          avatar_url: userDetails.avatar_url,
          totalStars,
          contributions,
        },
      });

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({ success: true, updated: data.items.length });
  } catch (error) {
    console.error('Failed to update rankings:', error);
    return NextResponse.json({ error: 'Failed to update rankings' }, { status: 500 });
  }
}
