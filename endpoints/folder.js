import express from 'express';
import db from '../setup/database.js';

const folderRouter = express.Router();

// GET REQUEST HANDLER - List folders or get specific folder
folderRouter.get('/folders', (req, res) => {
    const { id, name, parent_id } = req.query;

    try {
        if (id) {
            // Get specific folder by ID
            const folder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
            if (!folder) {
                return res.status(404).json({ error: 'Folder not found' });
            }
            return res.json(folder);
        }

        if (name) {
            // Get specific folder by name
            const folder = db.prepare('SELECT * FROM folders WHERE name = ?').get(name);
            if (!folder) {
                return res.status(404).json({ error: 'Folder not found' });
            }
            return res.json(folder);
        }

        if (parent_id !== undefined) {
            // Get folders by parent_id (for nested folder listing)
            const folders = db.prepare('SELECT * FROM folders WHERE parent_id = ? ORDER BY name').all(parent_id);
            return res.json(folders);
        }

        // List all folders
        const folders = db.prepare('SELECT * FROM folders ORDER BY name').all();
        return res.json(folders);
    } catch (err) {
        console.error('Error fetching folders:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST REQUEST HANDLER - Create new folder
folderRouter.post('/folders', (req, res) => {
    const { name, parent_id } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    // Validate parent_id if provided
    if (parent_id !== undefined && parent_id !== null) {
        const parentFolder = db.prepare('SELECT id FROM folders WHERE id = ?').get(parent_id);
        if (!parentFolder) {
            return res.status(400).json({ error: 'Parent folder not found' });
        }
    }

    try {
        // Check if folder with same name already exists in the same parent directory
        const existingFolder = db.prepare(
            'SELECT id FROM folders WHERE name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))'
        ).get(name, parent_id, parent_id);

        if (existingFolder) {
            return res.status(409).json({ error: 'Folder with this name already exists in the same directory' });
        }

        // Insert new folder
        const statement = db.prepare(`
            INSERT INTO folders (name, parent_id)
            VALUES (?, ?)
        `);

        const result = statement.run(name, parent_id || null);
        const newFolder = db.prepare('SELECT * FROM folders WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Folder created successfully',
            folder: newFolder
        });
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT REQUEST HANDLER - Update folder
folderRouter.put('/folders', (req, res) => {
    const { id, name, parent_id } = req.body;

    if (!id) {
        return res.status(400).json({ error: 'Folder ID is required' });
    }

    if (!name) {
        return res.status(400).json({ error: 'Folder name is required' });
    }

    try {
        // Check if folder exists
        const existingFolder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
        if (!existingFolder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Validate parent_id if provided
        if (parent_id !== undefined && parent_id !== null) {
            // Prevent setting parent to self
            if (parent_id == id) {
                return res.status(400).json({ error: 'Folder cannot be its own parent' });
            }

            // Check if parent exists
            const parentFolder = db.prepare('SELECT id FROM folders WHERE id = ?').get(parent_id);
            if (!parentFolder) {
                return res.status(400).json({ error: 'Parent folder not found' });
            }

            // Check for circular reference (prevent infinite nesting)
            let currentParent = parent_id;
            while (currentParent) {
                if (currentParent == id) {
                    return res.status(400).json({ error: 'Circular reference detected' });
                }
                const parent = db.prepare('SELECT parent_id FROM folders WHERE id = ?').get(currentParent);
                currentParent = parent ? parent.parent_id : null;
            }
        }

        // Check if folder with same name already exists in the target directory
        const targetParentId = parent_id !== undefined ? parent_id : existingFolder.parent_id;
        const duplicateFolder = db.prepare(
            'SELECT id FROM folders WHERE name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL)) AND id != ?'
        ).get(name, targetParentId, targetParentId, id);

        if (duplicateFolder) {
            return res.status(409).json({ error: 'Folder with this name already exists in the target directory' });
        }

        // Update folder
        const statement = db.prepare(`
            UPDATE folders 
            SET name = ?, parent_id = ?
            WHERE id = ?
        `);

        statement.run(name, parent_id !== undefined ? parent_id : existingFolder.parent_id, id);
        const updatedFolder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);

        res.json({
            message: 'Folder updated successfully',
            folder: updatedFolder
        });
    } catch (err) {
        console.error('Error updating folder:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE REQUEST HANDLER - Delete folder
folderRouter.delete('/folders', (req, res) => {
    const { id, name } = req.query;

    if (!id && !name) {
        return res.status(400).json({ error: 'You must specify either an id or a name' });
    }

    try {
        // Find the folder
        let sql = 'SELECT * FROM folders WHERE';
        const conditions = [];
        const params = [];

        if (id) {
            conditions.push('id = ?');
            params.push(id);
        }
        if (name) {
            conditions.push('name = ?');
            params.push(name);
        }

        sql += ' ' + conditions.join(' AND ');
        const folder = db.prepare(sql).get(...params);

        if (!folder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        // Check if folder has subfolders
        const subfolders = db.prepare('SELECT COUNT(*) as count FROM folders WHERE parent_id = ?').get(folder.id);
        if (subfolders.count > 0) {
            return res.status(400).json({
                error: 'Cannot delete folder that contains subfolders. Please delete subfolders first.'
            });
        }

        // Check if folder has files
        const files = db.prepare('SELECT COUNT(*) as count FROM files WHERE folder_id = ?').get(folder.id);
        if (files.count > 0) {
            return res.status(400).json({
                error: 'Cannot delete folder that contains files. Please delete files first.'
            });
        }

        // Delete the folder
        const deleteSql = `DELETE FROM folders WHERE ${conditions.join(' AND ')}`;
        db.prepare(deleteSql).run(...params);

        res.json({ message: 'Folder deleted successfully' });
    } catch (err) {
        console.error('Error deleting folder:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default folderRouter;
