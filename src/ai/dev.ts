import { config } from 'dotenv';
config();

// Lazy load flows only when needed to reduce memory usage
// Flows are imported on demand in their respective routes
