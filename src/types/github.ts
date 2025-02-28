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

export interface UserStats {
  login: string;
  name: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  avatar_url: string;
  totalStars: number;
  contributions: number;
  country: string | null;
  detectedCountry?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface RankingFilters {
  type: "user" | "organization" | "all";
  country: string | "global";
  page: number;
  perPage: number;
  sortBy: "followers" | "totalStars" | "contributions" | "public_repos";
}

export interface GitHubRepoResponse {
  stargazers_count: number;
  id: number;
  name: string;
}

export interface GitHubUserResponse {
  login: string;
  name: string;
  location: string;
  public_repos: number;
  followers: number;
  avatar_url: string;
  id: number;
}

export interface GitHubContributionsResponse {
  total: number;
}
