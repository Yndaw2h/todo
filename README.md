# Ideas & Projects Manager

A modern, feature-rich desktop application for organizing your ideas and projects with file attachments, built with Electron and vanilla JavaScript.

## 🚀 Features

- **Project Management**: Create, edit, and organize projects
- **Idea Tracking**: Add text ideas with rich link support  
- **File Attachments**: Support for images and text files with inline editing
- **Persistent Storage**: All data stored locally using IndexedDB
- **Modern UI**: Beautiful dark theme with glassmorphism design
- **Keyboard Shortcuts**: Efficient navigation and editing
- **Search & Filter**: Quick access to your content

## 📁 Project Structure

```
├── main.js                    # Electron main process
├── index.html                 # Main HTML template
├── styles/
│   └── main.css              # All CSS styles
├── js/
│   ├── app.js                # Application initialization
│   ├── database.js           # IndexedDB database manager
│   ├── utils.js              # Utility functions
│   ├── file-handler.js       # File operations and editing
│   └── project-manager.js    # Main application logic
└── README.md                 # This file
```

## 🔧 Architecture

### Core Classes

#### `DatabaseManager` (`js/database.js`)
- Handles all IndexedDB operations
- Manages projects, content, and counters
- Provides async API for data persistence

#### `Utils` (`js/utils.js`)
- Text processing and link conversion
- File format utilities
- UI helpers (toasts, clipboard, etc.)

#### `FileHandler` (`js/file-handler.js`)
- File upload and preview
- Image and text file support
- Inline file editing capabilities
- File download and clipboard operations

#### `ProjectManager` (`js/project-manager.js`)
- Main application controller
- UI event handling
- Project and content CRUD operations
- View management

## 🎯 Key Features Explained

### Link Processing
The app automatically converts URLs and Discord-style links to clickable links:
- `text[https://example.com]` → Clickable link with "text" as display
- `[text](https://example.com)` → Markdown-style links
- `https://example.com` → Auto-detected URLs

### File Handling
- **Images**: Preview with download capability
- **Text Files**: Inline editing with syntax highlighting
- **File Operations**: Copy, download, and edit file contents
- **Supported Formats**: `.txt`, `.md`, `.js`, `.html`, `.css`, `.json`, images, and more

### Data Storage
- **IndexedDB**: Browser-native database for persistence
- **No External Dependencies**: All data stored locally
- **Automatic Backup**: Data persists across app restarts

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Start the application
npm start
```

### Development
```bash
# Run in development mode with DevTools
npm run dev
```

## 📝 Usage

### Creating Projects
1. Enter project name in the input field
2. Click "Create" or press Enter
3. Project appears in the grid

### Adding Ideas
1. Open a project by clicking on it
2. Type your idea in the text area
3. Optionally attach files using the "Add File" button
4. Click "Add Idea" or press Ctrl+Enter

### Editing Content
- **Text**: Click on any content item to edit
- **Files**: Use the "Edit File" button for inline editing
- **Save**: Click "Save" or press Ctrl+Enter
- **Cancel**: Click "Cancel" or press Escape

### Keyboard Shortcuts
- `Ctrl + /`: Focus project input
- `Ctrl + Enter`: Submit forms
- `Escape`: Cancel editing or go back
- Click to edit content items

## 🔧 Customization

### Styling
Modify `styles/main.css` to customize the appearance:
- Color schemes in CSS custom properties
- Layout adjustments in grid and flexbox sections
- Responsive design in media queries

### Features
Extend functionality by:
- Adding new content types in `FileHandler`
- Implementing search in `ProjectManager`
- Adding export/import in `DatabaseManager`

## 🐛 Troubleshooting

### Database Issues
- Clear browser storage if data corruption occurs
- Check browser console for IndexedDB errors

### File Upload Problems
- Verify file types are in the accepted list
- Check file size limitations

### Performance
- Large files may impact performance
- Consider implementing file size limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Modern CSS techniques for glassmorphism design
- IndexedDB for robust local storage
- Electron for cross-platform desktop support
