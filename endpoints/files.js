import express from 'express';
import multer from 'multer';
import path from 'path';
import db from './database.js';

const fileRouter = express.Router();

// MULTER SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
})
const upload = multer({ storage });

// GET REQUEST HANDLER
fileRouter.get('/files', (req, res) => {
    res.send('get request received');
});

// POST REQUEST HANDLER
fileRouter.post('/files', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const statement = db.prepare(`
        INSERT INTO files (original_name, stored_name, size, mime_type)
        VALUES (?, ?, ?, ?)
    `);

    statement.run(file.originalname, file.filename, file.size, file.mimetype);
    
    res.json({
        message: 'File uploaded successfully',
        file: {
            originalName: file.originalname,
            storedName: file.filename,
            size: file.size,
            mimeType: file.mimetype,
            uploadedAt: new Date().toISOString()
        }
    });
});

export default fileRouter;