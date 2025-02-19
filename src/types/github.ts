export interface GitHubUser {
  login: string;
  name: string;
  location: string;
  public_repos: number;
  followers: number;
  avatar_url: string;
}

export interface GitHubRepo {
  stargazers_count: number;
}

export interface UserStats extends GitHubUser {
  totalStars: number;
  contributions: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface RankingFilters {
  type: 'user' | 'organization' | 'all';
  country: string | 'global';
  page: number;
  perPage: number;
  sortBy: 'followers' | 'totalStars' | 'contributions' | 'public_repos';
}
