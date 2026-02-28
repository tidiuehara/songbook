const express = require('express');
const path = require('path');
const fs = require('fs');
const { parseChordPro } = require('./lib/parser');

const app = express();
const PORT = 3000;

// NEW: Allow server to read JSON data from the "Save" button
app.use(express.json()); 

app.set('view engine', 'ejs');
app.use(express.static('public'));

// --- NEW: SETLISTS API ---
const SETLIST_FILE = path.join(__dirname, 'setlists.json');

// Helper to read setlists safely
function getSetlists() {
    if (!fs.existsSync(SETLIST_FILE)) return {};
    try {
        return JSON.parse(fs.readFileSync(SETLIST_FILE, 'utf-8'));
    } catch (e) { return {}; }
}

// Route 1: Get all setlists (for the sidebar)
app.get('/api/setlists', (req, res) => {
    res.json(getSetlists());
});

// Route 2: Save a song to a setlist
app.post('/api/setlists', (req, res) => {
    // Read the current file state freshly
    const currentSets = getSetlists(); 
    
    const { setName, song } = req.body;

    // If this set doesn't exist yet, create it
    if (!currentSets[setName]) {
        currentSets[setName] = [];
    }

    // Check if this specific song (filename) is already in the list
    const existingIndex = currentSets[setName].findIndex(s => s.filename === song.filename);
    
    if (existingIndex >= 0) {
        // UPDATE: If it exists, update the key (don't add a duplicate)
        currentSets[setName][existingIndex].key = song.key;
        console.log(`Updated key for ${song.title} in ${setName}`);
    } else {
        // ADD: Push the new song to the end of the array
        currentSets[setName].push(song);
        console.log(`Added ${song.title} to ${setName}`);
    }

    // Write back to file
    fs.writeFileSync(SETLIST_FILE, JSON.stringify(currentSets, null, 2));
    
    // Return the specific set we just modified so the frontend can update cleanly
    res.json({ success: true, setlists: currentSets });
});

// Route 3: Delete an entire setlist
app.delete('/api/setlists/:setName', (req, res) => {
    const currentSets = getSetlists();
    const setName = req.params.setName;
    
    if (currentSets[setName]) {
        delete currentSets[setName];
        fs.writeFileSync(SETLIST_FILE, JSON.stringify(currentSets, null, 2));
    }
    res.json({ success: true, setlists: currentSets });
});

// Route 4: Remove a specific song from a setlist
app.delete('/api/setlists/:setName/song/:filename', (req, res) => {
    const currentSets = getSetlists();
    const { setName, filename } = req.params;
    
    if (currentSets[setName]) {
        currentSets[setName] = currentSets[setName].filter(s => s.filename !== filename);
        fs.writeFileSync(SETLIST_FILE, JSON.stringify(currentSets, null, 2));
    }
    res.json({ success: true, setlists: currentSets });
});


// -------------------------

// Routes
app.get('/', (req, res) => {
    const songsDir = path.join(__dirname, 'songs');
    if (!fs.existsSync(songsDir)) fs.mkdirSync(songsDir);

    const files = fs.readdirSync(songsDir).filter(f => f.endsWith('.cho'));
    const songs = files.map(file => {
        const content = fs.readFileSync(path.join(songsDir, file), 'utf-8');
        const titleMatch = content.match(/{t(?:itle)?:(.*?)}/i);
        const title = titleMatch ? titleMatch[1].trim() : file.replace('.cho', '');
        return { filename: file, title };
    });

    res.render('index', { songs, currentSong: null });
});

app.get('/song/:filename', (req, res) => {
    const songsDir = path.join(__dirname, 'songs');
    const files = fs.readdirSync(songsDir).filter(f => f.endsWith('.cho'));
    const songList = files.map(file => {
        const content = fs.readFileSync(path.join(songsDir, file), 'utf-8');
        const titleMatch = content.match(/{t(?:itle)?:(.*?)}/i);
        const title = titleMatch ? titleMatch[1].trim() : file.replace('.cho', '');
        return { filename: file, title };
    });

    const filePath = path.join(songsDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.redirect('/');

    const songData = parseChordPro(filePath);

    // --- THIS IS THE MISSING LINE ---
    songData.filename = req.params.filename; 
    // --------------------------------
    res.render('index', { songs: songList, currentSong: songData });
});

app.listen(PORT, () => console.log(`Songbook running on port ${PORT}`));