require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://Pinkman009.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    'http://localhost:8080'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log('🔗 Attempting to connect to MongoDB...');
console.log('📝 Connection string:', MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://username:****@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true,
  w: 'majority'
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas');
  console.log('📊 Database:', mongoose.connection.name);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('💡 Tips for fixing:');
  console.log('1. Check if your MongoDB Atlas cluster is running');
  console.log('2. Verify your connection string starts with mongodb+srv://');
  console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
  console.log('4. Verify your username and password are correct');
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Остальная часть кода (схемы и API routes) остается без изменений
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: String,
  username: String,
  photoUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const tradeSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  tradeId: { type: String, required: true },
  date: String,
  timestamp: Date,
  ticker: String,
  entry: Number,
  sl: Number,
  tp1: Number,
  tp2: Number,
  tp3: Number,
  tp1_size: Number,
  tp2_size: Number,
  tp3_size: Number,
  leverage: Number,
  rr: String,
  profitMoney: String,
  profitUsd: String,
  moneyRiskRub: Number,
  potentialProfitRub: Number,
  closedBy: String
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const Trade = mongoose.model('Trade', tradeSchema);

// API Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Trading App API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Остальные endpoints остаются без изменений...
app.get('/api/trades/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telegram ID is required' 
      });
    }

    const trades = await Trade.find({ telegramId }).sort({ timestamp: -1 });
    
    res.json({ 
      success: true, 
      trades,
      count: trades.length 
    });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ... остальные endpoints

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 MongoDB status: ${mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'}`);
});
