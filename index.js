const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { v4: uuidv4 } = require('uuid');

// In-memory todos
let todos = [];

// GraphQL schema
const typeDefs = gql`
  enum Priority {
    HIGH
    MEDIUM
    LOW
  }

  type Todo {
    id: ID!
    task: String!
    completed: Boolean!
    priority: Priority!
  }

  type Query {
    getTodos(completed: Boolean, priority: Priority): [Todo!]!
  }

  type Mutation {
    addTodo(task: String!, priority: Priority!): Todo!
    deleteTodo(id: ID!): Boolean!
    toggleTodo(id: ID!): Todo!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    getTodos: (_, { completed, priority }) => {
      let result = todos;
      if (completed !== undefined) result = result.filter(todo => todo.completed === completed);
      if (priority) result = result.filter(todo => todo.priority === priority);
      return result;
    },
  },
  Mutation: {
    addTodo: (_, { task, priority }) => {
      const newTodo = { id: uuidv4(), task, completed: false, priority };
      todos.push(newTodo);
      return newTodo;
    },
    deleteTodo: (_, { id }) => {
      const index = todos.findIndex(todo => todo.id === id);
      if (index === -1) return false;
      todos.splice(index, 1);
      return true;
    },
    toggleTodo: (_, { id }) => {
      const todo = todos.find(todo => todo.id === id);
      if (!todo) throw new Error("Todo not found");
      todo.completed = !todo.completed;
      return todo;
    },
  },
};

// Setup server
async function startServer() {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: process.env.PORT || 4000 }, () => {
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 4000}${server.graphqlPath}`);
});
}

startServer();
