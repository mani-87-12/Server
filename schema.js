const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    password: String!
    imageUrl: String  # Add imageUrl field here
  }

  type Query {
    getUsers: [User]
    getUser(username: String!, password: String!): User
  }

  type Mutation {
    createUser(username: String!, email: String!, password: String!): User
    changePass(username: String!, password: String!): User
    updateUserImage(username: String!, imageUrl: String!): User
  }
`;

module.exports = typeDefs;
