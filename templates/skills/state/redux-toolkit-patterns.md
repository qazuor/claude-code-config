---
name: redux-toolkit-patterns
category: state
description: Redux Toolkit state management patterns for React applications
usage: Use when implementing global state with Redux Toolkit and RTK Query
input: State structure, async operations, API endpoints
output: Store configuration, slices, async thunks, RTK Query APIs
config_required:
  state_structure: "Organization of state slices"
  middleware: "Additional middleware beyond RTK defaults"
  dev_tools: "Redux DevTools configuration"
  api_base_url: "Base URL for RTK Query"
  cache_tags: "Tag types for cache invalidation"
---

# Redux Toolkit Patterns

## ⚙️ Configuration

| Setting | Description | Example |
|---------|-------------|---------|
| `state_structure` | How state is organized into slices | `auth`, `user`, `cart`, `settings` |
| `middleware` | Additional middleware | `logger`, custom middleware |
| `dev_tools` | DevTools settings | `enabled: true`, trace limit |
| `api_base_url` | RTK Query base URL | `/api`, `https://api.example.com` |
| `cache_tags` | Cache invalidation tags | `['User', 'Post', 'Comment']` |

## Purpose

Implement Redux state management with:
- Simplified Redux setup with RTK
- Type-safe state and actions
- Built-in Immer for immutable updates
- RTK Query for server state
- Async thunk patterns

## Store Setup

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Typed Hooks

```typescript
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

## Slice Patterns

### Basic Slice

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = { value: 0, status: 'idle' };

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    reset: () => initialState,
  },
});

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions;
export const counterReducer = counterSlice.reducer;
export const selectCount = (state: RootState) => state.counter.value;
```

### Async Thunks

```typescript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

interface UserState {
  users: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Async thunk
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch');
      return (await response.json()) as User[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});
```

## RTK Query

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Post'],
  endpoints: (builder) => ({
    // Queries
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'User' as const, id })), { type: 'User', id: 'LIST' }]
          : [{ type: 'User', id: 'LIST' }],
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Mutations
    createUser: builder.mutation<User, Omit<User, 'id'>>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'User', id }, { type: 'User', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = api;
```

## Component Usage

```typescript
import { useAppDispatch, useAppSelector } from './store/hooks';
import { increment, selectCount } from './store/counterSlice';

function Counter() {
  const dispatch = useAppDispatch();
  const count = useAppSelector(selectCount);

  return (
    <div>
      <span>{count}</span>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}

// RTK Query usage
function UserList() {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  if (isLoading) return <Spinner />;
  if (error) return <Error />;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {users?.map((user) => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

## Best Practices

| Practice | Description |
|----------|-------------|
| **Typed Hooks** | Always use typed `useAppDispatch` and `useAppSelector` |
| **Selectors** | Create memoized selectors with `createSelector` |
| **RTK Query for Server State** | Use RTK Query for server data, slices for client state |
| **Tag Invalidation** | Use proper tag invalidation for cache management |
| **Entity Adapter** | Use `createEntityAdapter` for normalized collections |
| **DevTools** | Enable Redux DevTools for debugging |

## When to Use

- Large-scale applications with complex state
- Teams needing predictable state management
- When you need time-travel debugging
- Applications combining server and client state

## Related Skills

- `tanstack-query-patterns` - Alternative for server state
- `zustand-patterns` - Simpler alternative for client state
