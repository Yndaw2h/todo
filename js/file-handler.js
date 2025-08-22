/**
 * File Handler for managing file uploads, previews, and editing
 * Handles all file-related operations including images and text files
 */

class FileHandler {
    constructor() {
        this.currentFileContent = null;
        this.originalFileContent = null;
        this.fileEditMode = false;
        this.editingFileInContent = new Map(); // Track file editing states for content items
        
        // DOM elements
        this.fileInput = document.getElementById('fileInput');
        this.filePreview = document.getElementById('filePreview');
        this.fileName = document.getElementById('fileName');
        this.fileType = document.getElementById('fileType');
        this.fileContent = document.getElementById('fileContent');
        this.fileInfo = document.getElementById('fileInfo');
    }

    /**
     * Initialize file handler and bind events
     */
    init() {
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e);
            });
        }
    }

    /**
     * Handle file selection from input
     * @param {Event} event - File input change event
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) {
            this.clearFilePreview();
            return;
        }

        // Check if it's an image
        const isImage = file.type.startsWith('image/');
        
        if (isImage) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentFileContent = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: e.target.result,
                    extension: file.name.split('.').pop()?.toLowerCase() || 'img',
                    isImage: true
                };
                this.originalFileContent = { ...this.currentFileContent };
                this.fileEditMode = false;
                this.showFilePreview();
            };
            reader.readAsDataURL(file);
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.currentFileContent = {
                    name: file.name,
                    type: file.type || 'text/plain',
                    size: file.size,
                    content: e.target.result,
                    extension: file.name.split('.').pop()?.toLowerCase() || 'txt',
                    isImage: false
                };
                this.originalFileContent = { ...this.currentFileContent };
                this.fileEditMode = false;
                this.showFilePreview();
            };
            reader.onerror = () => {
                Utils.showToast('Error reading file. Please try again.');
                this.clearFilePreview();
            };
            reader.readAsText(file);
        }
    }

    /**
     * Show file preview with edit capabilities
     */
    showFilePreview() {
        if (!this.currentFileContent) return;

        const { name, content, size, extension, isImage } = this.currentFileContent;
        
        this.fileType.textContent = extension.toUpperCase();
        
        if (isImage) {
            this.fileName.innerHTML = `
                <input type="text" value="${Utils.escapeHtml(name)}" onchange="fileHandler.updateFileName(this.value)">
            `;
            this.fileContent.innerHTML = `
                <img src="${content}" alt="${Utils.escapeHtml(name)}" class="image-preview">
            `;
            this.fileInfo.innerHTML = `
                ${Utils.formatFileSize(size)} • Image
                <div class="file-edit-hint">You can rename this image file above</div>
            `;
        } else {
            this.fileName.innerHTML = `
                <input type="text" value="${Utils.escapeHtml(name)}" onchange="fileHandler.updateFileName(this.value)">
            `;
            this.renderFileContent();
            this.updateFileInfo();
        }
        
        this.filePreview.classList.add('active');
        this.filePreview.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Render file content with edit/preview modes
     */
    renderFileContent() {
        if (!this.currentFileContent || this.currentFileContent.isImage) return;

        const { content } = this.currentFileContent;
        
        if (this.fileEditMode) {
            this.fileContent.innerHTML = `
                <div style="position: relative;">
                    <textarea class="file-content-editable" id="fileContentEditor" placeholder="Edit your file content...">${Utils.escapeHtml(content)}</textarea>
                    <div class="file-edit-actions">
                        <button class="file-action-btn file-save-btn" onclick="fileHandler.saveFileEdit()">💾 Save Changes</button>
                        <button class="file-action-btn file-reset-btn" onclick="fileHandler.resetFileContent()">↺ Reset</button>
                        <button class="file-action-btn file-cancel-btn" onclick="fileHandler.cancelFileEdit()">✕ Cancel</button>
                    </div>
                </div>
            `;
            
            // Auto-resize textarea
            const textarea = document.getElementById('fileContentEditor');
            if (textarea) {
                Utils.autoResizeTextarea(textarea);
                textarea.focus();
            }
        } else {
            const previewContent = content.length > 2000 ? content.substring(0, 2000) + '...' : content;
            this.fileContent.innerHTML = `
                <div style="position: relative;">
                    <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${Utils.escapeHtml(previewContent)}</pre>
                    <button class="file-edit-toggle" onclick="fileHandler.toggleFileEdit()">✏️ Edit Content</button>
                </div>
            `;
        }
    }

    /**
     * Update file info display
     */
    updateFileInfo() {
        if (!this.currentFileContent || this.currentFileContent.isImage) return;

        const { content, size } = this.currentFileContent;
        const lines = content.split('\n').length;
        const chars = content.length;
        
        this.fileInfo.innerHTML = `
            ${Utils.formatFileSize(size)} • ${lines} lines • ${chars} characters
            <div class="file-edit-hint">Click "Edit Content" to modify the file content before adding</div>
        `;
    }

    /**
     * Toggle file edit mode
     */
    toggleFileEdit() {
        if (!this.currentFileContent || this.currentFileContent.isImage) return;
        
        this.fileEditMode = !this.fileEditMode;
        this.renderFileContent();
        this.updateFileInfo();
    }

    /**
     * Save file content changes
     */
    saveFileEdit() {
        const editor = document.getElementById('fileContentEditor');
        if (!editor || !this.currentFileContent) return;

        const newContent = editor.value;
        
        // Update current file content
        this.currentFileContent.content = newContent;
        this.currentFileContent.size = new Blob([newContent]).size;
        
        // Exit edit mode
        this.fileEditMode = false;
        this.renderFileContent();
        this.updateFileInfo();
        
        Utils.showToast('File content updated!');
    }

    /**
     * Reset file content to original
     */
    resetFileContent() {
        if (!this.originalFileContent) return;
        
        // Reset to original content
        this.currentFileContent.content = this.originalFileContent.content;
        this.currentFileContent.size = this.originalFileContent.size;
        
        // Refresh the edit view
        this.renderFileContent();
        this.updateFileInfo();
        
        Utils.showToast('File content reset to original!');
    }

    /**
     * Cancel file editing
     */
    cancelFileEdit() {
        this.fileEditMode = false;
        this.renderFileContent();
        this.updateFileInfo();
    }

    /**
     * Update file name
     * @param {string} newName - New file name
     */
    updateFileName(newName) {
        if (!this.currentFileContent || !newName.trim()) return;
        
        const trimmedName = newName.trim();
        this.currentFileContent.name = trimmedName;
        
        // Update extension if it changed
        const newExtension = trimmedName.split('.').pop()?.toLowerCase();
        if (newExtension && newExtension !== trimmedName) {
            this.currentFileContent.extension = newExtension;
            this.fileType.textContent = newExtension.toUpperCase();
        }
    }

    /**
     * Clear file preview and reset state
     */
    clearFilePreview() {
        this.currentFileContent = null;
        this.originalFileContent = null;
        this.fileEditMode = false;
        this.filePreview.classList.remove('active');
        this.fileInput.value = '';
    }

    /**
     * Show file editor for content items
     * @param {number} contentId - Content ID
     * @param {Object} fileData - File data
     */
    showFileEditor(contentId, fileData) {
        const contentElement = document.querySelector(`[data-content-id="${contentId}"]`);
        const fileEditor = contentElement?.querySelector('.file-editor-section');
        if (!fileEditor || !fileData || fileData.isImage) return;

        const fileContentDiv = fileEditor.querySelector('.file-content');
        const editButton = fileEditor.querySelector('.edit-file-btn');
        
        if (this.editingFileInContent.get(contentId)) {
            // Show editor
            fileContentDiv.innerHTML = `
                <textarea class="file-content-editable" id="fileEditor_${contentId}" style="width: 100%; min-height: 200px;">${Utils.escapeHtml(fileData.content)}</textarea>
                <div class="file-edit-actions">
                    <button class="file-action-btn file-save-btn" onclick="fileHandler.saveContentFileEdit(${contentId})">💾 Save File</button>
                    <button class="file-action-btn file-cancel-btn" onclick="fileHandler.cancelContentFileEdit(${contentId})">✕ Cancel</button>
                </div>
            `;
            editButton.textContent = 'Cancel Edit';
            editButton.style.background = 'rgba(207, 102, 121, 0.2)';
            editButton.style.color = '#cf6679';
            editButton.style.borderColor = 'rgba(207, 102, 121, 0.3)';
            
            // Auto-resize textarea
            const textarea = document.getElementById(`fileEditor_${contentId}`);
            if (textarea) {
                Utils.autoResizeTextarea(textarea);
            }
        } else {
            // Show preview
            const previewContent = fileData.content.length > 1000 ? fileData.content.substring(0, 1000) + '...' : fileData.content;
            fileContentDiv.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${Utils.escapeHtml(previewContent)}</pre>`;
            editButton.textContent = '✏️ Edit File';
            editButton.style.background = 'rgba(100, 255, 218, 0.2)';
            editButton.style.color = '#64ffda';
            editButton.style.borderColor = 'rgba(100, 255, 218, 0.3)';
        }
    }

    /**
     * Toggle content file edit mode
     * @param {number} contentId - Content ID
     */
    toggleContentFileEdit(contentId) {
        const isEditing = this.editingFileInContent.get(contentId);
        this.editingFileInContent.set(contentId, !isEditing);
        
        // Get content data to pass to showFileEditor
        if (window.projectManager) {
            window.projectManager.db.getProjectContent(window.projectManager.currentProject.id).then(projectContent => {
                const content = projectContent.find(c => c.id === contentId);
                if (content && content.file) {
                    this.showFileEditor(contentId, content.file);
                }
            });
        }
    }

    /**
     * Save content file edit
     * @param {number} contentId - Content ID
     */
    async saveContentFileEdit(contentId) {
        if (!window.projectManager) return;

        try {
            const textarea = document.getElementById(`fileEditor_${contentId}`);
            if (!textarea) return;

            const projectContent = await window.projectManager.db.getProjectContent(window.projectManager.currentProject.id);
            const content = projectContent.find(c => c.id === contentId);
            if (!content || !content.file) return;

            const newFileContent = textarea.value;
            
            // Update file content
            content.file.content = newFileContent;
            content.file.size = new Blob([newFileContent]).size;
            content.updatedAt = new Date().toISOString();

            await window.projectManager.db.saveContent(content);
            
            // Exit edit mode
            this.editingFileInContent.set(contentId, false);
            
            // Refresh the content display
            await window.projectManager.updateProjectDetail();
            
            Utils.showToast('File content saved!');
        } catch (error) {
            console.error('Error saving file content:', error);
            Utils.showToast('Failed to save file content.');
        }
    }

    /**
     * Cancel content file edit
     * @param {number} contentId - Content ID
     */
    async cancelContentFileEdit(contentId) {
        this.editingFileInContent.set(contentId, false);
        
        // Get content data and refresh file editor
        if (window.projectManager) {
            try {
                const projectContent = await window.projectManager.db.getProjectContent(window.projectManager.currentProject.id);
                const content = projectContent.find(c => c.id === contentId);
                if (content && content.file) {
                    this.showFileEditor(contentId, content.file);
                }
            } catch (error) {
                console.error('Error canceling file edit:', error);
            }
        }
    }

    /**
     * Copy file content to clipboard
     * @param {number} contentId - Content ID
     */
    async copyFileContent(contentId) {
        if (!window.projectManager) return;

        try {
            const projectContent = await window.projectManager.db.getProjectContent(window.projectManager.currentProject.id);
            const content = projectContent.find(c => c.id === contentId);
            if (!content || !content.file || content.file.isImage) return;

            const success = await Utils.copyToClipboard(content.file.content);
            if (success) {
                Utils.showToast('File content copied to clipboard!');
            } else {
                Utils.showToast('Failed to copy file content.');
            }
        } catch (error) {
            console.error('Error copying file content:', error);
            Utils.showToast('Failed to copy file content.');
        }
    }

    /**
     * Download file from content
     * @param {number} contentId - Content ID
     */
    async downloadFile(contentId) {
        if (!window.projectManager) return;

        try {
            const projectContent = await window.projectManager.db.getProjectContent(window.projectManager.currentProject.id);
            const content = projectContent.find(c => c.id === contentId);
            if (!content || !content.file) return;

            const { name, content: fileContent, type, isImage } = content.file;
            
            const success = Utils.downloadFile(name, fileContent, type, isImage);
            if (success) {
                Utils.showToast(`${name} downloaded!`);
            } else {
                Utils.showToast('Failed to download file.');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            Utils.showToast('Failed to download file.');
        }
    }

    /**
     * Get current file content
     * @returns {Object|null} - Current file content object
     */
    getCurrentFileContent() {
        return this.currentFileContent;
    }

    /**
     * Clear all editing states
     */
    clearEditingStates() {
        this.editingFileInContent.clear();
        this.fileEditMode = false;
    }
}
