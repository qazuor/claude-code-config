# TanStack Query Patterns

Expert patterns for **TanStack Query (React Query)** server state management.

## Core Concepts

- Server state management (not client state)
- Automatic caching and refetching
- Background updates and stale-while-revalidate
- Optimistic updates
- Infinite queries and pagination

## Setup

### Query Client

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
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

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: !!userId, // Only run if userId exists
  });
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error, refetch } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
      <button onClick={() => refetch()}>Refresh</button>
    </div>
  );
}
```

### Query with Dependencies

```typescript
function useUserPosts(userId: string) {
  const userQuery = useUser(userId);

  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () => fetchUserPosts(userId),
    // Only fetch posts after user is loaded
    enabled: !!userQuery.data,
  });
}
```

### Parallel Queries

```typescript
import { useQueries } from '@tanstack/react-query';

function useMultipleUsers(userIds: string[]) {
  return useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id),
    })),
  });
}
```

### Infinite Query (Pagination)

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
}

async function fetchPosts(cursor?: string): Promise<PostsPage> {
  const url = cursor ? `/api/posts?cursor=${cursor}` : '/api/posts';
  const response = await fetch(url);
  return response.json();
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
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts();

  return (
    <div>
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </Fragment>
      ))}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
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

async function createPost(data: CreatePostInput): Promise<Post> {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create post');
  return response.json();
}

function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: (newPost) => {
      // Invalidate and refetch posts list
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
      {/* form fields */}
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

      // Return context with snapshot
      return { previousPost };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(['post', variables.id], context.previousPost);
      }
      toast.error('Update failed');
    },

    onSettled: (data, error, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['post', variables.id] });
    },
  });
}
```

### Delete with Optimistic Update

```typescript
function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,

    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      const previousPosts = queryClient.getQueryData<Post[]>(['posts']);

      queryClient.setQueryData<Post[]>(['posts'], (old) =>
        old?.filter((post) => post.id !== postId)
      );

      return { previousPosts };
    },

    onError: (err, postId, context) => {
      queryClient.setQueryData(['posts'], context?.previousPosts);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

## Query Key Patterns

### Query Key Factory

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

// Invalidate just lists
queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
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
      staleTime: 1000 * 60, // Only prefetch if data older than 1 min
    });
  };

  return (
    <Link to={`/posts/${postId}`} onMouseEnter={prefetch}>
      View Post
    </Link>
  );
}

// Prefetch in route loader
export const loader = async ({ params }: LoaderFunctionArgs) => {
  await queryClient.ensureQueryData({
    queryKey: ['post', params.id],
    queryFn: () => fetchPost(params.id!),
  });
  return null;
};
```

## Best Practices

1. **Query Keys**: Use consistent, structured query keys
2. **Stale Time**: Set appropriate stale times per query type
3. **Enabled**: Use `enabled` to control query execution
4. **Error Handling**: Handle errors at query and component level
5. **Optimistic Updates**: Use for better UX on mutations
6. **Prefetching**: Prefetch data on hover or route transitions
7. **DevTools**: Use React Query DevTools for debugging

## When to Use

- Any application with server data
- REST or GraphQL APIs
- Real-time data with polling/refetching
- Complex caching requirements
- When you need automatic background updates
