# React Native Project Instructions

This document defines the development standards and best practices for this React Native project. All generated code must follow these rules.

---

# 1. General Principles

* Follow **Clean Code principles**
* Prefer **composition over inheritance**
* Keep components **small and focused**
* Use **TypeScript for all files**
* Avoid unnecessary dependencies
* Prefer **functional components and hooks**
* Use **absolute imports** instead of long relative paths

Example:

```ts
import Button from "@/components/Button"
```

---

# 2. Folder Structure

The project must follow a modular structure.

```
src
 ├── components
 ├── screens
 ├── navigation
 ├── services
 ├── hooks
 ├── store
 ├── utils
 ├── types
 ├── theme
 └── assets
```

### Description

components
Reusable UI components.

screens
Application pages.

navigation
React Navigation configuration.

services
API requests and external integrations.

hooks
Custom React hooks.

store
Global state (Zustand / Redux / Context).

utils
Utility functions.

types
TypeScript types and interfaces.

theme
Colors, spacing and design tokens.

assets
Images, fonts and static resources.

---

# 3. Component Guidelines

Components must be **stateless whenever possible**.

Example structure:

```
components
 └── Button
      ├── Button.tsx
      ├── styles.ts
      └── types.ts
```

Example:

```tsx
type Props = {
  title: string
  onPress: () => void
}

export function Button({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  )
}
```

Rules:

* Avoid components larger than **150 lines**
* Extract logic to **custom hooks**
* Avoid inline styles
* Avoid anonymous functions inside JSX when possible

---

# 4. Styling

Use **StyleSheet or Tailwind (NativeWind)**.

Preferred structure:

```
styles.ts
```

Example:

```ts
import { StyleSheet } from "react-native"

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  }
})
```

Rules:

* Do not hardcode colors
* Always use theme tokens

Example:

```
theme/colors.ts
```

---

# 5. State Management

Preferred options:

* Zustand (recommended)
* Redux Toolkit
* React Context (small cases)

Rules:

* Avoid global state unless necessary
* Business logic must not live inside components

---

# 6. API Layer

All API communication must be inside **services**.

Example:

```
services
 └── api
      ├── client.ts
      └── userService.ts
```

Example:

```ts
export async function getUsers() {
  const response = await api.get("/users")
  return response.data
}
```

Rules:

* Never call APIs directly inside components
* Always use service layer

---

# 7. Custom Hooks

Extract reusable logic to hooks.

Example:

```
hooks
 └── usePlayers.ts
```

Example:

```ts
export function usePlayers() {
  const [players, setPlayers] = useState([])

  useEffect(() => {
    loadPlayers()
  }, [])

  return { players }
}
```

---

# 8. Performance Best Practices

* Use `React.memo` for expensive components
* Use `useCallback` and `useMemo` when necessary
* Avoid unnecessary re-renders
* Use FlatList for lists

Example:

```tsx
<FlatList
  data={players}
  renderItem={renderPlayer}
  keyExtractor={(item) => item.id}
/>
```

---

# 9. Error Handling

Always handle API errors.

Example:

```ts
try {
  const data = await getPlayers()
} catch (error) {
  console.error(error)
}
```

Use centralized error handling if possible.

---

# 10. Naming Conventions

Components
PascalCase

```
PlayerCard.tsx
MatchList.tsx
```

Hooks
camelCase starting with use

```
usePlayers.ts
useMatches.ts
```

Services

```
playerService.ts
matchService.ts
```

Variables

```
camelCase
```

Constants

```
UPPER_CASE
```

---

# 11. Navigation

Use **React Navigation**.

Structure:

```
navigation
 ├── AppNavigator.tsx
 └── types.ts
```

Rules:

* Navigation types must be strongly typed
* Avoid navigation logic inside UI components

---

# 12. Testing

Prefer:

* Jest
* React Native Testing Library

Rules:

* Test business logic
* Test hooks
* Test critical components

---

# 13. Code Quality

Always follow:

* ESLint
* Prettier
* TypeScript strict mode

Recommended settings:

```
"strict": true
```

---

# 14. Accessibility

* Use accessible labels
* Ensure good contrast
* Support screen readers when possible

Example:

```tsx
accessibilityLabel="Submit button"
```

---

# 15. Git Best Practices

Commit format:

```
feat: add player list screen
fix: resolve login crash
refactor: improve api structure
```

---

# 16. Security

* Never store secrets in the app
* Use environment variables
* Validate external data

---

# 17. Performance for Mobile

Avoid:

* Large images
* Deep component trees
* Unnecessary renders 

Prefer:

* Lazy loading
* Pagination
* Memoized components

---

# 18. Code Generation Rules (Important)

When generating code for this project:

* Always use **TypeScript**
* Follow the folder structure defined above
* Prefer **functional components**
* Use **React Hooks**
* Respect separation of concerns
* Do not place business logic inside UI components

---

# End of Instructions
