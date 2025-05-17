// 사용자 데이터
export const users = [
  {
    _id: "user1",
    username: "admin",
    email: "admin@example.com",
    password: "$2a$10$cXGMFf1mXaXKnQckSZPq8.1KJt0tYAYVOuDn3JpNKjfgqh9zOC2/2", // "admin123"
    fullName: "관리자",
    role: "admin",
    walletAddress: "0xabc123...",
    profileImage: "https://example.com/profiles/admin.jpg",
    tokenBalance: [
      {
        token: "token1",
        balance: 2000
      },
      {
        token: "token2",
        balance: 1500
      }
    ],
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-09-01T12:30:00.000Z"
  },
  {
    _id: "user2",
    username: "investor1",
    email: "investor1@example.com",
    password: "$2a$10$HPDvqUhZ.kp/qAeNsZ6JTOEmzRKsNTYUK/1JE4OuY9JcJQwW8kYki", // "investor123"
    fullName: "투자자1",
    role: "investor",
    walletAddress: "0xdef456...",
    profileImage: "https://example.com/profiles/investor1.jpg",
    tokenBalance: [
      {
        token: "token1",
        balance: 1500
      }
    ],
    createdAt: "2023-01-05T00:00:00.000Z",
    updatedAt: "2023-09-02T15:45:00.000Z"
  },
  {
    _id: "user3",
    username: "investor2",
    email: "investor2@example.com",
    password: "$2a$10$TS9Nw2PHpYYaNLjfF/RjbezzGYf8G8FVwBwCZxfDk9k7PH.u2qp52", // "investor456"
    fullName: "투자자2",
    role: "investor",
    walletAddress: "0xghi789...",
    profileImage: "https://example.com/profiles/investor2.jpg",
    tokenBalance: [
      {
        token: "token1",
        balance: 1000
      },
      {
        token: "token2",
        balance: 3000
      }
    ],
    createdAt: "2023-01-10T00:00:00.000Z",
    updatedAt: "2023-08-20T09:15:00.000Z"
  },
  {
    _id: "user4",
    username: "property_manager",
    email: "pm@example.com",
    password: "$2a$10$DyyCXf5X8a3uF5MUEuJlquGxvnBBB1yK7K6b0nPZRRnRQM9uvTJKa", // "manager789"
    fullName: "부동산 관리자",
    role: "property_manager",
    walletAddress: "0xjkl012...",
    profileImage: "https://example.com/profiles/manager.jpg",
    tokenBalance: [],
    createdAt: "2023-02-01T00:00:00.000Z",
    updatedAt: "2023-07-15T16:20:00.000Z"
  }
];

// 사용자 권한 데이터
export const roles = [
  {
    _id: "role1",
    name: "admin",
    permissions: ["manage_users", "manage_properties", "manage_tokens", "manage_transactions", "manage_valuations", "manage_distributions"]
  },
  {
    _id: "role2",
    name: "investor",
    permissions: ["view_properties", "view_tokens", "view_valuations", "view_distributions", "trade_tokens"]
  },
  {
    _id: "role3",
    name: "property_manager",
    permissions: ["view_properties", "view_tokens", "manage_properties", "manage_valuations", "manage_distributions"]
  }
];

// 토큰
export const tokens = [
  {
    _id: "token1",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYxODc2ODAwfQ.NSfFzGfKONLFwCnmLw_Aw9e-p9SnefS0qQHBTwpQ1Ps",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMSIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYyMzk1MjAwfQ.5dz1h1Ua8bQR1WXzCO8DzDGDUViLlsdJg0ql2VTwqDM",
    userId: "user1",
    expiresAt: "2023-09-20T12:30:00.000Z"
  },
  {
    _id: "token2",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMiIsInJvbGUiOiJpbnZlc3RvciIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYxODc2ODAwfQ.8C-wLmC3z1V0jSM9S2qFwdQxhv-AJ6Lvbiv0Ktp6S14",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMiIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYyMzk1MjAwfQ.i7_2lP1SXl9SWRs_f5Ea4jyZQnVBxK0v3NiJQBqkwUk",
    userId: "user2",
    expiresAt: "2023-09-21T15:45:00.000Z"
  },
  {
    _id: "token3",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMyIsInJvbGUiOiJpbnZlc3RvciIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYxODc2ODAwfQ.BX6vkx5QAHRpiOYYNT5y8_mYDtWIeZpJcE-9u7kHj5c",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMyIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYyMzk1MjAwfQ.6w2tJYtxMcQrZlCxGk6Q48n6xLy_piHcIVsLTsK-RYU",
    userId: "user3",
    expiresAt: "2023-09-15T09:15:00.000Z"
  },
  {
    _id: "token4",
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyNCIsInJvbGUiOiJwcm9wZXJ0eV9tYW5hZ2VyIiwiaWF0IjoxNjYxNzkwNDAwLCJleHAiOjE2NjE4NzY4MDB9.WPEqGfbO6NpZtYzAFdoJ7pz7o9HYbfAGJYlUwY3Znfk",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyNCIsImlhdCI6MTY2MTc5MDQwMCwiZXhwIjoxNjYyMzk1MjAwfQ.9iwOFttihPuGlG8HKHC2i-V0g9pHcKFTf0eEHTGHLIo",
    userId: "user4",
    expiresAt: "2023-09-10T16:20:00.000Z"
  }
]; 