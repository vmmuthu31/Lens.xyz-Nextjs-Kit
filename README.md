# Lens Protocol NextJS Demo

This project demonstrates how to integrate the Lens Protocol into a NextJS application, allowing users to connect their wallets, authenticate with Lens Protocol, and create Lens profiles.

## Features

- Wallet connection using wagmi and web3modal
- Authentication with Lens Protocol
- Handle availability checking
- Lens profile creation
- Profile viewing page
- Apollo client setup for Lens GraphQL API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/bun
- MetaMask or another Web3 wallet browser extension

### Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```
NEXT_PUBLIC_LENS_API_KEY=your_lens_api_key_here
```

You can obtain a Lens API key from the [Lens Developer Portal](https://www.lens.xyz/dev).

### Installation

1. Clone the repository
2. Install dependencies

```bash
bun install
# or
npm install
```

3. Start the development server

```bash
bun run dev
# or
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Lens Protocol Integration

This demo integrates with Lens Protocol using both the Lens Client SDK and the GraphQL API:

- **Authentication**: The application uses the Lens Client SDK to handle authentication.
- **Profile Creation**: Users can create new Lens profiles with custom handles.
- **GraphQL Queries**: The Apollo client is configured to interact with the Lens GraphQL API.

## Wallet Connection

The application uses wagmi and web3modal for wallet connection. Users can connect their MetaMask or other Web3 wallets to authenticate with Lens Protocol.

## Pages

- `/`: Home page with an introduction and links to create an account
- `/create-account`: Page for creating a new Lens account
- `/profile`: Page for viewing profile information

## Documentation

For more information about Lens Protocol, refer to the official documentation:

- [Lens Protocol Authentication](https://lens.xyz/docs/protocol/authentication)
- [Lens Protocol GraphQL API](https://lens.xyz/docs/protocol/getting-started/graphql)
- [Creating Lens Apps](https://lens.xyz/docs/protocol/apps/create)
- [Creating Lens Accounts](https://lens.xyz/docs/protocol/accounts/create)

## Learn More

To learn more about Next.js and Lens Protocol:

- [Next.js Documentation](https://nextjs.org/docs)
- [Lens Protocol Documentation](https://lens.xyz/docs)
- [Lens Protocol GitHub](https://github.com/lens-protocol)
