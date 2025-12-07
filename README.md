# ParaDash

<p align="center">
  <img src="public/images/logo.svg" alt="ParaDash" width="100">
</p>

A comprehensive paragliding flight logbook application with advanced statistics, gear management, and IGC flight track visualization.

## Overview

ParaDash is a modern, full-featured flight tracking application designed for paraglider and speedflying pilots. It provides a complete solution for logging flights, managing gear, tracking maintenance, and analyzing your flying statistics over time.


## Getting Started

### Prerequisites

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd paradash2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**

   Choose one of the following options:

   #### Option A: Fresh Start (Recommended for first run)
   ```bash
   npm run fresh-start
   ```
   Starts with a completely empty database - perfect for your first flight!

   #### Option B: Regular Start
   ```bash
   npm start
   ```
   Starts with your existing data (if any).

4. **Open your browser**

   The application will automatically open at `http://localhost:5173`

   - **Frontend**: `http://localhost:5173`
   - **Backend API**: `http://localhost:3001`


## Browser Compatibility

ParaDash works best in modern browsers:

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight: ~2MB download
- Fast startup: < 1 second
- Efficient rendering: Virtual scrolling for large datasets
- Optimized database queries with indexes
- Minimal memory footprint

## Security

- No external data transmission (fully local)
- No authentication required (single-user)
- No cloud dependencies
- File upload validation
- SQL injection protection


## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database help
- Review this README for common solutions


**Happy Flying!**

