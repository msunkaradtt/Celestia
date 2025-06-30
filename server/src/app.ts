import express from 'express';
import cors from 'cors';
//import dotenv from 'dotenv';
import spaceDataRouter from './routes/spaceData';
import tleDataRouter from './routes/tleData';
import artGenerationRouter from './routes/artGeneration';

//dotenv.config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200
};
//app.use(cors());

app.use(express.json());

// root endpoint
app.get('/', (req, res) => {
    res.send('Welcome to the Space Art NFT Backend!');
});

// endpoint to /api/space-data
app.use('/api/space-data', spaceDataRouter);

// endpoint to /api/tle-data
app.use('/api/tle-data', tleDataRouter);

// endpoint to /api/art
app.use('/api/art', artGenerationRouter);

export default app; // Export for testing