import express from 'express';
import db from './database.js'; 

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('get request received');
});

app.post('/', (req, res) => {
    res.send('post request received');
    
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
