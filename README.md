# Task Management Application

This is a simple task management application built with Node.js, Express, and MongoDB. It allows users to register, log in, and manage their tasks with CRUD operations.

## Features

- User registration and authentication with JWT
- Create, read, update, and delete tasks
- Task status filtering (pending and completed)
- Frontend interface for managing tasks
- Input validation and error handling

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory and add the following:
   ```
   PORT=3000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   ```
4. Start the server:
   ```
   npm start
   ```

## Usage

- Access the application at `http://localhost:3000`
- Register a new user or log in with existing credentials
- Manage your tasks through the web interface

## Testing

Run tests with:
```
npm test
```

## License

This project is licensed under the MIT License.
