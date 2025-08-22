/**
 * Main application initialization and global object setup
 * Entry point for the Ideas & Projects Manager application
 */

// Global instances for easy access from inline event handlers
let projectManager;
let fileHandler;

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        // Create main instances
        projectManager = new ProjectManager();
        fileHandler = projectManager.fileHandler;

        // Make instances globally accessible for inline event handlers
        window.projectManager = projectManager;
        window.fileHandler = fileHandler;

        // Initialize the application
        await projectManager.init();

        console.log('Ideas & Projects Manager initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(207, 102, 121, 0.9);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3 style="margin-bottom: 10px;">Application Error</h3>
            <p>Failed to initialize the application. Please refresh the page and try again.</p>
            <button onclick="location.reload()" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 6px;
                cursor: pointer;
            ">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

/**
 * Handle application cleanup on page unload
 */
function cleanupApp() {
    // Clear any ongoing file operations
    if (fileHandler) {
        fileHandler.clearFilePreview();
        fileHandler.clearEditingStates();
    }
    
    // Clear current project state
    if (projectManager) {
        projectManager.currentProject = null;
    }
}

/**
 * Handle visibility change (page hidden/shown)
 */
function handleVisibilityChange() {
    if (document.hidden) {
        // Page is hidden - could pause any ongoing operations
        console.log('Application hidden');
    } else {
        // Page is visible - could resume operations or refresh data
        console.log('Application visible');
    }
}

/**
 * Global error handler for unhandled promises
 */
function handleUnhandledRejection(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Show user-friendly error message for database-related errors
    if (event.reason && event.reason.name === 'InvalidStateError') {
        Utils.showToast('Database connection lost. Please refresh the page.');
    } else {
        Utils.showToast('An unexpected error occurred. Please try again.');
    }
}

/**
 * Global error handler for uncaught errors
 */
function handleError(event) {
    console.error('Uncaught error:', event.error);
    Utils.showToast('An error occurred. Please try again.');
}

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
    // Application lifecycle events
    window.addEventListener('beforeunload', cleanupApp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Global error handlers
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    // Prevent accidental navigation away from app
    window.addEventListener('beforeunload', (event) => {
        // Only show warning if there are unsaved changes
        if (projectManager && projectManager.fileHandler && 
            (projectManager.fileHandler.fileEditMode || 
             projectManager.fileHandler.editingFileInContent.size > 0)) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return event.returnValue;
        }
    });
}

/**
 * Initialize the application when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupGlobalEventListeners();
        initializeApp();
    });
} else {
    // DOM is already loaded
    setupGlobalEventListeners();
    initializeApp();
}

/**
 * Export for potential module usage
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        projectManager,
        fileHandler,
        initializeApp
    };
}
