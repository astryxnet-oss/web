import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface AuthResponse {
  user: User | null;
}

export function useAuth() {
  const { data, isLoading, error, refetch } = useQuery<User | AuthResponse>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  // Handle both direct User response (when authenticated) and { user: null } response
  const user = data && 'user' in data ? data.user : (data as User | undefined);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
  };
}
