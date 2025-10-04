require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://pinkman009.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

console.log('🔗 Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// MongoDB Schemas
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
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

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

app.post('/api/users', async (req, res) => {
  try {
    const { telegramId, firstName, username, photoUrl } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telegram ID is required' 
      });
    }

    let user = await User.findOne({ telegramId });
    
    if (user) {
      user.firstName = firstName || user.firstName;
      user.username = username || user.username;
      user.photoUrl = photoUrl || user.photoUrl;
      await user.save();
    } else {
      user = new User({ 
        telegramId, 
        firstName, 
        username, 
        photoUrl 
      });
      await user.save();
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.post('/api/trades', async (req, res) => {
  try {
    const { telegramId, trades } = req.body;
    
    if (!telegramId || !trades) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telegram ID and trades are required' 
      });
    }

    await Trade.deleteMany({ telegramId });
    
    const tradePromises = trades.map(tradeData => {
      const trade = new Trade({
        ...tradeData,
        telegramId
      });
      return trade.save();
    });
    
    await Promise.all(tradePromises);
    
    res.json({ 
      success: true, 
      message: `Saved ${trades.length} trades`,
      count: trades.length
    });
  } catch (error) {
    console.error('Error saving trades:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
