# Redux Toolkit Patterns

Expert patterns for **Redux Toolkit (RTK)** state management in React applications.

## Core Concepts

- Official Redux tooling
- Simplified Redux setup
- Built-in Immer for immutable updates
- RTK Query for data fetching
- DevTools integration

## Store Setup

### Configure Store

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { authReducer } from './features/auth/authSlice';
import { userReducer } from './features/user/userSlice';
import { api } from './services/api';

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

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    reset: () => initialState,
  },
});

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions;
export const counterReducer = counterSlice.reducer;

// Selectors
export const selectCount = (state: RootState) => state.counter.value;
export const selectCountStatus = (state: RootState) => state.counter.status;
```

### Async Thunks

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  currentUser: User | null;
  users: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  users: [],
  status: 'idle',
  error: null,
};

// Async thunks
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

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('User not found');
      return (await response.json()) as User;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async ({ id, data }: { id: string; data: Partial<User> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Update failed');
      return (await response.json()) as User;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // fetchUserById
      .addCase(fetchUserById.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // updateUser
      .addCase(updateUser.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });
  },
});

export const { clearCurrentUser, setUser } = userSlice.actions;
export const userReducer = userSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.user.currentUser;
export const selectAllUsers = (state: RootState) => state.user.users;
export const selectUserStatus = (state: RootState) => state.user.status;
export const selectUserError = (state: RootState) => state.user.error;
```

## RTK Query

### API Definition

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
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
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    getPostsByUser: builder.query<Post[], string>({
      query: (userId) => `/users/${userId}/posts`,
      providesTags: (result, error, userId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Post' as const, id })),
              { type: 'Post', id: `USER-${userId}` },
            ]
          : [{ type: 'Post', id: `USER-${userId}` }],
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
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetPostsByUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = api;
```

### Using RTK Query Hooks

```typescript
import {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
} from './services/api';

function UserList() {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();

  if (isLoading) return <Spinner />;
  if (error) return <Error message="Failed to load users" />;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      {users?.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useGetUserByIdQuery(userId);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const handleUpdate = async (data: Partial<User>) => {
    try {
      await updateUser({ id: userId, data }).unwrap();
      toast.success('User updated');
    } catch (error) {
      toast.error('Update failed');
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => handleUpdate({ name: 'New Name' })} disabled={isUpdating}>
        Update Name
      </button>
    </div>
  );
}
```

## Usage in Components

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { increment, selectCount } from '../store/features/counter/counterSlice';
import { fetchUsers, selectAllUsers, selectUserStatus } from '../store/features/user/userSlice';

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

function UserList() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectAllUsers);
  const status = useAppSelector(selectUserStatus);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchUsers());
    }
  }, [status, dispatch]);

  if (status === 'loading') return <Spinner />;

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Best Practices

1. **Typed Hooks**: Always use typed `useAppDispatch` and `useAppSelector`
2. **Selectors**: Create memoized selectors with `createSelector`
3. **RTK Query**: Use RTK Query for server state, slices for client state
4. **Tags**: Use proper tag invalidation for cache management
5. **Normalization**: Consider `createEntityAdapter` for collections
6. **DevTools**: Use Redux DevTools for debugging

## When to Use

- Large-scale React applications
- Complex state with many interactions
- Team needs predictable state management
- Server state + client state together
- When you need time-travel debugging
