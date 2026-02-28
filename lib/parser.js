// lib/parser.js
const fs = require('fs');

function getCharWidth(char) {
    if (char.match(/[^\x01-\x7E\xA1-\xDF]/)) return 2;
    return 1;
}

function getStringWidth(str) {
    let width = 0;
    for (let char of str) width += getCharWidth(char);
    return width;
}

function parseChordPro(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/);
    
    const metadata = {
        title: 'Untitled',
        artist: 'Unknown',
        key: '',
        tempo: '',
        time: '',
        extras: {} 
    };

    const renderedBlocks = [];
    let currentBlock = { type: 'standard', label: '', lines: [] };

    lines.forEach(line => {
        const trimmed = line.trim();

        // 1. METADATA & DIRECTIVES
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            const inner = trimmed.slice(1, -1);
            
            // Handle Comments: {comment: Intro} or {c: Intro}
            // We treat these as a special line inside the current block
            if (inner.startsWith('comment') || inner.startsWith('c:') || inner.startsWith('c ')) {
                const parts = inner.split(':');
                // Handle cases like {c:Intro} vs {comment: Intro}
                const commentText = parts.length > 1 ? parts.slice(1).join(':').trim() : inner.replace(/^c\s+/, '').trim();
                
                currentBlock.lines.push({
                    type: 'comment',
                    text: commentText
                });
                return;
            }

            // Start of Section
            if (inner.startsWith('start_of') || inner === 'soc' || inner === 'sov') {
                if (currentBlock.lines.length > 0) renderedBlocks.push(currentBlock);

                let type = 'standard';
                let label = '';
                
                if (inner.includes('chorus') || inner === 'soc') type = 'chorus';
                else if (inner.includes('verse') || inner === 'sov') type = 'verse';
                else if (inner.includes('bridge')) type = 'bridge';

                const labelMatch = inner.match(/label="(.*?)"/);
                if (labelMatch) label = labelMatch[1];
                else {
                    if(type === 'chorus') label = 'Chorus';
                    if(type === 'verse') label = 'Verse';
                    if(type === 'bridge') label = 'Bridge';
                }

                currentBlock = { type, label, lines: [] };
                return;
            }

            // End of Section
            if (inner.startsWith('end_of') || inner === 'eoc' || inner === 'eov') {
                if (currentBlock.lines.length > 0) renderedBlocks.push(currentBlock);
                currentBlock = { type: 'standard', label: '', lines: [] };
                return;
            }

            // Metadata parsing
            const parts = inner.split(':');
            const key = parts[0].toLowerCase().trim();
            const value = parts.slice(1).join(':').trim();

            if (key === 'title' || key === 't') metadata.title = value;
            else if (key === 'subtitle' || key === 'st') metadata.extras['Subtitle'] = value;
            else if (key === 'artist' || key === 'a') metadata.artist = value;
            else if (key === 'author') metadata.artist = value;
            else if (key === 'key' || key === 'k') metadata.key = value;
            else if (key === 'tempo' || key === 'bpm') metadata.tempo = value;
            else if (key === 'time') metadata.time = value;
            else if (key === 'ccli') metadata.extras['CCLI'] = value;
            else if (key === 'copyright') metadata.extras['Copyright'] = value;
            else if (key === 'composer') metadata.extras['Composer'] = value;
            else if (key === 'lyricist') metadata.extras['Lyricist'] = value;
            
            return;
        }

        if (trimmed.startsWith('#')) return;

        if (trimmed === '') {
            currentBlock.lines.push({ type: 'empty' });
            return;
        }

        // Lyrics & Chords
        const tokens = line.split(/(\[.*?\])/);
        const stream = tokens.filter(t => t !== "").map(t => ({
            text: t.startsWith('[') ? t.slice(1, -1) : t,
            isChord: t.startsWith('[')
        }));

        let loopChordLine = "";
        let loopLyricLine = "";
        let loopVisLen = 0;

        for (let i = 0; i < stream.length; i++) {
            const token = stream[i];
            if (token.isChord) {
                const paddingNeeded = loopVisLen - getStringWidth(loopChordLine);
                if (paddingNeeded > 0) loopChordLine += " ".repeat(paddingNeeded);
                loopChordLine += token.text;
                if (i + 1 < stream.length && !stream[i+1].isChord) {
                    stream[i+1].underlineFirst = true;
                }
            } else {
                const lyricText = token.text;
                let processedLyrics = "";
                for (let cIndex = 0; cIndex < lyricText.length; cIndex++) {
                    const char = lyricText[cIndex];
                    if (cIndex === 0 && token.underlineFirst) {
                        processedLyrics += `<span class="anchor">${char}</span>`;
                    } else {
                        processedLyrics += char;
                    }
                }
                loopLyricLine += processedLyrics;
                loopVisLen += getStringWidth(lyricText);
            }
        }

        currentBlock.lines.push({
            type: 'line',
            chords: loopChordLine,
            lyrics: loopLyricLine
        });
    });

    if (currentBlock.lines.length > 0) renderedBlocks.push(currentBlock);

    return { metadata, renderedBlocks };
}

module.exports = { parseChordPro };