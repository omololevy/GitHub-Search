import prisma from '../src/lib/prisma';
import { findCountryByLocation } from '../src/utils/countries';
import { GitHubUserResponse, GitHubRepoResponse } from '../src/types/github';

const GITHUB_API = "https://api.github.com";
const BATCH_SIZE = 10;
const DELAY_BETWEEN_REQUESTS = 1000;

async function fetchWithAuth(url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function populateDatabase() {
  try {
    console.log('Starting database population...');

    // Fetch top GitHub users
    const response = await fetchWithAuth(
      `${GITHUB_API}/search/users?q=followers:>900&sort=followers&per_page=100`
    );
    const data = await response.json();

    console.log(`Found ${data.items.length} users to process`);

    // Process users in batches
    for (let i = 0; i < data.items.length; i += BATCH_SIZE) {
      const batch = data.items.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i/BATCH_SIZE + 1}...`);

      await Promise.all(batch.map(async (user: GitHubUserResponse) => {
        try {
          const [userDetails, repos] = await Promise.all([
            fetchWithAuth(`${GITHUB_API}/users/${user.login}`)
              .then((res) => res.json()) as Promise<GitHubUserResponse>,
            fetchWithAuth(`${GITHUB_API}/users/${user.login}/repos?per_page=100`)
              .then((res) => res.json()) as Promise<GitHubRepoResponse[]>,
          ]);

          const totalStars = repos.reduce(
            (acc: number, repo: GitHubRepoResponse) => 
              acc + (repo.stargazers_count || 0),
            0
          );

          const contributions = Math.floor((userDetails.public_repos * 50) + (userDetails.followers * 2));
          const country = userDetails.location ? findCountryByLocation(userDetails.location)?.name : null;

          await prisma.user.upsert({
            where: { login: userDetails.login },
            update: {
              name: userDetails.name,
              location: userDetails.location,
              country,
              public_repos: userDetails.public_repos,
              followers: userDetails.followers,
              avatar_url: userDetails.avatar_url,
              totalStars,
              contributions,
            },
            create: {
              login: userDetails.login,
              name: userDetails.name || '',
              location: userDetails.location,
              country,
              public_repos: userDetails.public_repos,
              followers: userDetails.followers,
              avatar_url: userDetails.avatar_url,
              totalStars,
              contributions,
            },
          });

          console.log(`Processed user: ${userDetails.login}`);
        } catch (error) {
          console.error(`Error processing user ${user.login}:`, error);
        }
      }));

      // Add delay between batches
      await delay(DELAY_BETWEEN_REQUESTS);
    }

    console.log('Database population completed!');
  } catch (error) {
    console.error('Failed to populate database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateDatabase();
