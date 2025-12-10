---
name: tanstack-query-patterns
category: state
description: TanStack Query (React Query) server state management patterns
usage: Use when managing server state with automatic caching, refetching, and optimistic updates
input: API endpoints, query keys, mutation operations
output: Query hooks, mutation hooks, cache management
config_required:
  stale_time: "Time until data is considered stale"
  cache_time: "Time until inactive data is garbage collected"
  retry_config: "Retry strategy for failed requests"
  refetch_on_window_focus: "Whether to refetch on window focus"
  api_base_url: "Base URL for API requests"
---

# TanStack Query Patterns

## ⚙️ Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| `stale_time` | Time until data is stale | `5 * 60 * 1000` (5 minutes) |
| `cache_time` | Time until inactive data GC | `30 * 60 * 1000` (30 minutes) |
| `retry_config` | Failed request retry strategy | `3`, exponential backoff |
| `refetch_on_window_focus` | Refetch when window regains focus | `true`, `false` |
| `api_base_url` | API base URL | `/api`, `https://api.example.com` |

## Purpose

Manage server state with:
- Automatic caching and background refetching
- Stale-while-revalidate pattern
- Optimistic updates
- Infinite queries and pagination
- Minimal boilerplate

## Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Query Patterns

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId,
  });
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error, refetch } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <div>{user?.name}</div>;
}
```

### Infinite Query

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
}

function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// Usage
function PostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePosts();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.posts.map((post) => <PostCard key={post.id} post={post} />)}
        </Fragment>
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

## Mutation Patterns

### Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      // Or update cache directly
      queryClient.setQueryData(['post', newPost.id], newPost);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Usage
function CreatePostForm() {
  const createPost = useCreatePost();

  const handleSubmit = async (data: CreatePostInput) => {
    try {
      await createPost.mutateAsync(data);
      toast.success('Post created!');
    } catch (error) {
      // Error handled in mutation
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={createPost.isPending}>
        {createPost.isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

### Optimistic Updates

```typescript
function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Post> }) =>
      updatePost(id, data),

    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['post', id] });

      // Snapshot previous value
      const previousPost = queryClient.getQueryData<Post>(['post', id]);

      // Optimistically update
      if (previousPost) {
        queryClient.setQueryData<Post>(['post', id], {
          ...previousPost,
          ...data,
        });
      }

      return { previousPost };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.id], context.previousPost);
      }
    },

    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
    },
  });
}
```

## Query Key Patterns

```typescript
export const queryKeys = {
  all: ['posts'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: PostFilters) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
};

// Usage
useQuery({
  queryKey: queryKeys.detail(postId),
  queryFn: () => fetchPost(postId),
});

// Invalidate all posts
queryClient.invalidateQueries({ queryKey: queryKeys.all });
```

## Prefetching

```typescript
// Prefetch on hover
function PostLink({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['post', postId],
      queryFn: () => fetchPost(postId),
      staleTime: 1000 * 60,
    });
  };

  return (
    <Link to={`/posts/${postId}`} onMouseEnter={prefetch}>
      View Post
    </Link>
  );
}
```

## Best Practices

| Practice | Description |
|----------|-------------|
| **Structured Query Keys** | Use consistent, hierarchical query keys |
| **Appropriate Stale Times** | Set stale times per query type based on data volatility |
| **Enabled Option** | Control query execution with `enabled` |
| **Error Handling** | Handle errors at both query and component level |
| **Optimistic Updates** | Improve UX with optimistic updates on mutations |
| **Prefetching** | Prefetch data on hover or route transitions |
| **DevTools** | Use React Query DevTools for debugging |

## When to Use

- Any application with server data
- REST or GraphQL APIs
- Real-time data with polling
- Complex caching requirements
- Background data synchronization

## Related Skills

- `redux-toolkit-patterns` - For client state
- `zustand-patterns` - For client state
- `api-app-testing` - Test queries and mutations
