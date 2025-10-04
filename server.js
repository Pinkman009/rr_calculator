require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://yourusername.github.io',
    'http://localhost:3000',
    'http://127.0.0.1:5500' // для локального тестирования
  ],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trading_app';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
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

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Trading App API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get user trades
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

// Save/update user
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
      // Update existing user
      user.firstName = firstName || user.firstName;
      user.username = username || user.username;
      user.photoUrl = photoUrl || user.photoUrl;
      await user.save();
    } else {
      // Create new user
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

// Save trades
app.post('/api/trades', async (req, res) => {
  try {
    const { telegramId, trades } = req.body;
    
    if (!telegramId || !trades) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telegram ID and trades are required' 
      });
    }

    // Delete existing trades for this user
    await Trade.deleteMany({ telegramId });
    
    // Save new trades
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

// Delete specific trade
app.delete('/api/trades/:telegramId/:tradeId', async (req, res) => {
  try {
    const { telegramId, tradeId } = req.params;
    
    const result = await Trade.findOneAndDelete({ 
      telegramId, 
      tradeId 
    });
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Trade not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Trade deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting trade:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
