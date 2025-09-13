const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname));
app.use(cors());
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Database setup
const db = new sqlite3.Database('agnostos.db', (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// WebSocket setup
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Server running at http://{Your_IP_Address}:${port}`);
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const activeConnections = new Map();

wss.on('connection', (ws, req) => {
    const userId = new URLSearchParams(req.url.split('?')[1]).get('userId');
    if (userId) {
        activeConnections.set(userId, ws);
        console.log(`User ${userId} connected via WebSocket`);
    }

    ws.on('message', (message) => {
        try {
            const { type, data } = JSON.parse(message);
            if (type === 'message') {
                handleRealTimeMessage(data);
            }
        } catch (err) {
            console.error('WebSocket message error:', err);
        }
    });

    ws.on('close', () => {
        activeConnections.delete(userId);
        console.log(`User ${userId} disconnected`);
    });
});

function handleRealTimeMessage(messageData) {
    db.run(
        `INSERT INTO messages (sender_id, recipient_id, community_id, content, is_community_message, sent_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`,
        [
            messageData.senderId,
            messageData.recipientId,
            messageData.communityId,
            messageData.content,
            messageData.isCommunityMessage ? 1 : 0
        ],
        function (err) {
            if (err) {
                console.error('Error saving message:', err);
                return;
            }

            const messageId = this.lastID;

            db.get(
                `SELECT m.*, u.username as sender_username
                 FROM messages m
                 JOIN users u ON m.sender_id = u.id
                 WHERE m.id = ?`,
                [messageId],
                (err, fullMessage) => {
                    if (err) {
                        console.error('Error fetching message:', err);
                        return;
                    }

                    if (messageData.recipientId) {
                        const recipientWs = activeConnections.get(messageData.recipientId.toString());
                        const senderWs = activeConnections.get(messageData.senderId.toString());
                        const messagePayload = {
                            type: 'newMessage',
                            data: fullMessage
                        };

                        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                            recipientWs.send(JSON.stringify(messagePayload));
                        }
                        if (senderWs && senderWs.readyState === WebSocket.OPEN) {
                            senderWs.send(JSON.stringify(messagePayload));
                        }
                    }

                    if (messageData.communityId) {
                        db.all(
                            `SELECT user_id
                             FROM community_members
                             WHERE community_id = ?`,
                            [messageData.communityId],
                            (err, members) => {
                                if (err) {
                                    console.error('Error fetching community members:', err);
                                    return;
                                }
                                const messagePayload = {
                                    type: 'newCommunityMessage',
                                    data: fullMessage
                                };
                                members.forEach((member) => {
                                    const memberWs = activeConnections.get(member.user_id.toString());
                                    if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                                        memberWs.send(JSON.stringify(messagePayload));
                                    }
                                });
                            }
                        );
                    }
                }
            );
        }
    );
}

