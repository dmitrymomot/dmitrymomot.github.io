---
title: "GraphQL API Design: Best Practices and Common Pitfalls"
description: "Learn how to design efficient, scalable GraphQL APIs with real-world examples"
publishDate: 2025-08-12
tags: ["graphql", "api", "backend", "typescript", "performance"]
draft: false
---

GraphQL has transformed how we build APIs, but with great power comes great responsibility. Let's explore how to design GraphQL APIs that scale.

## Schema Design Principles

### Think in Graphs, Not Endpoints

```graphql
# Good: Graph-oriented design
type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
    followers: [User!]!
    following: [User!]!
}

type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
    comments: [Comment!]!
    likes: Int!
    createdAt: DateTime!
}

type Comment {
    id: ID!
    content: String!
    author: User!
    post: Post!
    replies: [Comment!]!
}

# Bad: REST-thinking in GraphQL
type GetUserResponse {
    user: User
    posts: [Post]
    followers: [User]
}
```

## Resolver Patterns

### DataLoader for N+1 Query Prevention

```typescript
import DataLoader from "dataloader";
import { User, Post } from "./models";

class UserAPI {
    private userLoader: DataLoader<string, User>;
    private postsByUserLoader: DataLoader<string, Post[]>;

    constructor() {
        this.userLoader = new DataLoader(this.batchLoadUsers);
        this.postsByUserLoader = new DataLoader(this.batchLoadPostsByUser);
    }

    private async batchLoadUsers(userIds: string[]): Promise<User[]> {
        const users = await User.findByIds(userIds);

        // Map results to maintain order
        const userMap = new Map(users.map((u) => [u.id, u]));
        return userIds.map((id) => userMap.get(id) || new Error(`User ${id} not found`));
    }

    private async batchLoadPostsByUser(userIds: string[]): Promise<Post[][]> {
        const posts = await Post.findByUserIds(userIds);

        // Group posts by user
        const postsByUser = new Map<string, Post[]>();
        posts.forEach((post) => {
            const userPosts = postsByUser.get(post.userId) || [];
            userPosts.push(post);
            postsByUser.set(post.userId, userPosts);
        });

        return userIds.map((id) => postsByUser.get(id) || []);
    }

    async getUser(id: string): Promise<User> {
        return this.userLoader.load(id);
    }

    async getUserPosts(userId: string): Promise<Post[]> {
        return this.postsByUserLoader.load(userId);
    }
}
```

## Pagination Strategies

### Cursor-Based Pagination (Relay Specification)

```graphql
type Query {
    posts(first: Int, after: String, last: Int, before: String, orderBy: PostOrderBy): PostConnection!
}

type PostConnection {
    edges: [PostEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
}

type PostEdge {
    cursor: String!
    node: Post!
}

type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
}
```

Implementation:

```typescript
interface PaginationArgs {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
}

class PostResolver {
    async posts(args: PaginationArgs): Promise<PostConnection> {
        const limit = args.first || args.last || 20;
        const cursor = args.after || args.before;

        // Decode cursor to get offset
        const offset = cursor ? this.decodeCursor(cursor) : 0;

        // Fetch one extra to determine hasNextPage
        const posts = await Post.find()
            .skip(offset)
            .limit(limit + 1)
            .sort({ createdAt: -1 });

        const hasNextPage = posts.length > limit;
        const edges = posts.slice(0, limit).map((post, index) => ({
            cursor: this.encodeCursor(offset + index),
            node: post,
        }));

        return {
            edges,
            pageInfo: {
                hasNextPage,
                hasPreviousPage: offset > 0,
                startCursor: edges[0]?.cursor,
                endCursor: edges[edges.length - 1]?.cursor,
            },
            totalCount: await Post.countDocuments(),
        };
    }

    private encodeCursor(offset: number): string {
        return Buffer.from(`offset:${offset}`).toString("base64");
    }

    private decodeCursor(cursor: string): number {
        const decoded = Buffer.from(cursor, "base64").toString();
        return parseInt(decoded.split(":")[1], 10);
    }
}
```

## Error Handling

### Structured Error Responses

```typescript
enum ErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

class GraphQLError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public field?: string
  ) {
    super(message);
  }
}

// Usage in resolver
async createPost(input: CreatePostInput): Promise<Post> {
  // Validation
  if (!input.title || input.title.length < 3) {
    throw new GraphQLError(
      'Title must be at least 3 characters',
      ErrorCode.VALIDATION_ERROR,
      400,
      'title'
    );
  }

  // Authorization
  if (!context.user) {
    throw new GraphQLError(
      'You must be logged in to create a post',
      ErrorCode.UNAUTHENTICATED,
      401
    );
  }

  try {
    return await Post.create(input);
  } catch (error) {
    throw new GraphQLError(
      'Failed to create post',
      ErrorCode.INTERNAL_ERROR,
      500
    );
  }
}
```

