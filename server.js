
// Initialize Express app
import express from 'express';
import fileRouter from './endpoints/files.js';
import folderRouter from './endpoints/folder.js';

const app = express();
app.use(express.json());
app.use('/', fileRouter);
app.use('/', folderRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

export default app;