// Initialize database tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        agnos_balance REAL DEFAULT 100.0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS communities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        is_private BOOLEAN NOT NULL,
        creator_id INTEGER,
        FOREIGN KEY (creator_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS community_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        community_id INTEGER,
        role TEXT DEFAULT 'Member',
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (community_id) REFERENCES communities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS community_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        community_id INTEGER,
        status TEXT DEFAULT 'Pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (community_id) REFERENCES communities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        recipient_id INTEGER,
        community_id INTEGER,
        content TEXT NOT NULL,
        sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_community_message BOOLEAN NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (recipient_id) REFERENCES users(id),
        FOREIGN KEY (community_id) REFERENCES communities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        community_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        price REAL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (community_id) REFERENCES communities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        community_id INTEGER,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (community_id) REFERENCES communities(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER,
        service_id INTEGER,
        file_id INTEGER,
        recipient_id INTEGER,
        amount REAL NOT NULL,
        purpose TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (recipient_id) REFERENCES users(id)
    )`);

});

// File upload setup
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// API Endpoints
app.post('/api/register', async (req, res) => {
    const { fullName, username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (full_name, username, password, agnos_balance) VALUES (?, ?, ?, ?)',
            [fullName, username, hashedPassword, 100.0],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: 'Username already exists' });
                }
                res.json({ user: { id: this.lastID, username, agnos_balance: 100.0 } });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        res.json({ user: { id: user.id, username: user.username, agnos_balance: user.agnos_balance } });
    });
});

app.get('/api/check-username/:username', (req, res) => {
    db.get('SELECT username FROM users WHERE username = ?', [req.params.username], (err, row) => {
        res.json({ available: !row });
    });
});

app.get('/api/users', (req, res) => {
    db.all('SELECT id, username FROM users', [], (err, users) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch users' });
        res.json(users);
    });
});

app.get('/api/user/:id', (req, res) => {
    db.get('SELECT id, username, agnos_balance FROM users WHERE id = ?', [req.params.id], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    });
});

app.get('/api/profile-stats/:userId', (req, res) => {
    const userId = req.params.userId;
    db.all('SELECT COUNT(*) as communities FROM community_members WHERE user_id = ?', [userId], (err, communityStats) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
        db.all('SELECT COUNT(*) as files FROM files WHERE user_id = ?', [userId], (err, fileStats) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
            db.all('SELECT COUNT(*) as services FROM services WHERE user_id = ?', [userId], (err, serviceStats) => {
                if (err) return res.status(500).json({ error: 'Failed to fetch stats' });
                res.json({
                    communities: communityStats[0].communities,
                    files: fileStats[0].files,
                    services: serviceStats[0].services
                });
            });
        });
    });
});

app.post('/api/communities', (req, res) => {
    const { name, description, category, isPrivate, creatorId } = req.body;
    db.run(
        'INSERT INTO communities (name, description, category, is_private, creator_id) VALUES (?, ?, ?, ?, ?)',
        [name, description, category, isPrivate, creatorId],
        function (err) {
            if (err) return res.status(400).json({ error: 'Failed to create community' });
            db.run(
                'INSERT INTO community_members (user_id, community_id, role) VALUES (?, ?, ?)',
                [creatorId, this.lastID, 'Admin'],
                (err) => {
                    if (err) return res.status(400).json({ error: 'Failed to add creator as admin' });
                    res.json({ message: 'Community created successfully', communityId: this.lastID });
                }
            );
        }
    );
});

app.get('/api/communities', (req, res) => {
    db.all(
        `SELECT c.*, COUNT(cm.user_id) as member_count, u.username as creator_username
         FROM communities c
         LEFT JOIN community_members cm ON c.id = cm.community_id
         JOIN users u ON c.creator_id = u.id
         GROUP BY c.id`,
        [],
        (err, communities) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch communities' });
            res.json(communities);
        }
    );
});

app.get('/api/communities/user/:userId', (req, res) => {
    db.all(
        `SELECT c.*, cm.role
         FROM communities c
         JOIN community_members cm ON c.id = cm.community_id
         WHERE cm.user_id = ?`,
        [req.params.userId],
        (err, communities) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch user communities' });
            res.json(communities);
        }
    );
});

app.get('/api/communities/admin/:userId', (req, res) => {
    db.all(
        `SELECT c.*
         FROM communities c
         JOIN community_members cm ON c.id = cm.community_id
         WHERE cm.user_id = ? AND cm.role = 'Admin'`,
        [req.params.userId],
        (err, communities) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch admin communities' });
            res.json(communities);
        }
    );
});

// app.get('/api/communities/:id', (req, res) => {
//     db.get('SELECT * FROM communities WHERE id = ?', [req.params.id], (err, community) => {
//         if (err || !community) return res.status(404).json({ error: 'Community not found' });
//         res.json(community);
//     });
// });



// Replace the /api/communities/:id endpoint in server.js
app.get('/api/communities/:id', (req, res) => {
    const communityId = parseInt(req.params.id);
    if (isNaN(communityId)) {
        console.error('Invalid community ID:', req.params.id);
        return res.status(400).json({ error: 'Invalid community ID' });
    }

    db.get('SELECT * FROM communities WHERE id = ?', [communityId], (err, community) => {
        if (err) {
            console.error('Database error fetching community:', err);
            return res.status(500).json({ error: 'Database error occurred' });
        }
        if (!community) {
            console.error(`Community not found for ID: ${communityId}`);
            return res.status(404).json({ error: 'Community not found' });
        }

        res.setHeader('Content-Type', 'application/json');
        try {
            res.status(200).json(community);
        } catch (jsonError) {
            console.error('JSON serialization error:', jsonError);
            res.status(500).json({ error: 'Failed to serialize response' });
        }
    });
});

app.post('/api/communities/join', (req, res) => {
    const { userId, communityId } = req.body;
    db.get(
        'SELECT * FROM community_members WHERE user_id = ? AND community_id = ?',
        [userId, communityId],
        (err, row) => {
            if (row) return res.status(400).json({ error: 'Already a member' });
            db.run(
                'INSERT INTO community_members (user_id, community_id, role) VALUES (?, ?, ?)',
                [userId, communityId, 'Member'],
                (err) => {
                    if (err) return res.status(400).json({ error: 'Failed to join community' });
                    res.json({ message: 'Joined community successfully' });
                }
            );
        }
    );
});

app.post('/api/community-requests', (req, res) => {
    const { userId, communityId } = req.body;
    db.get(
        'SELECT * FROM community_members WHERE user_id = ? AND community_id = ?',
        [userId, communityId],
        (err, row) => {
            if (row) return res.status(400).json({ error: 'Already a member' });
            db.get(
                'SELECT * FROM community_requests WHERE user_id = ? AND community_id = ? AND status = ?',
                [userId, communityId, 'Pending'],
                (err, request) => {
                    if (request) return res.status(400).json({ error: 'Request already pending' });
                    db.run(
                        'INSERT INTO community_requests (user_id, community_id, status) VALUES (?, ?, ?)',
                        [userId, communityId, 'Pending'],
                        function (err) {
                            if (err) return res.status(400).json({ error: 'Failed to send join request' });
                            db.all(
                                `SELECT user_id
                                 FROM community_members
                                 WHERE community_id = ? AND role = 'Admin'`,
                                [communityId],
                                (err, admins) => {
                                    if (err) {
                                        console.error('Error fetching admins:', err);
                                        return;
                                    }
                                    admins.forEach((admin) => {
                                        const adminWs = activeConnections.get(admin.user_id.toString());
                                        if (adminWs && adminWs.readyState === WebSocket.OPEN) {
                                            adminWs.send(
                                                JSON.stringify({
                                                    type: 'communityRequestUpdate',
                                                    data: {
                                                        communityId,
                                                        status: 'Pending'
                                                    }
                                                })
                                            );
                                        }
                                    });
                                }
                            );
                            res.json({ message: 'Join request sent successfully' });
                        }
                    );
                }
            );
        }
    );
});

app.get('/api/community-requests/:userId', (req, res) => {
    db.all(
        `SELECT cr.*, c.name as community_name
         FROM community_requests cr
         JOIN communities c ON cr.community_id = c.id
         WHERE cr.user_id = ?`,
        [req.params.userId],
        (err, requests) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch requests' });
            res.json(requests);
        }
    );
});

app.get('/api/community-requests/admin/:userId', (req, res) => {
    db.all(
        `SELECT cr.*, c.name as community_name, u.username
         FROM community_requests cr
         JOIN communities c ON cr.community_id = c.id
         JOIN users u ON cr.user_id = u.id
         JOIN community_members cm ON c.id = cm.community_id
         WHERE cm.user_id = ? AND cm.role = 'Admin' AND cr.status = 'Pending'`,
        [req.params.userId],
        (err, requests) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch admin requests' });
            res.json(requests);
        }
    );
});

// app.post('/api/community-requests/approve/:requestId', (req, res) => {
//     const { userId, communityId, requestUserId } = req.body;
//     db.get(
//         'SELECT * FROM community_members WHERE user_id = ? AND community_id = ? AND role = ?',
//         [userId, communityId, 'Admin'],
//         (err, admin) => {
//             if (err || !admin) return res.status(403).json({ error: 'Unauthorized' });
//             db.run(
//                 'UPDATE community_requests SET status = ? WHERE id = ?',
//                 ['Approved', req.params.requestId],
//                 (err) => {
//                     if (err) return res.status(400).json({ error: 'Failed to approve request' });
//                     db.run(
//                         'INSERT INTO community_members (user_id, community_id, role) VALUES (?, ?, ?)',
//                         [requestUserId, communityId, 'Member'],
//                         (err) => {
//                             if (err) return res.status(400).json({ error: 'Failed to add member' });
//                             db.get(
//                                 'SELECT user_id FROM community_requests WHERE id = ?',
//                                 [req.params.requestId],
//                                 (err, request) => {
//                                     if (err) return;
//                                     const userWs = activeConnections.get(request.user_id.toString());
//                                     if (userWs && userWs.readyState === WebSocket.OPEN) {
//                                         userWs.send(
//                                             JSON.stringify({
//                                                 type: 'communityRequestUpdate',
//                                                 data: { status: 'Approved', communityId }
//                                             })
//                                         );
//                                     }
//                                 }
//                             );
//                             res.json({ message: 'Join request approved' });
//                         }
//                     );
//                 }
//             );
//         }
//     );
// });



// Replace the /api/community-requests/approve/:requestId endpoint in server.js
app.post('/api/community-requests/approve/:requestId', (req, res) => {
    const { userId, communityId } = req.body;
    db.get(
        'SELECT * FROM community_members WHERE user_id = ? AND community_id = ? AND role = ?',
        [userId, communityId, 'Admin'],
        (err, admin) => {
            if (err || !admin) return res.status(403).json({ error: 'Unauthorized' });
            db.get(
                'SELECT user_id FROM community_requests WHERE id = ?',
                [req.params.requestId],
                (err, request) => {
                    if (err || !request) return res.status(404).json({ error: 'Request not found' });
                    db.run(
                        'UPDATE community_requests SET status = ? WHERE id = ?',
                        ['Approved', req.params.requestId],
                        (err) => {
                            if (err) return res.status(400).json({ error: 'Failed to approve request' });
                            db.run(
                                'INSERT INTO community_members (user_id, community_id, role) VALUES (?, ?, ?)',
                                [request.user_id, communityId, 'Member'],
                                (err) => {
                                    if (err) return res.status(400).json({ error: 'Failed to add member' });
                                    const userWs = activeConnections.get(request.user_id.toString());
                                    if (userWs && userWs.readyState === WebSocket.OPEN) {
                                        userWs.send(
                                            JSON.stringify({
                                                type: 'communityRequestUpdate',
                                                data: { status: 'Approved', communityId }
                                            })
                                        );
                                    }
                                    res.json({ message: 'Join request approved' });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


app.post('/api/community-requests/reject/:requestId', (req, res) => {
    const { userId, communityId } = req.body;
    db.get(
        'SELECT * FROM community_members WHERE user_id = ? AND community_id = ? AND role = ?',
        [userId, communityId, 'Admin'],
        (err, admin) => {
            if (err || !admin) return res.status(403).json({ error: 'Unauthorized' });
            db.run(
                'UPDATE community_requests SET status = ? WHERE id = ?',
                ['Rejected', req.params.requestId],
                (err) => {
                    if (err) return res.status(400).json({ error: 'Failed to reject request' });
                    db.get(
                        'SELECT user_id FROM community_requests WHERE id = ?',
                        [req.params.requestId],
                        (err, request) => {
                            if (err) return;
                            const userWs = activeConnections.get(request.user_id.toString());
                            if (userWs && userWs.readyState === WebSocket.OPEN) {
                                userWs.send(
                                    JSON.stringify({
                                        type: 'communityRequestUpdate',
                                        data: { status: 'Rejected', communityId }
                                    })
                                );
                            }
                        }
                    );
                    res.json({ message: 'Join request rejected' });
                }
            );
        }
    );
});

app.delete('/api/community-requests/:requestId', (req, res) => {
    const { userId } = req.body;
    db.get(
        'SELECT * FROM community_requests WHERE id = ? AND user_id = ?',
        [req.params.requestId, userId],
        (err, request) => {
            if (err || !request) return res.status(400).json({ error: 'Request not found or unauthorized' });
            db.run('DELETE FROM community_requests WHERE id = ?', [req.params.requestId], (err) => {
                if (err) return res.status(400).json({ error: 'Failed to cancel request' });
                res.json({ message: 'Join request canceled' });
            });
        }
    );
});

app.get('/api/community-members/:communityId', (req, res) => {
    db.all(
        `SELECT u.username, cm.role
         FROM community_members cm
         JOIN users u ON cm.user_id = u.id
         WHERE cm.community_id = ?`,
        [req.params.communityId],
        (err, members) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch members' });
            res.json(members);
        }
    );
});

app.get('/api/community-members/:communityId/:userId', (req, res) => {
    db.get(
        'SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
        [req.params.communityId, req.params.userId],
        (err, member) => {
            if (err) return res.status(500).json({ error: 'Failed to check membership' });
            res.json(member);
        }
    );
});

// app.post('/api/upload-file', upload.single('file'), (req, res) => {
//     const { userId, title, description, category, price } = req.body;
//     if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
//     db.run(
//         `INSERT INTO files (user_id, title, description, category, file_path, file_size, price)
//          VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [userId, title, description, category, req.file.path, req.file.size, price],
//         function (err) {
//             if (err) return res.status(400).json({ error: 'Failed to upload file' });
//             res.json({ file: { id: this.lastID, title } });
//         }
//     );
// });


app.post('/api/upload-file', upload.single('file'), (req, res) => {
    const { userId, title, description, category, price, communityId } = req.body;
    const filePath = `uploads/${req.file.filename}`;
    const fileSize = req.file.size;
    const sanitizedCommunityId = communityId || null;
    console.log("Server received Community ID:", sanitizedCommunityId); // Debug log

    db.run(
        'INSERT INTO files (user_id, community_id, title, description, category, file_path, file_size, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, communityId || null, title, description, category, filePath, fileSize, price],
        function (err) {
            if (err) return res.status(400).json({ error: 'Failed to upload file' });
            res.json({ file: { id: this.lastID, title, file_path: filePath } });
        }
    );
});

// app.get('/api/files', (req, res) => {
//     db.all(
//         `SELECT f.*, u.username as uploader_username
//          FROM files f
//          JOIN users u ON f.user_id = u.id`,
//         [],
//         (err, files) => {
//             if (err) return res.status(500).json({ error: 'Failed to fetch files' });
//             res.json(files);
//         }
//     );
// });


app.get('/api/files', (req, res) => {
    db.all(`
        SELECT f.*, u.username as uploader_username
        FROM files f
        JOIN users u ON f.user_id = u.id
        WHERE f.community_id IS NULL
    `, [], (err, files) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch files' });
        res.json(files);
    });
});

