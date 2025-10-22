# Change Log

All notable changes to the "class-stripper" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.0.0] - 2025-10-22

### Added
- **New `cleanHtml` API** with comprehensive configuration options
- **Extended attribute stripping capabilities:**
  - Strip IDs (`stripIds`)
  - Strip data attributes (`stripDataAttributes`)
  - Strip event handlers (`stripEventHandlers`) - onclick, onmouseover, etc.
  - Strip ARIA attributes (`stripAriaAttributes`)
- **Class preservation with whitelist:**
  - Preserve specific classes by name
  - Preserve classes matching regex patterns
  - Mix string and regex patterns in whitelist
- **Tag removal:** Remove unwanted tags like script, style, svg, etc.
- **HTML optimization:**
  - Remove empty div elements
  - Bubble up unnecessary wrapper divs
  - Configurable optimization passes
- **HTML beautification:**
  - Automatic code formatting with js-beautify
  - Configurable indentation size
  - Optional newline preservation
- **Statistics tracking:**
  - Count of removed classes, IDs, styles, and other attributes
  - Count of removed tags
  - Count of empty divs removed
  - Count of wrapper divs bubbled up
  - Total elements processed
- **User feedback:** Extension now displays statistics after cleaning (e.g., "Removed 5 classes, 2 styles, 1 empty div")
- **Comprehensive test suite:** Added 20+ unit tests covering all new features

### Changed
- Updated helper.js with all improvements from tailwind-stripper repository
- Enhanced extension.js to use new API and display cleaning statistics to users
- Added js-beautify dependency for HTML formatting
- Improved error handling throughout the codebase

### Maintained
- **Full backward compatibility:** All legacy API functions (`stripClasses`, `stripStyles`, `stripAll`, `stripHtml`) continue to work exactly as before
- All existing tests pass without modification

### Technical Details
- Major version bump (2.0.0) due to significant new features
- All new features are opt-in via configuration options
- Default behavior maintains backward compatibility
- Robust error handling for edge cases

## [1.0.3] - Previous Release

- Stable release with basic class and style stripping functionality
