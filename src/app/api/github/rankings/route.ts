import { NextResponse } from "next/server";
import { UserStats, PaginatedResponse, RankingFilters } from "@/types/github";

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
    const { searchParams } = new URL(request.url);
    const filters: RankingFilters = {
      type: (searchParams.get('type') || 'all') as RankingFilters['type'],
      country: searchParams.get('country') || 'global',
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('perPage') || '20'),
      sortBy: (searchParams.get('sortBy') || 'followers') as RankingFilters['sortBy'],
    };

    // Build the query based on filters
    let query = 'followers:>1000';
    if (filters.type !== 'all') {
      query += ` type:${filters.type}`;
    }
    
    const response = await fetchWithAuth(
      `https://api.github.com/search/users?q=${query}&sort=followers&per_page=100`
    );

    const data = await response.json();
    let users = await Promise.all(
      data.items.map(async (user: any) => {
        const [userDetails, repos] = await Promise.all([
          fetchWithAuth(`https://api.github.com/users/${user.login}`).then(res => res.json()),
          fetchWithAuth(`https://api.github.com/users/${user.login}/repos`).then(res => res.json()),
        ]);

        return {
          ...userDetails,
          totalStars: repos.reduce((acc: number, repo: any) => acc + repo.stargazers_count, 0),
          contributions: Math.floor(Math.random() * 10000), // Mock data
        };
      })
    );

    // Filter by country if specified
    if (filters.country !== 'global') {
      users = users.filter(user => 
        user.location?.toLowerCase().includes(filters.country.toLowerCase())
      );
    }

    // Sort users
    users.sort((a, b) => b[filters.sortBy] - a[filters.sortBy]);

    // Paginate results
    const startIndex = (filters.page - 1) * filters.perPage;
    const paginatedUsers = users.slice(startIndex, startIndex + filters.perPage);

    const result: PaginatedResponse<UserStats> = {
        items: paginatedUsers,
        total: users.length,
        page: filters.page,
        perPage: filters.perPage,
        totalPages: Math.ceil(users.length / filters.perPage),
      };
      
      return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}
