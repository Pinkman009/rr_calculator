# rr_calculator
R:R Calculator

# Trading App Backend

Backend API for the Trading Calculator application.

## Features
- User management via Telegram
- Trade data storage and synchronization
- MongoDB database integration

## Environment Variables
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (production/development)
- `PORT` - Server port (default: 3000)

## API Endpoints
- `GET /` - Health check
- `GET /api/trades/:telegramId` - Get user trades
- `POST /api/users` - Save/update user
- `POST /api/trades` - Save trades
- `DELETE /api/trades/:telegramId/:tradeId` - Delete trade

## Deployment
This app is deployed on Render.com and connects to MongoDB Atlas.
