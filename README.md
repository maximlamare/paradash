# ParaDash

<p align="center">
  <img src="public/images/logo.svg" alt="ParaDash" width="100">
</p>

A comprehensive paragliding and speedflying flight logbook mobile application with advanced statistics, gear management, and IGC flight track visualization.

## Overview

ParaDash is a native mobile application designed for paraglider and speedflying pilots. It provides a complete solution for logging flights, managing gear, tracking maintenance, and analyzing your flying statistics over time - all stored securely on your device.

## Features


## Platform Support

- **Android**: ✅ Fully supported (Android 6.0+)

## Development Setup

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Android Studio** (for Android development)
- **Java JDK** (version 17 recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd paradash
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the web assets**
   ```bash
   npm run build
   ```

4. **Sync with native platforms**
   ```bash
   npx cap sync
   ```

### Development Workflow

#### Run in development mode (web preview)
```bash
npm run dev
```
This starts a development server at `http://localhost:5173` for quick testing.

#### Build and deploy to Android
```bash
# Build the app
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then use Android Studio to run the app on an emulator or connected device.

### Building for Production

1. **Build the web assets**
   ```bash
   npm run build
   ```

2. **Sync with native platforms**
   ```bash
   npx cap sync
   ```

3. **Open native IDE**
   ```bash
   # For Android
   npx cap open android
   ```

4. **Build the APK/AAB in Android Studio**
   - For testing: Build > Build Bundle(s) / APK(s) > Build APK(s)
   - For release: Build > Generate Signed Bundle / APK

## Architecture

### Tech Stack

- **Framework**: Vue.js 3 (Composition API)
- **Mobile Runtime**: Capacitor 7
- **Database**: SQLite (via @capacitor-community/sqlite)
- **Routing**: Vue Router
- **File Storage**: Capacitor Filesystem API
- **Maps**: Leaflet.js with OpenTopoMap tiles
- **IGC Parsing**: igc-parser
- **Build Tool**: Vite

### Project Structure

```
paradash/
├── android/              # Android native project
├── public/               # Static assets
├── src/
│   ├── components/       # Vue components
│   │   ├── AddFlight.vue
│   │   ├── FlightsList.vue
│   │   ├── FlightDetail.vue
│   │   ├── GearOverview.vue
│   │   ├── GearDetail.vue
│   │   ├── Statistics.vue
│   │   └── Settings.vue
│   ├── database/         # Database modules
│   │   ├── database.js
│   │   └── capacitorDatabase.js
│   ├── utils/           # Utility functions
│   ├── data/            # Static data (countries, etc.)
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── capacitor.config.json
├── vite.config.js
└── package.json
```

## Data Storage

All data is stored locally on your device using:
- **SQLite Database**: Flight logs, gear inventory, and maintenance records
- **Filesystem**: IGC files and PDF attachments

### Backup & Restore

The app includes comprehensive backup functionality:
- Export all data as a single ZIP file
- Includes database, IGC files, and PDF attachments
- Import to restore on new device or after reinstallation

## Security & Privacy

- ✅ **100% Offline**: No internet connection required (except for map tiles)
- ✅ **No Cloud**: All data stays on your device
- ✅ **No Analytics**: No tracking or telemetry
- ✅ **No Accounts**: Single-user app, no authentication required
- ✅ **Local Storage**: Complete control over your data

## Performance

- Fast startup time (< 2 seconds on modern devices)
- Efficient SQLite queries with proper indexing
- Optimized rendering for large flight lists
- Minimal battery impact
- Small app size (< 10MB)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on Android
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Known Issues

- iOS version is in development
- Map tiles require internet connection
- Some Android devices may require storage permissions

## Future Plans

- [ ] iOS support
- [ ] Offline map caching
- [ ] XContest API integration
- [ ] Flight sharing functionality
- [ ] Dark mode support
- [ ] Multi-language support

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Contact: [your-email@example.com]

Happy Flying!
