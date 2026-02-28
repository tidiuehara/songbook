# ChordPro Songbook App

A self-hosted, responsive web application for musicians, worship teams, and bands to manage and view ChordPro song files. Built with Node.js, it features real-time chord transposition, setlist management, and a mobile-optimized UI perfect for iPads and tablets on stage.



## ✨ Features

* **Smart Transposition:** Transpose songs instantly. The custom rendering engine ensures chords perfectly maintain their alignment over lyrics, even when chord lengths change (e.g., `C` to `C#`), and fully supports complex slash chords (e.g., `D/F#`).
* **Setlist Management:** Create custom setlists, add transposed songs directly to them, and easily manage or delete them. Setlists are saved persistently.
* **Responsive Stage UI:** * **Desktop:** Left sidebar navigation, 2-column song view.
  * **Tablet (iPad):** Space-saving top split-menu, 2-column song view.
  * **Mobile:** Compact top menu, readable 1-column song view.
* **Dynamic Typography:** On-the-fly font resizing (A- / A+) to fit long songs onto a single screen.
* **Clean PDF Export:** A dedicated print stylesheet strips away the UI, leaving a clean, two-column PDF output of the music sheet.
* **Smart Sectioning:** Verses and choruses automatically group together and will not awkwardly split across columns.

## 🚀 Tech Stack

* **Backend:** Node.js, Express.js
* **Frontend:** Vanilla JavaScript, HTML5, CSS3 (EJS templating)
* **Deployment:** Docker & Docker Compose ready

## 📂 Folder Structure

Your project should look like this before running:

```text
├── public/
│   ├── style.css         # Main stylesheet
│   └── fonts/            # Custom fonts (e.g., UDEV Gothic)
├── songs/                # 🎵 Drop your .pro or .chordpro files here!
├── views/
│   └── index.ejs         # Main frontend template
├── lib/
│   └── parser.js         # Custom ChordPro parsing engine
├── Dockerfile            # Docker image configuration
├── docker-compose.yml    # Docker deployment configuration
├── package.json          
├── server.js             # Express server and API routes
└── setlists.json         # Empty file `{}` to store setlist data
