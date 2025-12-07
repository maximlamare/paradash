# Assets Directory

This directory contains static assets for the ParaDash application.

## Images

### logo.svg
- **Location**: `/public/images/logo.svg`
- **Usage**: Main application logo displayed in the header
- **Format**: SVG (scalable vector graphics)
- **Colors**: White (designed for dark backgrounds)
- **Dimensions**: 200x60 viewBox, responsive scaling

## Logo Guidelines

The ParaDash logo features:
- A stylized paraglider wing shape
- Simple line representation of paraglider strings
- Small pilot/harness indicator
- Clean, minimal design suitable for the application header

### Usage
```html
<img src="/images/logo.svg" alt="ParaDash Logo" class="logo" />
```

### Customization
To replace with your own logo:
1. Place your logo file in `/public/images/`
2. Update the `src` attribute in `App.vue`
3. Adjust the CSS `.logo` class for proper sizing
4. Update the favicon reference in `index.html`

The logo should work well on the green gradient background (#53b889 to #3a9b63).
