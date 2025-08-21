/**
 * Utility functions for the Project Manager application
 * Contains helper functions for text processing, formatting, and UI interactions
 */

class Utils {
    /**
     * Enhanced text processing to convert URLs and Discord-style links to clickable links
     * @param {string} text - The text to process
     * @returns {string} - HTML string with clickable links
     */
    static convertLinksToHtml(text) {
        if (!text) return '';
        
        let processedText = text;
        
        // First, handle Discord-style links: text[link] or [text](link)
        // Support both Discord format text[link] and Markdown format [text](link)
        const discordLinkRegex = /([^[\s]+)\[((?:https?:\/\/|ftp:\/\/|www\.)[^\]]+)\]/gi;
        const markdownLinkRegex = /\[([^\]]+)\]\(((?:https?:\/\/|ftp:\/\/|www\.)[^)]+)\)/gi;
        
        // Handle Discord-style: text[link]
        processedText = processedText.replace(discordLinkRegex, (match, text, url) => {
            let href = url;
            if (url.startsWith('www.')) {
                href = 'https://' + url;
            }
            
            const displayText = Utils.escapeHtml(text);
            return `<a href="${Utils.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
        });
        
        // Handle Markdown-style: [text](link)
        processedText = processedText.replace(markdownLinkRegex, (match, text, url) => {
            let href = url;
            if (url.startsWith('www.')) {
                href = 'https://' + url;
            }
            
            const displayText = Utils.escapeHtml(text);
            return `<a href="${Utils.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
        });
        
        // Then handle regular URLs (but avoid double-processing already converted links)
        const urlRegex = /(?<!href=["'])(?<!>)((?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"{}|\\^`[\]()]+)(?![^<]*<\/a>)/gi;
        
        processedText = processedText.replace(urlRegex, (url) => {
            // Skip if this URL is already part of a link
            if (processedText.indexOf(`href="${url}"`) !== -1 || processedText.indexOf(`href="https://${url}"`) !== -1) {
                return url;
            }
            
            // Add protocol if missing
            let href = url;
            if (url.startsWith('www.')) {
                href = 'https://' + url;
            }
            
            // Escape any HTML in the URL text
            const displayUrl = Utils.escapeHtml(url);
            
            return `<a href="${Utils.escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${displayUrl}</a>`;
        });
        
        return processedText;
    }

    /**
     * Escape HTML characters to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped HTML
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted file size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Convert data URL to Blob
     * @param {string} dataURL - Data URL string
     * @returns {Blob} - Blob object
     */
    static dataURLtoBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     */
    static showToast(message) {
        // Create and show a simple toast notification
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(100, 255, 218, 0.9);
            color: #000;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Copy text to clipboard with fallback
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            } catch (fallbackError) {
                console.error('Error copying text:', fallbackError);
                return false;
            }
        }
    }

    /**
     * Download file from content
     * @param {string} filename - Name of the file
     * @param {string} content - File content
     * @param {string} type - MIME type
     * @param {boolean} isImage - Whether it's an image (data URL)
     */
    static downloadFile(filename, content, type, isImage = false) {
        try {
            const blob = isImage 
                ? Utils.dataURLtoBlob(content)
                : new Blob([content], { type: type || 'text/plain' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error downloading file:', error);
            return false;
        }
    }

    /**
     * Auto-resize textarea to fit content
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {number} maxHeight - Maximum height in pixels
     */
    static autoResizeTextarea(textarea, maxHeight = 400) {
        if (!textarea) return;
        
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        
        // Add input listener for continuous resizing
        if (!textarea.hasAttribute('data-auto-resize')) {
            textarea.setAttribute('data-auto-resize', 'true');
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
            });
        }
    }

    /**
     * Debounce function to limit rapid function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Generate a simple hash for content identification
     * @param {string} content - Content to hash
     * @returns {string} - Simple hash string
     */
    static simpleHash(content) {
        let hash = 0;
        if (content.length === 0) return hash.toString();
        
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash).toString(16);
    }
}