app.get('/api/files/user/:userId', (req, res) => {
    db.all(
        `SELECT f.*, u.username as uploader_username
         FROM files f
         JOIN users u ON f.user_id = u.id
         WHERE f.user_id = ?`,
        [req.params.userId],
        (err, files) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch user files' });
            res.json(files);
        }
    );
});

app.get('/api/files/community/:communityId', (req, res) => {
    db.all(
        `SELECT f.*, u.username as uploader_username
         FROM files f
         JOIN users u ON f.user_id = u.id
         WHERE f.community_id = ?`,
        [req.params.communityId],
        (err, files) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch community files' });
            res.json(files);
        }
    );
});

app.post('/api/services', (req, res) => {
    const { userId, title, description, category, price, communityId } = req.body;
    db.run(
        `INSERT INTO services (user_id, community_id, title, description, category, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, communityId || null, title, description, category, price],
        function (err) {
            if (err) return res.status(400).json({ error: 'Failed to create service' });
            res.json({ message: 'Service created successfully', serviceId: this.lastID });
        }
    );
});

app.get('/api/services', (req, res) => {
    db.all(
        `SELECT s.*, u.username as provider_username
         FROM services s
         JOIN users u ON s.user_id = u.id
         WHERE s.community_id IS NULL`,
        [],
        (err, services) => {
            if (err) {
                console.error('Database error:', err);  // Add error logging
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(services);
        }
    );
});



// For general services (not in any community)
// app.get('/api/services', (req, res) => {
//     db.all(
//         `SELECT s.*, u.username as provider_username
//          FROM services s
//          JOIN users u ON s.user_id = u.id
//          WHERE s.community_id IS NULL`,
//         [],
//         (err, services) => {
//             if (err) return res.status(500).json({ error: 'Failed to fetch services' });
//             res.json(services);
//         }
//     );
// });

app.get('/api/services/user/:userId', (req, res) => {
    db.all(
        `SELECT s.*, u.username as provider_username
         FROM services s
         JOIN users u ON s.user_id = u.id
         WHERE s.user_id = ?`,
        [req.params.userId],
        (err, services) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch user services' });
            res.json(services);
        }
    );
});

app.get('/api/services/community/:communityId', (req, res) => {
    db.all(
        `SELECT s.*, u.username as provider_username
        FROM services s
        JOIN users u ON s.user_id = u.id
        WHERE s.community_id = ?`,
        [req.params.communityId],
        (err, services) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch community services' });
            res.json(services);
        }
    );
});

// app.post('/api/transactions', (req, res) => {
//     const { senderId, recipientUsername, amount, purpose } = req.body;
//     db.get('SELECT id FROM users WHERE username = ?', [recipientUsername], (err, recipient) => {
//         if (err || !recipient) return res.status(400).json({ error: 'Recipient not found' });
//         db.get('SELECT agnos_balance FROM users WHERE id = ?', [senderId], (err, sender) => {
//             if (err || !sender) return res.status(400).json({ error: 'Sender not found' });
//             if (sender.agnos_balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
//             db.run('UPDATE users SET agnos_balance = agnos_balance - ? WHERE id = ?', [amount, senderId], (err) => {
//                 if (err) return res.status(400).json({ error: 'Failed to update sender balance' });
//                 db.run(
//                     'UPDATE users SET agnos_balance = agnos_balance + ? WHERE id = ?',
//                     [amount, recipient.id],
//                     (err) => {
//                         if (err) return res.status(400).json({ error: 'Failed to update recipient balance' });
//                         db.run(
//                             'INSERT INTO transactions (sender_id, recipient_id, amount, purpose) VALUES (?, ?, ?, ?)',
//                             [senderId, recipient.id, amount, purpose],
//                             function (err) {
//                                 if (err) return res.status(400).json({ error: 'Failed to record transaction' });
//                                 res.json({ message: 'Transaction successful', transactionId: this.lastID });
//                             }
//                         );
//                     }
//                 );
//             });
//         });
//     });
// });


// Replace the /api/transactions endpoint in server.js
app.post('/api/transactions', (req, res) => {
    const { senderId, recipientUsername, amount, purpose, serviceId, fileId } = req.body;
    db.get('SELECT id FROM users WHERE username = ?', [recipientUsername], (err, recipient) => {
        if (err || !recipient) return res.status(400).json({ error: 'Recipient not found' });
        db.get('SELECT agnos_balance FROM users WHERE id = ?', [senderId], (err, sender) => {
            if (err || !sender) return res.status(400).json({ error: 'Sender not found' });
            if (sender.agnos_balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

            // Check if the user has already purchased the service or file
            if (purpose === 'Service Payment' && serviceId) {
                db.get(
                    'SELECT * FROM transactions WHERE sender_id = ? AND service_id = ? AND purpose = ?',
                    [senderId, serviceId, 'Service Payment'],
                    (err, existingTransaction) => {
                        if (existingTransaction) {
                            return res.status(400).json({ error: 'Service already purchased' });
                        }
                        processTransaction();
                    }
                );
            } else if (purpose === 'File Purchase' && fileId) {
                db.get(
                    'SELECT * FROM transactions WHERE sender_id = ? AND file_id = ? AND purpose = ?',
                    [senderId, fileId, 'File Purchase'],
                    (err, existingTransaction) => {
                        if (existingTransaction) {
                            return res.status(400).json({ error: 'File already purchased' });
                        }
                        processTransaction();
                    }
                );
            } else {
                processTransaction();
            }

            function processTransaction() {
                db.run('UPDATE users SET agnos_balance = agnos_balance - ? WHERE id = ?', [amount, senderId], (err) => {
                    if (err) return res.status(400).json({ error: 'Failed to update sender balance' });
                    db.run(
                        'UPDATE users SET agnos_balance = agnos_balance + ? WHERE id = ?',
                        [amount, recipient.id],
                        (err) => {
                            if (err) return res.status(400).json({ error: 'Failed to update recipient balance' });
                            db.run(
                                'INSERT INTO transactions (sender_id, recipient_id, amount, purpose, service_id, file_id) VALUES (?, ?, ?, ?, ?, ?)',
                                [senderId, recipient.id, amount, purpose, serviceId || null, fileId || null],
                                function (err) {
                                    if (err) return res.status(400).json({ error: 'Failed to record transaction' });
                                    res.json({ message: 'Transaction successful', transactionId: this.lastID });
                                }
                            );
                        }
                    );
                });
            }
        });
    });
});


app.get('/api/transactions/:userId', (req, res) => {
    db.all(
        `SELECT t.*, u1.username as sender_username, u2.username as recipient_username
         FROM transactions t
         JOIN users u1 ON t.sender_id = u1.id
         JOIN users u2 ON t.recipient_id = u2.id
         WHERE t.sender_id = ? OR t.recipient_id = ?`,
        [req.params.userId, req.params.userId],
        (err, transactions) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch transactions' });
            res.json(transactions);
        }
    );
});

app.get('/api/chats/:userId', (req, res) => {
    db.all(
        `SELECT DISTINCT
            CASE
                WHEN m.is_community_message THEN 'community:' || m.community_id
                ELSE 'private:' || (CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END)
            END as chat_id,
            CASE
                WHEN m.is_community_message THEN c.name
                ELSE u.username
            END as chat_name,
            m.content as last_message_content,
            m.sent_at as last_message_time,
            SUM(CASE WHEN m.is_read = 0 AND m.recipient_id = ? THEN 1 ELSE 0 END) as unread_count,
            m.is_community_message
         FROM messages m
         LEFT JOIN users u ON (m.sender_id = u.id OR m.recipient_id = u.id) AND u.id != ?
         LEFT JOIN communities c ON m.community_id = c.id
         WHERE m.sender_id = ? OR m.recipient_id = ? OR m.community_id IN (
             SELECT community_id FROM community_members WHERE user_id = ?
         )
         GROUP BY chat_id
         ORDER BY m.sent_at DESC`,
        [req.params.userId, req.params.userId, req.params.userId, req.params.userId, req.params.userId, req.params.userId],
        (err, chats) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch chats' });
            res.json(chats);
        }
    );
});

