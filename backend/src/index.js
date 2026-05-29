import express from 'express';
import cors from 'cors';
import flowchartRoutes from './routes/flowchartRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', flowchartRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: { message: 'Internal server error' } });
});

app.listen(PORT, () => {
  console.log(`ProgEngine backend running on http://localhost:${PORT}`);
});