## Security Considerations

### Query Depth Limiting

```typescript
import depthLimit from "graphql-depth-limit";
import costAnalysis from "graphql-cost-analysis";

const server = new ApolloServer({
    typeDefs,
    resolvers,
    validationRules: [
        depthLimit(5), // Maximum query depth
        costAnalysis({
            maximumCost: 1000,
            defaultCost: 1,
            variables: {},
            createError: (max, actual) => {
                return new Error(`Query cost ${actual} exceeds maximum cost ${max}`);
            },
        }),
    ],
});
```

### Rate Limiting

```typescript
interface RateLimitConfig {
    window: number; // Time window in seconds
    max: number; // Maximum requests per window
}

class RateLimiter {
    private limits = new Map<string, number[]>();

    constructor(private config: RateLimitConfig) {}

    async checkLimit(userId: string): Promise<boolean> {
        const now = Date.now();
        const windowStart = now - this.config.window * 1000;

        // Get user's request timestamps
        let timestamps = this.limits.get(userId) || [];

        // Remove old timestamps outside the window
        timestamps = timestamps.filter((t) => t > windowStart);

        if (timestamps.length >= this.config.max) {
            throw new GraphQLError("Rate limit exceeded", ErrorCode.RATE_LIMITED, 429);
        }

        timestamps.push(now);
        this.limits.set(userId, timestamps);

        return true;
    }
}
```

## Performance Monitoring

### Query Complexity Analysis

```graphql
# Assign complexity scores to fields
type User @cost(complexity: 1) {
    id: ID!
    name: String!
    posts(limit: Int = 10): [Post!]! @cost(complexity: 10, multipliers: ["limit"])
}

type Post @cost(complexity: 1) {
    id: ID!
    title: String!
    comments(limit: Int = 10): [Comment!]! @cost(complexity: 5, multipliers: ["limit"])
}
```

## Subscription Best Practices

```typescript
import { PubSub } from "graphql-subscriptions";
import { withFilter } from "graphql-subscriptions";

const pubsub = new PubSub();

const POST_ADDED = "POST_ADDED";
const COMMENT_ADDED = "COMMENT_ADDED";

export const resolvers = {
    Subscription: {
        postAdded: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([POST_ADDED]),
                (payload, variables) => {
                    // Filter by category if specified
                    return !variables.category || payload.postAdded.category === variables.category;
                },
            ),
        },

        commentAdded: {
            subscribe: withFilter(
                () => pubsub.asyncIterator([COMMENT_ADDED]),
                (payload, variables) => {
                    // Only send comments for the specified post
                    return payload.commentAdded.postId === variables.postId;
                },
            ),
        },
    },

    Mutation: {
        createPost: async (_, { input }) => {
            const post = await Post.create(input);

            // Publish to subscribers
            pubsub.publish(POST_ADDED, { postAdded: post });

            return post;
        },
    },
};
```

## Testing Strategies

### Integration Testing

```typescript
import { createTestClient } from "apollo-server-testing";
import { gql } from "apollo-server";

describe("User Queries", () => {
    const GET_USER = gql`
        query GetUser($id: ID!) {
            user(id: $id) {
                id
                name
                email
                posts {
                    id
                    title
                }
            }
        }
    `;

    it("should fetch user with posts", async () => {
        const { query } = createTestClient(server);

        const res = await query({
            query: GET_USER,
            variables: { id: "123" },
        });

        expect(res.errors).toBeUndefined();
        expect(res.data.user).toMatchObject({
            id: "123",
            name: expect.any(String),
            posts: expect.arrayContaining([
                expect.objectContaining({
                    id: expect.any(String),
                    title: expect.any(String),
                }),
            ]),
        });
    });
});
```

## Performance Metrics

| Metric                 | Value | Target  | Status |
| ---------------------- | ----- | ------- | ------ |
| Average Query Time     | 45ms  | < 100ms | ✅     |
| P95 Query Time         | 120ms | < 200ms | ✅     |
| DataLoader Hit Rate    | 92%   | > 90%   | ✅     |
| Query Complexity (avg) | 150   | < 500   | ✅     |
| Subscription Memory    | 256MB | < 512MB | ✅     |

## Common Anti-Patterns to Avoid

❌ **Don't expose database schema directly**
❌ **Avoid nullable fields for required data**
❌ **Don't create "god" queries that return everything**
❌ **Avoid circular dependencies in schema**
❌ **Don't ignore query complexity**

## Tools and Libraries

- **Apollo Server**: Production-ready GraphQL server
- **DataLoader**: Batching and caching for resolvers
- **GraphQL Shield**: Permission layer for GraphQL
- **GraphQL Playground**: Interactive API explorer
- **Apollo Client DevTools**: Debugging and performance monitoring

Building great GraphQL APIs requires thoughtful design, proper tooling, and constant monitoring. Focus on the developer experience while maintaining performance and security.