app.get('/api/messages/:chatId/:userId', (req, res) => {
    const { chatId, userId } = req.params;
    let query, params;
    if (chatId.startsWith('community:')) {
        const communityId = chatId.split(':')[1];
        query = `
            SELECT m.*, u.username as sender_username
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.community_id = ? AND m.is_community_message = 1
            ORDER BY m.sent_at ASC`;
        params = [communityId];
    } else {
        const recipientId = chatId.split(':')[1];
        query = `
            SELECT m.*, u.username as sender_username
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE ((m.sender_id = ? AND m.recipient_id = ?) OR (m.sender_id = ? AND m.recipient_id = ?))
            AND m.is_community_message = 0
            ORDER BY m.sent_at ASC`;
        params = [userId, recipientId, recipientId, userId];
    }
    db.all(query, params, (err, messages) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch messages' });
        res.json(messages);
    });
});

app.post('/api/messages/read/:chatId/:userId', (req, res) => {
    const { chatId, userId } = req.params;
    let query, params;
    if (chatId.startsWith('community:')) {
        const communityId = chatId.split(':')[1];
        query = `
            UPDATE messages
            SET is_read = 1
            WHERE community_id = ? AND is_community_message = 1 AND is_read = 0`;
        params = [communityId];
    } else {
        const recipientId = chatId.split(':')[1];
        query = `
            UPDATE messages
            SET is_read = 1
            WHERE recipient_id = ? AND sender_id = ? AND is_community_message = 0 AND is_read = 0`;
        params = [userId, recipientId];
    }
    db.run(query, params, (err) => {
        if (err) return res.status(500).json({ error: 'Failed to mark messages as read' });
        res.json({ message: 'Messages marked as read' });
    });
});

