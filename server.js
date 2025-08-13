// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Connection
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://cluster0.0rm0fxx.mongodb.net/', {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log('MongoDB connected successfully');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// };






const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Improved CORS setup
app.use(cors({
  origin: [
    'http://localhost:19006',
    'exp://your-expo-url',
    /\.yourapp\.com$/ // Your production domain
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI , {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    return true
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Job Application Schema
const applicationSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyEmail: { type: String, required: true },
  description: { type: String, required: true },
  isImportant: { type: Boolean, default: false },
  followUpDate: { type: String },
  dateApplied: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'interviewing', 'rejected', 'accepted'], 
    default: 'pending' 
  },
  notes: [{ type: String }],
}, { timestamps: true });

const Application = mongoose.model('Application', applicationSchema);

// Routes

// GET all applications
app.get('/api/applications', async (req, res) => {
  try {
    const applications = await Application.find().sort({ dateApplied: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET important applications only
app.get('/api/applications/important', async (req, res) => {
  try {
    const applications = await Application.find({ isImportant: true }).sort({ dateApplied: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error fetching important applications:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST new application
app.post('/api/applications', async (req, res) => {
  try {
    const application = new Application(req.body);
    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT update application
app.put('/api/applications/:id', async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
    const dd = connectDB()
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
// const startServer = async () => {
//   await connectDB();
//   app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
//   });
// };

// startServer().catch(error => {
//   console.error('Failed to start server:', error);
//   process.exit(1);
// });

// module.exports = app;


const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Network: http://${getLocalIpAddress()}:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });
};

// Helper function to get local IP
function getLocalIpAddress() {
  const interfaces = require('os').networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});