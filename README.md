🗺️ GeoTag Studio — Bulk GPS & Metadata Editor
A production-ready web application for bulk editing GPS coordinates and EXIF metadata in images. All processing happens locally in your browser — no server required, no data uploads.

Version License React Vite

✨ Features
📸 Image Support
Format Support: JPG, JPEG, PNG, WEBP
Drag & Drop Upload — Multi-file upload interface
Batch Processing — Process multiple images at once
🗺️ GPS Editing
EXIF GPS Reading — Auto-detects existing GPS coordinates from images
Manual Input — Edit latitude/longitude with real-time validation
Interactive Map Picker — Click on map to select precise coordinates (Leaflet + OpenStreetMap)
Default Coordinates — Pre-configured default location (Siliguri, India: 26.716515°N, 88.421799°E)
Validation — Full coordinate range checking (-90 to 90 lat, -180 to 180 lng)
📝 Metadata Management
Image Description — Embed custom image descriptions
Keywords — Add searchable keywords/tags (XP Keywords + User Comment fields)
Alt Text — Add alternative text for accessibility
Multi-Field Support — Store metadata in multiple EXIF formats for maximum compatibility
🎯 Editing Controls
Bulk Apply — Apply GPS/metadata to current/selected/all images
Undo/Reset — Revert changes per individual image
Multi-select — Checkbox selection with batch operations
Before/After Comparison — View original vs. edited EXIF data
📦 Export & Download
ZIP Export — Download all edited images in a single ZIP file
Selective Export — Choose to download all images or edited-only
Format Preservation — Original image formats maintained (JPG→JPG, PNG→PNG, etc.)
🎨 User Interface
Dark Mode UI — Modern, easy-on-the-eyes design
Responsive Layout — Works on desktop and tablet
Smooth Animations — Framer Motion transitions and micro-interactions
Real-time Progress — Live progress indicator during batch processing
Toast Notifications — User feedback for all actions
🔒 Privacy & Performance
Browser-Based Processing — No server uploads, all processing is client-side
Fast Processing — Optimized EXIF embedding with real-time validation
No Data Tracking — Completely private, no telemetry
🚀 Quick Start
Prerequisites
Node.js 16+
npm or yarn
Installation
# Navigate to project directory
cd geotag-studio

# Install dependencies
npm install

# Start development server
npm run dev
Then open your browser to: http://localhost:5173

Production Build
# Create optimized build
npm run build

# Preview production build locally
npm run preview
Compiled files will be in the dist/ directory.

🧩 Tech Stack
Frontend Framework
React 18 — UI library with hooks
Vite 5 — Lightning-fast bundler and dev server
Node.js — JavaScript runtime
Styling & Animation
Tailwind CSS — Utility-first CSS framework
PostCSS — CSS transformation
Framer Motion — Advanced animations and transitions
State Management
Zustand — Lightweight state management (images, selections, GPS data)
Map & Location
Leaflet — Interactive map library
React-Leaflet — React bindings for Leaflet
OpenStreetMap — Free map tiles provider
EXIF & Image Processing
piexifjs — JavaScript EXIF reader/writer
Reads existing GPS/metadata from images
Writes new GPS coordinates to EXIF
Embeds metadata fields (ImageDescription, XPKeywords, XPComment, UserComment)
UTF-16LE encoding support for Windows EXIF fields
File Operations
JSZip — Create ZIP files in browser
React-Dropzone — Drag-and-drop file upload
📁 Project Structure
geotag-studio/
├── src/
│   ├── App.jsx                    # Main app component
│   ├── main.jsx                   # Entry point
│   ├── index.css                  # Global styles
│   │
│   ├── components/                # Reusable UI components
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── Toast.jsx             # Toast notifications
│   │   ├── MetadataEditorPanel.jsx
│   │   └── ProgressModal.jsx      # Batch processing progress
│   │
│   ├── features/                  # Feature-specific components
│   │   ├── uploader/
│   │   │   └── Uploader.jsx      # File upload interface
│   │   ├── metadata-editor/
│   │   │   ├── ImageGrid.jsx     # Image gallery/grid view
│   │   │   └── MetadataEditorPanel.jsx  # Edit GPS & metadata
│   │   ├── map-picker/
│   │   │   └── MapPicker.jsx     # Interactive map selector
│   │   └── export/
│   │       └── ExportView.jsx    # ZIP export download
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useImageLoader.js     # File upload handler
│   │   ├── useProcessor.js       # Batch EXIF processing
│   │   └── useToast.js           # Toast notifications
│   │
│   ├── utils/                     # Utility functions
│   │   └── exif.js               # EXIF reading/writing logic
│   │                              # GPS coordinate conversion (DMS ↔ decimal)
│   │                              # Metadata encoding/decoding
│   │
│   ├── context/
│   │   └── store.js              # Zustand state store
│   │                              # Image state, selections, GPS data
│   │
│   └── animations/
│       └── variants.js            # Framer Motion animation definitions
│
├── public/                        # Static assets
├── dist/                          # Production build output
├── index.html                     # HTML entry point
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS config
├── package.json                   # Dependencies & scripts
└── README.md                      # This file
🎯 How to Use
1. Upload Images
Drag and drop images onto the upload area, or
Click to browse and select files
Supported formats: JPG, JPEG, PNG, WEBP
2. View Image Details
Images appear in a grid
Click any image to see existing EXIF/GPS data
Use the sidebar to navigate between views
3. Edit GPS Coordinates
Manual Input: Enter latitude and longitude directly
Map Picker: Click the map to select coordinates interactively
Default Location: Pre-set to Siliguri (26.716515°N, 88.421799°E)
4. Add Metadata
Description: Full image description
Keywords: Searchable tags/keywords
Alt Text: Accessibility text
5. Apply & Process
Click "Apply GPS" to embed coordinates
Select "Current Image" / "Selected" / "All Images"
Processing happens in real-time with progress indicator
6. Download
Go to Export view
Choose to download "All Images" or "Edited Only"
Images download as a ZIP file
Original formats preserved
7. Verify
Use exiftool to verify EXIF data:
exiftool downloaded-image.jpg | grep -i "gps\|keyword\|description"
🔧 Configuration
Default Coordinates
Edit the default location in:

