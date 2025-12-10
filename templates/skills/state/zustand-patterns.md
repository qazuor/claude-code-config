# Zustand State Management Patterns

Expert patterns for **Zustand** state management in React applications.

## Core Concepts

- Lightweight state management
- No boilerplate, minimal setup
- TypeScript-first design
- Works outside React components
- Middleware support

## Store Patterns

### Basic Store

```typescript
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

### Store with Async Actions

```typescript
import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: (id: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  fetchUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/users/${id}`);
      if (!response.ok) throw new Error('Failed to fetch user');
      const user = await response.json();
      set({ user, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateUser: async (data: Partial<User>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update user');
      const updatedUser = await response.json();
      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearUser: () => set({ user: null, error: null }),
}));
```

### Slices Pattern (Modular Stores)

```typescript
import { create, StateCreator } from 'zustand';

// Auth slice
interface AuthSlice {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const createAuthSlice: StateCreator<AuthSlice & UserSlice, [], [], AuthSlice> = (set) => ({
  token: null,
  isAuthenticated: false,
  login: (token) => set({ token, isAuthenticated: true }),
  logout: () => set({ token: null, isAuthenticated: false }),
});

// User slice
interface UserSlice {
  user: User | null;
  setUser: (user: User | null) => void;
}

const createUserSlice: StateCreator<AuthSlice & UserSlice, [], [], UserSlice> = (set) => ({
  user: null,
  setUser: (user) => set({ user }),
});

// Combined store
type AppStore = AuthSlice & UserSlice;

export const useAppStore = create<AppStore>()((...args) => ({
  ...createAuthSlice(...args),
  ...createUserSlice(...args),
}));
```

### Persist Middleware

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
  toggleNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      notifications: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notifications: state.notifications,
      }),
    }
  )
);
```

### Immer Middleware

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  updateTodo: (id: string, text: string) => void;
}

export const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: [],
    addTodo: (text) =>
      set((state) => {
        state.todos.push({
          id: crypto.randomUUID(),
          text,
          completed: false,
        });
      }),
    toggleTodo: (id) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.completed = !todo.completed;
      }),
    removeTodo: (id) =>
      set((state) => {
        state.todos = state.todos.filter((t) => t.id !== id);
      }),
    updateTodo: (id, text) =>
      set((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.text = text;
      }),
  }))
);
```

## Usage Patterns

### Selecting State

```typescript
// Select single value (re-renders only when count changes)
const count = useCounterStore((state) => state.count);

// Select action (stable reference)
const increment = useCounterStore((state) => state.increment);

// Select multiple values with shallow comparison
import { shallow } from 'zustand/shallow';

const { user, isLoading } = useUserStore(
  (state) => ({ user: state.user, isLoading: state.isLoading }),
  shallow
);

// Or use useShallow hook
import { useShallow } from 'zustand/react/shallow';

const { user, isLoading } = useUserStore(
  useShallow((state) => ({ user: state.user, isLoading: state.isLoading }))
);
```

### Using Outside React

```typescript
// Get current state
const currentCount = useCounterStore.getState().count;

// Call actions
useCounterStore.getState().increment();

// Subscribe to changes
const unsubscribe = useCounterStore.subscribe((state) => {
  console.log('Count changed:', state.count);
});
```

### Computed Values

```typescript
interface CartState {
  items: CartItem[];
  // Computed via selector, not stored
}

export const useCartStore = create<CartState>(() => ({
  items: [],
}));

// Use selectors for computed values
export const useCartTotal = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

export const useCartItemCount = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  );
```

## Best Practices

1. **Selectors**: Always use selectors to minimize re-renders
2. **Actions**: Keep actions in the store, not in components
3. **Typing**: Use TypeScript interfaces for full type safety
4. **Slices**: Split large stores into slices for maintainability
5. **Persist**: Use persist middleware for user preferences
6. **Immer**: Use immer for complex nested state updates

## When to Use

- Small to medium React applications
- When Redux is overkill
- When you need state outside React
- For simple global state needs
- With or without React Query for server state