app.delete('/api/messages/:messageId', (req, res) => {
    const { userId } = req.body;
    db.get(
        'SELECT * FROM messages WHERE id = ? AND sender_id = ?',
        [req.params.messageId, userId],
        (err, message) => {
            if (err || !message) return res.status(400).json({ error: 'Message not found or unauthorized' });
            db.run('DELETE FROM messages WHERE id = ?', [req.params.messageId], (err) => {
                if (err) return res.status(400).json({ error: 'Failed to delete message' });
                res.json({ message: 'Message deleted successfully' });
            });
        }
    );
});





app.delete('/api/delete-file', (req, res) => {
    const { fileId, userId } = req.body;

    // Verify user is the file owner
    db.get('SELECT * FROM files WHERE id = ? AND user_id = ?', [fileId, userId], (err, file) => {
        if (err) {
            console.error('Error fetching file:', err);
            return res.status(500).json({ error: 'Failed to fetch file' });
        }
        if (!file) {
            return res.status(403).json({ error: 'File not found or unauthorized' });
        }

        // Delete file from filesystem
        fs.unlink(file.file_path, (err) => {
            if (err) {
                console.error('Error deleting file from filesystem:', err);
                return res.status(500).json({ error: 'Failed to delete file from filesystem' });
            }

            // Delete file from database
            db.run('DELETE FROM files WHERE id = ?', [fileId], (err) => {
                if (err) {
                    console.error('Error deleting file from database:', err);
                    return res.status(500).json({ error: 'Failed to delete file from database' });
                }
                res.json({ message: 'File deleted successfully' });
            });
        });
    });
});