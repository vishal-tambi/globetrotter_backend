# Globetrotter Backend

This is the backend API for the Globetrotter application. It is built with Node.js, Express, and MongoDB.

## Features
- User registration and authentication (JWT)
- Challenge creation and participation
- Score tracking
- RESTful API endpoints

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm
- MongoDB (local or Atlas)

### Installation
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Environment Variables
Create a `.env` file in the `backend` directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
```

### Running the Server
```sh
npm start
```

The backend will run on `http://localhost:5000` by default.

### API Endpoints
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login
- `GET /api/user/profile` — Get user profile
- `POST /api/game/challenge` — Create a new challenge
- ...and more

## Deployment
You can deploy the backend to platforms like Render, Heroku, or any Node.js hosting provider. Update environment variables accordingly.

## License
MIT
