<div align="center">

# 🗺️ GeoTag Studio

### The Open-Source GPS Metadata Editor That Respects Your Privacy

**Read, write, and batch-edit EXIF geotags, keywords, descriptions, and ALT text — entirely in your browser.**

Zero uploads. Zero tracking. Zero cost.

[![Version](https://img.shields.io/badge/v2.0.0-stable-6ee7b7?style=for-the-badge)](https://github.com/BalramSharma1725/GeoTag-Studio)
[![License](https://img.shields.io/badge/MIT-License-38bdf8?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-a855f7?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-f472b6?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

[**🚀 Launch App**](https://balramsharma1725.github.io/GeoTag-Studio/) · [**📄 Documentation**](#-how-to-use) · [**🐛 Report Bug**](https://github.com/BalramSharma1725/GeoTag-Studio/issues)

</div>

---

## 🌍 The Problem

Every day, millions of photographs are taken — by photographers, journalists, real estate agents, SEO professionals, drone operators, and researchers. But most of these images are missing one critical piece of information: **where they were taken.**

Without GPS metadata, images are invisible to location-based search engines, useless for mapping applications, and lack the context needed for professional workflows. Existing solutions either:

- 💰 **Cost $50–$300/year** in subscription fees
- ☁️ **Upload your images to a server** — a privacy nightmare
- 🖥️ **Require desktop software installation** — platform-locked
- 😕 **Only handle one image at a time** — unscalable for real work

**GeoTag Studio solves all of this.** It's free, private, browser-based, and built for batch processing.

---

## 💡 Who Is This For?

| User | Pain Point | How GeoTag Studio Helps |
|---|---|---|
| **📸 Photographers** | Need GPS tags for photo libraries & stock submissions | Batch-tag hundreds of photos by clicking on a map |
| **🏠 Real Estate Agents** | Property images need location data for MLS listings | Set GPS once, apply to all property photos instantly |
| **📈 SEO Professionals** | Google uses EXIF geotags for local search ranking | Embed GPS, ALT text, keywords, and descriptions for Local SEO |
| **📰 Journalists & Researchers** | Need to document where photos were taken | Add precise coordinates with full metadata audit trail |
| **🛒 E-Commerce Sellers** | Product photos need rich metadata for marketplace search | Bulk-add keywords, descriptions, and ALT text |
| **🛩️ Drone Operators** | Aerial images need GPS correlation with flight logs | Import coordinates from CSV/GPX files, batch-apply |
| **🌐 Web Developers** | Images need ALT text for accessibility & SEO | Per-image ALT text editor with character counter |

---

## ✨ Features

### 📍 GPS Editing
- **Interactive Map** — Click anywhere on the map to set coordinates (Leaflet + OpenStreetMap)
- **Manual Coordinates** — Type exact latitude/longitude with real-time validation
- **Place Search** — Search any address, city, or landmark by name (Nominatim API)
- **Bulk Apply** — Set GPS for current image, selected images, or all images at once
- **Undo / Reset** — Revert any change per individual image
- **Before / After** — Side-by-side comparison of original vs. edited coordinates

### ✏️ Metadata Management
- **Alt Text Editor** — Per-image alt text with character counter (warns at 100, caps at 250)
- **Keywords & Tags** — Searchable tags written to XPKeywords + UserComment EXIF fields
- **Image Description** — Embedded into EXIF ImageDescription field
- **Timestamp Editing** — Modify DateTimeOriginal / DateTimeDigitized
- **Bulk Metadata Editor** — Apply shared keywords/description + unique ALT text per image

### 📄 CSV / GPX Import
- **CSV Import** — Upload a spreadsheet with `filename, lat, lng, keywords, description, alt`
- **GPX Import** — Import GPS tracks and waypoints from GPX files
- **Smart Matching** — Automatic filename matching with sequential fallback
- **Preview & Confirm** — Review all matches before applying
- **Template Export** — Download a pre-filled CSV template from your current images

### 📦 Export & Download
- **ZIP Archive** — Download all images as a single ZIP file
- **Selective Export** — Choose to download all images or only edited ones
- **Individual Download** — Download any single image with metadata embedded
- **Format Handling** — JPEG files keep their format; PNG/WEBP converted to JPEG for GPS support

### 📸 Format Support
- **JPEG / JPG** — Full EXIF read + write
- **PNG / WEBP** — Auto-converted to JPEG for GPS embedding
- **HEIC / HEIF** — iPhone photos automatically converted to JPEG (via heic2any)

### 🌗 Themes & Accessibility
- **Dark / Light / System** — Three theme modes with localStorage persistence
- **WCAG 2.1 AA** — ARIA labels, keyboard navigation, focus management, screen reader support
- **Mobile Responsive** — Hamburger menu, touch-friendly controls, collapsible panels

### ⚡ Performance & Privacy
- **100% Client-Side** — Every operation runs in your browser. No server. No uploads. No tracking.
- **Offline Support** — Installable as a PWA. Map tiles cached for offline use via Service Worker.
- **Code Splitting** — ~138 KB gzipped initial load (lazy-loaded components for maps and HEIC)
- **Batch Processing** — Handle hundreds of images with real-time progress tracking

---

## 🔒 Privacy — Our Core Principle

> **Your images never leave your device.**

Unlike cloud-based tools that upload your photos to third-party servers, GeoTag Studio processes everything locally using browser APIs. Your images, GPS coordinates, keywords, descriptions, and ALT text — all of it stays on **your machine**.

- ❌ No server uploads
- ❌ No cookies or tracking
- ❌ No analytics or telemetry
- ❌ No account required
- ✅ Works fully offline as a PWA
- ✅ Open source — audit the code yourself

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and **npm** 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/BalramSharma1725/GeoTag-Studio.git
cd GeoTag-Studio/geotag-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173/GeoTag-Studio/** in your browser.

### Production Build

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

---

## 🎯 How to Use

### Step 1 — Upload Images
Drag and drop your photos into the upload zone, or click **Choose Files** to browse. Supported formats: `JPG`, `PNG`, `WEBP`, `HEIC`.

### Step 2 — Set GPS Coordinates
Select an image from the grid, then:
- **Click the map** to pin a location
- **Type coordinates** manually (e.g., `40.7128, -74.006`)
- **Search a place** by name (e.g., "Times Square, New York")

Choose to apply GPS to the **current image**, **selected images**, or **all images**.

### Step 3 — Add Metadata
For each image, you can add:
- **Alt Text** — Accessibility and SEO (per-image, with character counter)
- **Keywords** — Comma-separated tags for search engines
- **Description** — Full image caption/description
- **Timestamp** — Override the photo's date/time

Use **Bulk Metadata Editor** to set shared keywords + unique ALT text across all images at once.

### Step 4 — Import from CSV (Optional)
Click **Import CSV/GPX** in the sidebar. Upload a CSV file with columns:
```
filename, lat, lng, keywords, description, alt
```
Download a pre-filled template, edit it in Excel/Google Sheets, and re-import.

### Step 5 — Export
Go to **Export** view. Download individual images or a **ZIP archive** with all metadata embedded in EXIF.

### Step 6 — Verify
Confirm your metadata was written correctly:
```bash
exiftool downloaded-image.jpg | grep -i "gps\|keyword\|description\|comment"
```

---

## 📊 EXIF Field Mapping

GeoTag Studio writes metadata to multiple EXIF fields for maximum compatibility across platforms:

| Data | EXIF Tag | Tag ID | Encoding | Compatible With |
|---|---|---|---|---|
| Alt Text | ImageDescription | 270 | ASCII | All EXIF readers |
| Alt Text | XPComment | 40092 | UTF-16LE | Windows, Adobe, Google |
| Keywords | XPKeywords | 40094 | UTF-16LE | Windows, Adobe, Google |
| Keywords | UserComment | 37510 | UNICODE | All EXIF readers |
| Description | ImageDescription | 270 | ASCII | All EXIF readers |
| GPS Latitude | GPSLatitude | — | DMS Rational | All GPS-aware tools |
| GPS Longitude | GPSLongitude | — | DMS Rational | All GPS-aware tools |
| Timestamp | DateTimeOriginal | 36867 | ASCII | All EXIF readers |

---

## 🧩 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **UI Framework** | React 18 | Component-based UI with hooks |
| **Bundler** | Vite 5 | Lightning-fast dev server and builds |
| **Styling** | Tailwind CSS 3 | Utility-first CSS with custom theme |
| **Animations** | Framer Motion 11 | Smooth transitions and micro-interactions |
| **State** | Zustand 4 | Lightweight global state management |
| **Maps** | Leaflet + React-Leaflet | Interactive map with OpenStreetMap tiles |
| **EXIF** | piexifjs | Read/write GPS, keywords, descriptions |
| **ZIP** | JSZip | Client-side ZIP archive creation |
| **Upload** | React-Dropzone | Drag-and-drop file handling |
| **HEIC** | heic2any | iPhone HEIC → JPEG conversion |
| **PWA** | vite-plugin-pwa | Offline support, installable app |
| **Deploy** | GitHub Pages + Actions | CI/CD auto-deploy on push |

---

## 📁 Project Structure

```
geotag-studio/
├── src/
│   ├── App.jsx                              # Root layout, routing, modals
│   ├── main.jsx                             # Entry point
│   ├── index.css                            # Design system (dark/light themes)
│   │
│   ├── context/
│   │   └── store.js                         # Zustand store (images, GPS, metadata)
│   │
│   ├── utils/
│   │   └── exif.js                          # EXIF read/write, GPS conversion, UTF-16LE encoding
│   │
│   ├── hooks/
│   │   ├── useImageLoader.js                # File upload + EXIF extraction
│   │   ├── useProcessor.js                  # Batch EXIF embedding with progress
│   │   └── useToast.js                      # Toast notification state
│   │
│   ├── components/
│   │   ├── AltTextPanel.jsx                 # Per-image alt text editor (priority feature)
│   │   ├── BulkMetadataEditor.jsx           # Batch metadata modal
│   │   ├── CsvImporter.jsx                  # CSV/GPX import modal
│   │   ├── HelpModal.jsx                    # In-app documentation
│   │   ├── ProgressModal.jsx                # Processing progress dialog
│   │   ├── Sidebar.jsx                      # Navigation + stats
│   │   ├── ThemeToggle.jsx                  # Dark / Light / System toggle
│   │   └── Toast.jsx                        # Toast container
│   │
│   ├── features/
│   │   ├── uploader/Uploader.jsx            # Drag & drop upload zone
│   │   ├── metadata-editor/
│   │   │   ├── ImageGrid.jsx                # Image gallery with selection
│   │   │   └── MetadataEditorPanel.jsx      # GPS + metadata editor panel
│   │   ├── map-picker/MapPicker.jsx         # Full-screen map picker modal
│   │   └── export/ExportView.jsx            # Export & download view
│   │
│   └── animations/
│       └── variants.js                      # Framer Motion animation presets
│
├── .github/workflows/deploy.yml             # GitHub Actions auto-deploy
├── index.html                               # HTML entry with SEO meta tags
├── vite.config.js                           # Vite + PWA + GitHub Pages config
├── tailwind.config.js                       # Tailwind with CSS variable theming
├── postcss.config.js                        # PostCSS config
└── package.json                             # Dependencies & scripts
```

---

## 🌐 Deploying to GitHub Pages

GeoTag Studio is pre-configured for GitHub Pages deployment. Here's how to make it live:

### Option A — Automatic (GitHub Actions)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that auto-deploys on every push to `main`.

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Set branch to `gh-pages` and folder to `/ (root)`
4. Click **Save**
5. Every push to `main` will automatically build and deploy

Your site will be live at: **https://balramsharma1725.github.io/GeoTag-Studio/**

### Option B — Manual Deploy

```bash
cd geotag-studio

# Build the production bundle
npm run build

# Deploy to GitHub Pages
npm run deploy
```

This uses the `gh-pages` package to push the `dist/` folder to the `gh-pages` branch.

---

## 🐛 Troubleshooting

<details>
<summary><strong>Images not processing?</strong></summary>

- Open browser DevTools (F12) and check for console errors
- Ensure file format is supported (JPG, PNG, WEBP, HEIC)
- Verify coordinates are valid: Latitude (-90 to 90), Longitude (-180 to 180)
- Non-JPEG files are converted to JPEG for GPS embedding
</details>

<details>
<summary><strong>Map not loading?</strong></summary>

- Map tiles require an internet connection (first load)
- After first visit, tiles are cached offline via Service Worker
- Try clearing browser cache and refreshing
</details>

<details>
<summary><strong>HEIC files not converting?</strong></summary>

- HEIC conversion requires the `heic2any` library (included)
- Very large HEIC files may take a few seconds to convert
- If conversion fails, the file is skipped with a warning toast
</details>

<details>
<summary><strong>Download not working?</strong></summary>

- Check that pop-ups are not blocked by your browser
- Try downloading individual files instead of ZIP
- Ensure sufficient disk space for the ZIP archive
</details>

---

## 📈 Impact & Real-World Applications

### 🔍 Local SEO Boost
Google's search algorithm uses EXIF geotags to rank images in local search results. A restaurant that geotags its food photos with its business address will rank higher in "restaurants near me" image searches. **GeoTag Studio makes this possible for anyone — for free.**

### ♿ Web Accessibility
The Web Content Accessibility Guidelines (WCAG) require all images to have meaningful ALT text. GeoTag Studio's per-image ALT text editor with character counter and bulk-fill makes it easy to add accessibility metadata to hundreds of images at once — then export them with the ALT text embedded in EXIF.

### 📰 Photojournalism & Research
Geotagged photographs serve as evidence of location and time. Researchers, journalists, and NGOs can use GeoTag Studio to document where and when photos were taken, creating a verifiable metadata trail — all without trusting a third-party cloud service.

### 🏢 Enterprise & Team Workflows
With CSV import, teams can prepare metadata in a spreadsheet and batch-apply it to thousands of images. This is invaluable for:
- Real estate listings requiring GPS-tagged property photos
- E-commerce product catalogs needing consistent metadata
- Media archives that need retroactive geotagging

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Commit your changes**: `git commit -m "Add my feature"`
4. **Push to your fork**: `git push origin feature/my-feature`
5. **Open a Pull Request**

---

## 📝 License

This project is licensed under the **MIT License** — free to use, modify, and distribute.

---

<div align="center">

### Built with ❤️ by [Balram Sharma](https://github.com/BalramSharma1725)

**[⭐ Star this repo](https://github.com/BalramSharma1725/GeoTag-Studio)** if you find it useful!

**Happy Geotagging! 📸🗺️**

</div>
