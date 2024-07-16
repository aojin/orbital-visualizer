import { makeExecutableSchema } from "@graphql-tools/schema";
import { gql } from "apollo-server-express";

// Define your type definitions
const typeDefs = gql`
  type Query {
    hello: String
  }
`;

// Define your resolvers
const resolvers = {
  Query: {
    hello: () => "Hello world!",
  },
};

// Create the executable schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;
