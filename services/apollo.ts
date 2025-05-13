import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const ENDPOINT = "https://api.lens.xyz/graphql";

const client = new ApolloClient({
  uri: ENDPOINT,
  cache: new InMemoryCache(),
});

const { data } = await client.query({
  query: gql`
    query {
      posts(request: { pageSize: TEN }) {
        items {
          id
          author {
            username {
              value
            }
          }
          metadata {
            ... on TextOnlyMetadata {
              content
            }
          }
        }
        pageInfo {
          prev
          next
        }
      }
    }
  `,
});

console.log(data);
