# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-1-6

### Added

- Option to use a file property instead of the note name.

## [1.3.0] - 2025-9-10

### Added

- Option to ignore links for embedded files. On by default.

### Fixed

- Minor performance improvements.

## [1.2.1] - 2025-3-4

### Fixed

- If a suggestion is selected, the suggestion window will disappear until the next editor change.
- Separator warning will appear until clicked or the problematic characters are removed, and only instance of this warning will appear at a time.

## [1.2.0] - 2025-2-25

### Added

- Display text suggestions. A suggestions popup will appear when the cursor is directly after an anchor link with display text. There will be three suggestions one, for each of the display text formats that can be used with this plugin (no note name, note name and then heading(s), heading(s) and then note name).

### Changed

- Heading separators are now validated to not include link breaking characters `[]|#^`. If any of these characters are typed into the separator field, the character will be ignored and a warning will appear.

### Fixed

- `^` character will not be included in the display text when linking to a block.
- Minor typos.

## [1.1.0] - 2025-1-25

### Removed

- Option to change the text content of notifications.

## [1.0.1] - 2024-12-30

### Fixed

- In the plugin options menu, the notification text setting will appear conditionally based on if notifications are enabled.

## [1.0.0] - 2024-12-1

### Changed

- Name of plugin and related class names changed to use the phrase "anchor links", as this is what they are referred to in th Obsidian docs.

### Fixed

- Headings in settings tab follow Obsidian guidelines.

## [0.2.0] - 2024-11-29

### Added

- Option to pick which headings to include in link display text when linking to multiple headings.
- Options to change where the note name goes in relation to the headings in the link display text.
- Option to change the message of the optional notice that appears whenever the plugin auto changes the display text.

### Fixed

- Incorrect display text when the link includes multiple headings.