src/features/metadata-editor/MetadataEditorPanel.jsx (React app)
gps-metadata-editor.html (Standalone HTML version)
Change these values:

const DEFAULT_LAT = 26.716515
const DEFAULT_LNG = 88.421799
const DEFAULT_ZOOM = 12
Map Settings
Leaflet/OpenStreetMap configuration in MapPicker.jsx:

const MAP_CENTER = [26.716515, 88.421799]
const MAP_ZOOM = 12
📊 EXIF Field Mapping
The tool embeds metadata in the following EXIF fields for maximum compatibility:

Data Field	EXIF Tag	Tag ID	Format	Standard
Description	ImageDescription	270	ASCII	Standard EXIF
Keywords	XPKeywords	40094	UTF-16LE	Windows EXIF
Keywords	UserComment	37510	ASCII	Standard EXIF
Alt Text	XPComment	40092	UTF-16LE	Windows EXIF
GPS Latitude	GPSLatitude	-	DMS	GPS IFD
GPS Longitude	GPSLongitude	-	DMS	GPS IFD
Note: Keywords are stored in TWO places (40094 + 37510) for maximum compatibility with different EXIF readers.

🛠️ Development
Available Scripts
# Development server with hot reload
npm run dev

# Production build (optimized)
npm run build

# Preview production build
npm run preview
Debugging
Console logging is built into the EXIF functions. Open browser DevTools (F12) to see:

EXIF embedding confirmation
GPS coordinate conversion logs
Metadata encoding/decoding details
Processing progress updates
Adding New Features
New Components: Add to src/features/ or src/components/
State Management: Update src/context/store.js (Zustand)
EXIF Operations: Add utility functions to src/utils/exif.js
Custom Hooks: Create new files in src/hooks/
🐛 Troubleshooting
Images Not Processing
Check browser console (F12) for error messages
Ensure image format is supported (JPG, PNG, WEBP)
Verify coordinates are valid (-90 to 90 lat, -180 to 180 lng)
EXIF Data Not Embedding
Console should show "piexif.dump succeeded" and "piexif.insert succeeded"
If encoding error appears, special characters are being converted to ?
Verify with: exiftool image.jpg | grep -i "gps\|keyword"
Download Not Working
Check browser's automatic download settings
Ensure pop-ups are not blocked
Try a different browser (Chrome recommended)
Map Not Loading
Verify internet connection (OpenStreetMap tiles require online)
Check browser console for CORS errors
Try refreshing the page
📝 License
MIT License - Free to use, modify, and distribute.

👨‍💻 Development Notes
Key Technologies & Why
React 18: Modern UI with hooks, great for dynamic image editing
Vite: Fast bundling, excellent dev experience
Zustand: Simple state management without boilerplate
piexifjs: Pure JavaScript EXIF handling (no server required)
Leaflet: Lightweight map library for coordinate picking
Tailwind CSS: Rapid UI development with consistent styling
Framer Motion: Smooth animations for better UX
Performance Considerations
Images are processed in-memory (no disk writes on client)
ZIP creation is streamed (efficient memory usage)
Vite builds with tree-shaking and minification
Tailwind CSS is purged to production-only classes
Browser Compatibility
Chrome/Edge 90+
Firefox 88+
Safari 14+
Requires JavaScript enabled
LocalStorage for state persistence (optional)
🚀 Future Enhancements
Potential features for future versions:

 Batch metadata templates
 GPS history/recent locations
 Image rotation/transformation before export
 Watermarking options
 Batch search-and-replace for metadata
 Coordinate import from CSV
 Dark mode toggle (currently dark-only)
 Mobile app version (React Native)
 Desktop app (Electron)
Happy geotagging! 📸🗺️
