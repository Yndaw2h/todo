/**
 * Main Project Manager class
 * Handles project and content management, UI interactions, and data persistence
 */

class ProjectManager {
    constructor() {
        this.db = new DatabaseManager();
        this.fileHandler = new FileHandler();
        this.projects = [];
        this.currentProject = null;

        // Get DOM elements
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.projectForm = document.getElementById('projectForm');
        this.projectInput = document.getElementById('projectInput');
        this.projectsGrid = document.getElementById('projectsGrid');
        this.emptyState = document.getElementById('emptyState');
        
        this.mainView = document.getElementById('mainView');
        this.projectDetail = document.getElementById('projectDetail');
        this.backBtn = document.getElementById('backBtn');
        this.detailTitle = document.getElementById('detailTitle');
        this.detailMeta = document.getElementById('detailMeta');
        
        this.contentForm = document.getElementById('contentForm');
        this.contentInput = document.getElementById('contentInput');
        this.contentList = document.getElementById('contentList');

        // Statistics elements
        this.totalProjectsEl = document.getElementById('totalProjects');
        this.totalIdeasEl = document.getElementById('totalIdeas');
        this.recentActivityEl = document.getElementById('recentActivity');
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            this.showLoading(true);
            await this.db.init();
            await this.fileHandler.init();
            await this.loadProjects();
            this.bindEvents();
            await this.updateDisplay();
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            Utils.showToast('Failed to initialize database. Some features may not work.');
            this.showLoading(false);
        }
    }

    /**
     * Show/hide loading indicator
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        this.loadingIndicator.classList.toggle('active', show);
        this.mainView.style.display = show ? 'none' : 'block';
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Project creation
        this.projectForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.createProject();
        });

        // Content addition
        this.contentForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.addContent();
        });

        // Ctrl+Enter shortcut for adding content
        this.contentInput?.addEventListener('keydown', async (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                await this.addContent();
            }
        });

        // Back button
        this.backBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showMainView();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.projectDetail?.classList.contains('active')) {
                e.preventDefault();
                this.showMainView();
            }
            
            if (e.ctrlKey && e.key === '/' && !this.projectDetail?.classList.contains('active')) {
                e.preventDefault();
                this.projectInput?.focus();
            }
        });
    }

    /**
     * Create a new project
     */
    async createProject() {
        const projectName = this.projectInput?.value.trim();
        if (!projectName) return;

        try {
            const projectId = await this.db.getNextId('projectId');
            const newProject = {
                id: projectId,
                name: projectName,
                createdAt: new Date().toISOString()
            };

            await this.db.saveProject(newProject);
            this.projects.push(newProject);
            await this.updateDisplay();
            
            this.projectInput.value = '';
            setTimeout(() => {
                this.projectInput?.focus();
            }, 50);
        } catch (error) {
            console.error('Error creating project:', error);
            Utils.showToast('Failed to create project. Please try again.');
        }
    }

    /**
     * Add content to current project
     */
    async addContent() {
        if (!this.currentProject) return;

        const contentText = this.contentInput?.value.trim();
        const fileContent = this.fileHandler.getCurrentFileContent();
        
        if (!contentText && !fileContent) return;

        try {
            const contentId = await this.db.getNextId('contentId');
            const newContent = {
                id: contentId,
                projectId: this.currentProject.id,
                text: contentText,
                createdAt: new Date().toISOString(),
                file: fileContent ? {
                    name: fileContent.name,
                    type: fileContent.type,
                    size: fileContent.size,
                    content: fileContent.content,
                    extension: fileContent.extension,
                    isImage: fileContent.isImage || false
                } : null
            };

            await this.db.saveContent(newContent);
            await this.updateProjectDetail();
            await this.updateStatistics();
            
            // Clear form
            if (this.contentInput) this.contentInput.value = '';
            this.fileHandler.clearFilePreview();
            
            // Focus back to content input
            setTimeout(() => {
                this.contentInput?.focus();
            }, 50);
        } catch (error) {
            console.error('Error adding content:', error);
            Utils.showToast('Failed to add idea. Please try again.');
        }
    }

    /**
     * Open a project for viewing/editing
     * @param {number} projectId - Project ID
     */
    async openProject(projectId) {
        try {
            const project = await this.db.getProject(projectId);
            if (!project) return;

            this.currentProject = project;
            this.showProjectDetail();
        } catch (error) {
            console.error('Error opening project:', error);
            Utils.showToast('Failed to open project.');
        }
    }

    /**
     * Edit project name
     * @param {number} projectId - Project ID
     */
    async editProject(projectId) {
        try {
            const project = await this.db.getProject(projectId);
            if (!project) return;

            const newName = prompt('Edit project name:', project.name);
            if (newName && newName.trim()) {
                project.name = newName.trim();
                await this.db.saveProject(project);
                
                // Update local projects array
                const localProject = this.projects.find(p => p.id === projectId);
                if (localProject) {
                    localProject.name = project.name;
                }
                
                await this.updateDisplay();
                
                // Update detail view if this project is currently open
                if (this.currentProject && this.currentProject.id === projectId) {
                    this.currentProject.name = project.name;
                    if (this.detailTitle) this.detailTitle.textContent = project.name;
                }
            }
        } catch (error) {
            console.error('Error editing project:', error);
            Utils.showToast('Failed to edit project.');
        }
    }

    /**
     * Delete a project
     * @param {number} projectId - Project ID
     */
    async deleteProject(projectId) {
        try {
            if (this.currentProject && this.currentProject.id === projectId) {
                this.showMainView();
            }

            await this.db.deleteProject(projectId);
            
            // Remove from local projects array
            const projectIndex = this.projects.findIndex(p => p.id === projectId);
            if (projectIndex > -1) {
                this.projects.splice(projectIndex, 1);
            }
            
            await this.updateDisplay();
            
            setTimeout(() => {
                this.projectInput?.focus();
            }, 50);
        } catch (error) {
            console.error('Error deleting project:', error);
            Utils.showToast('Failed to delete project.');
        }
    }

    /**
     * Edit content item
     * @param {number} contentId - Content ID
     */
    async editContent(contentId) {
        if (!this.currentProject) return;

        const contentElement = document.querySelector(`[data-content-id="${contentId}"]`);
        if (!contentElement) return;

        try {
            // Get current content from database
            const projectContent = await this.db.getProjectContent(this.currentProject.id);
            const content = projectContent.find(c => c.id === contentId);
            if (!content) return;

            contentElement.classList.add('editing');
            
            const textElement = contentElement.querySelector('.content-text');
            const currentText = content.text || '';
            
            textElement.innerHTML = `
                <textarea class="content-textarea" data-original="${Utils.escapeHtml(currentText)}">${Utils.escapeHtml(currentText)}</textarea>
            `;

            const textarea = textElement.querySelector('.content-textarea');
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);

            const actionsElement = contentElement.querySelector('.content-actions');
            if (actionsElement) actionsElement.style.display = 'flex';

            Utils.autoResizeTextarea(textarea);

            // If there's a file, show file editor
            if (content.file && !content.file.isImage) {
                const fileEditor = contentElement.querySelector('.file-editor-section');
                if (fileEditor) {
                    this.fileHandler.showFileEditor(contentId, content.file);
                }
            }
        } catch (error) {
            console.error('Error editing content:', error);
            Utils.showToast('Failed to edit content.');
        }
    }

    /**
     * Save content edits
     * @param {number} contentId - Content ID
     */
    async saveContentEdit(contentId) {
        if (!this.currentProject) return;

        try {
            const projectContent = await this.db.getProjectContent(this.currentProject.id);
            const content = projectContent.find(c => c.id === contentId);
            if (!content) return;

            const contentElement = document.querySelector(`[data-content-id="${contentId}"]`);
            const textarea = contentElement?.querySelector('.content-textarea');
            if (!textarea) return;

            const newText = textarea.value.trim();

            if (!newText && !content.file) {
                alert('Content cannot be empty unless it has a file attachment!');
                return;
            }

            // Update the content
            content.text = newText;
            content.updatedAt = new Date().toISOString();

            await this.db.saveContent(content);
            
            // Clear any file editing states
            this.fileHandler.editingFileInContent.delete(contentId);
            
            await this.updateProjectDetail();
        } catch (error) {
            console.error('Error saving content:', error);
            Utils.showToast('Failed to save content.');
        }
    }

    /**
     * Cancel content editing
     * @param {number} contentId - Content ID
     */
    async cancelContentEdit(contentId) {
        // Clear any file editing states
        this.fileHandler.editingFileInContent.delete(contentId);
        // Simply re-render the project detail to reset everything
        await this.updateProjectDetail();
    }

    /**
     * Delete content item
     * @param {number} contentId - Content ID
     */
    async deleteContent(contentId) {
        if (!this.currentProject) return;

        try {
            await this.db.deleteContent(contentId);
            // Clear any file editing states
            this.fileHandler.editingFileInContent.delete(contentId);
            await this.updateProjectDetail();
            await this.updateStatistics();
        } catch (error) {
            console.error('Error deleting content:', error);
            Utils.showToast('Failed to delete content.');
        }
    }

    /**
     * Copy text content to clipboard
     * @param {number} contentId - Content ID
     */
    async copyText(contentId) {
        try {
            const projectContent = await this.db.getProjectContent(this.currentProject.id);
            const content = projectContent.find(c => c.id === contentId);
            if (!content || !content.text) return;

            const success = await Utils.copyToClipboard(content.text);
            if (success) {
                Utils.showToast('Text copied to clipboard!');
            } else {
                Utils.showToast('Failed to copy text.');
            }
        } catch (error) {
            console.error('Error copying text:', error);
            Utils.showToast('Failed to copy text.');
        }
    }

    /**
     * Show main view (project list)
     */
    showMainView() {
        if (this.mainView) this.mainView.style.display = 'block';
        this.projectDetail?.classList.remove('active');
        this.currentProject = null;
        this.fileHandler.clearFilePreview();
        this.fileHandler.clearEditingStates();
    }

    /**
     * Show project detail view
     */
    showProjectDetail() {
        if (this.mainView) this.mainView.style.display = 'none';
        this.projectDetail?.classList.add('active');
        this.updateProjectDetail();
    }

    /**
     * Update project detail view
     */
    async updateProjectDetail() {
        if (!this.currentProject) return;

        try {
            const projectContent = await this.db.getProjectContent(this.currentProject.id);
            
            if (this.detailTitle) this.detailTitle.textContent = this.currentProject.name;
            if (this.detailMeta) {
                this.detailMeta.textContent = `Created on ${Utils.formatDate(this.currentProject.createdAt)} • ${projectContent.length} ideas`;
            }

            await this.renderContent(projectContent);
        } catch (error) {
            console.error('Error updating project detail:', error);
            Utils.showToast('Failed to load project details.');
        }
    }

    /**
     * Render content list
     * @param {Array} projectContent - Array of content items
     */
    async renderContent(projectContent = null) {
        if (!this.contentList) return;
        
        this.contentList.innerHTML = '';

        try {
            if (!projectContent) {
                projectContent = await this.db.getProjectContent(this.currentProject.id);
            }

            if (projectContent.length === 0) {
                this.contentList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <div class="empty-text">No ideas yet</div>
                        <div class="empty-subtext">Add your first idea to this project!</div>
                    </div>
                `;
                return;
            }

            const sortedContent = [...projectContent].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            sortedContent.forEach(content => {
                const contentElement = this.createContentElement(content);
                this.contentList.appendChild(contentElement);
            });
        } catch (error) {
            console.error('Error rendering content:', error);
            Utils.showToast('Failed to load content.');
        }
    }

    /**
     * Create content element
     * @param {Object} content - Content data
     * @returns {HTMLElement} - Content element
     */
    createContentElement(content) {
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        contentItem.setAttribute('data-content-id', content.id);
        
        const displayDate = content.updatedAt 
            ? `Updated ${Utils.formatDate(content.updatedAt)}`
            : Utils.formatDate(content.createdAt);

        let fileSection = '';
        if (content.file) {
            const fileActionsBar = `
                <div class="content-actions-bar">
                    ${content.text ? `<button class="copy-btn" onclick="projectManager.copyText(${content.id})">📄 Copy Text</button>` : ''}
                    ${content.file.isImage ? 
                        `<button class="download-btn" onclick="fileHandler.downloadFile(${content.id})">💾 Download Image</button>` :
                        `<button class="copy-btn" onclick="fileHandler.copyFileContent(${content.id})">📄 Copy File</button>
                         <button class="download-btn" onclick="fileHandler.downloadFile(${content.id})">💾 Download File</button>`
                    }
                </div>
            `;

            if (content.file.isImage) {
                fileSection = `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <div class="content-type-tag">${content.file.extension.toUpperCase()} Image</div>
                        <div style="font-weight: 600; color: #bb86fc; margin-bottom: 8px;">${Utils.escapeHtml(content.file.name)}</div>
                        <img src="${content.file.content}" alt="${Utils.escapeHtml(content.file.name)}" class="image-preview">
                        <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); margin-top: 8px;">${Utils.formatFileSize(content.file.size)} • Image</div>
                        ${fileActionsBar}
                    </div>
                `;
            } else {
                const previewContent = content.file.content.length > 1000 ? content.file.content.substring(0, 1000) + '...' : content.file.content;
                fileSection = `
                    <div class="file-editor-section" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        <div class="file-editor-header">
                            <div class="file-editor-title">
                                <div class="content-type-tag">${content.file.extension.toUpperCase()} File</div>
                                <span style="font-weight: 600; color: #bb86fc;">${Utils.escapeHtml(content.file.name)}</span>
                            </div>
                            <button class="edit-file-btn" onclick="fileHandler.toggleContentFileEdit(${content.id})">✏️ Edit File</button>
                        </div>
                        <div class="file-content" style="background: rgba(0, 0, 0, 0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); font-family: monospace; font-size: 0.85rem; max-height: 200px; overflow-y: auto; white-space: pre-wrap;">
                            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${Utils.escapeHtml(previewContent)}</pre>
                        </div>
                        <div style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); margin-top: 8px;">${Utils.formatFileSize(content.file.size)} • ${content.file.content.split('\n').length} lines</div>
                        ${fileActionsBar}
                    </div>
                `;
            }
        }

        // Text content actions bar - always show if there's text content
        let textActionsBar = '';
        if (content.text) {
            textActionsBar = `
                <div class="content-actions-bar">
                    <button class="copy-btn" onclick="projectManager.copyText(${content.id})">📄 Copy Text</button>
                </div>
            `;
        }

        // Process text content for clickable links
        const processedText = content.text ? Utils.convertLinksToHtml(content.text) : (content.file ? 'File only content' : 'No text content');

        contentItem.innerHTML = `
            <div class="edit-hint">Click to edit</div>
            <div class="content-text">${processedText}</div>
            ${textActionsBar}
            ${fileSection}
            <div class="content-actions">
                <button class="save-btn">Save</button>
                <button class="cancel-btn">Cancel</button>
                <button class="delete-btn action-btn" style="margin-left: auto;">Delete</button>
            </div>
            <div class="content-date">${displayDate}</div>
        `;

        // Add click listener for editing (but not on links)
        contentItem.addEventListener('click', async (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || contentItem.classList.contains('editing')) {
                return;
            }
            await this.editContent(content.id);
        });

        // Add event listeners to buttons
        const saveBtn = contentItem.querySelector('.save-btn');
        const cancelBtn = contentItem.querySelector('.cancel-btn');
        const deleteBtn = contentItem.querySelector('.delete-btn');

        saveBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.saveContentEdit(content.id);
        });

        cancelBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.cancelContentEdit(content.id);
        });

        deleteBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.deleteContent(content.id);
        });

        // Add keyboard shortcuts
        contentItem.addEventListener('keydown', async (e) => {
            if (contentItem.classList.contains('editing')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    await this.cancelContentEdit(content.id);
                } else if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    await this.saveContentEdit(content.id);
                }
            }
        });

        return contentItem;
    }

    /**
     * Update main display (projects and statistics)
     */
    async updateDisplay() {
        await this.renderProjects();
        await this.updateStatistics();
        this.toggleEmptyState();
    }

    /**
     * Render projects grid
     */
    async renderProjects() {
        if (!this.projectsGrid) return;

        const existingProjects = this.projectsGrid.querySelectorAll('.project-card');
        existingProjects.forEach(project => project.remove());

        const sortedProjects = [...this.projects].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        for (const project of sortedProjects) {
            const projectElement = await this.createProjectElement(project);
            this.projectsGrid.appendChild(projectElement);
        }
    }

    /**
     * Create project element
     * @param {Object} project - Project data
     * @returns {HTMLElement} - Project element
     */
    async createProjectElement(project) {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.setAttribute('data-project-id', project.id);

        try {
            const projectContent = await this.db.getProjectContent(project.id);
            
            const previewText = projectContent.length > 0 
                ? (projectContent[projectContent.length - 1].text || 
                   (projectContent[projectContent.length - 1].file ? 
                    (projectContent[projectContent.length - 1].file.isImage ? 'Image attachment' : 'File attachment') : 
                    'Empty content'))
                : 'No ideas added yet...';

            projectCard.innerHTML = `
                <div class="project-header">
                    <div>
                        <div class="project-title">${Utils.escapeHtml(project.name)}</div>
                        <div class="project-meta">
                            <span>${Utils.formatDate(project.createdAt)}</span>
                            <span>${projectContent.length} ideas</span>
                        </div>
                    </div>
                </div>
                <div class="project-content-preview">${Utils.escapeHtml(previewText)}</div>
                <div class="project-actions">
                    <button class="action-btn edit-btn">Edit</button>
                    <button class="action-btn delete-btn">Delete</button>
                </div>
            `;
        } catch (error) {
            console.error('Error creating project element:', error);
            projectCard.innerHTML = `
                <div class="project-header">
                    <div>
                        <div class="project-title">${Utils.escapeHtml(project.name)}</div>
                        <div class="project-meta">
                            <span>${Utils.formatDate(project.createdAt)}</span>
                            <span>Error loading ideas</span>
                        </div>
                    </div>
                </div>
                <div class="project-content-preview">Failed to load project content</div>
                <div class="project-actions">
                    <button class="action-btn edit-btn">Edit</button>
                    <button class="action-btn delete-btn">Delete</button>
                </div>
            `;
        }

        projectCard.addEventListener('click', async () => {
            await this.openProject(project.id);
        });

        // Add event listeners to action buttons
        const editBtn = projectCard.querySelector('.edit-btn');
        const deleteBtn = projectCard.querySelector('.delete-btn');

        editBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.editProject(project.id);
        });

        deleteBtn?.addEventListener('click', async (e) => {
            e.stopPropagation();
            await this.deleteProject(project.id);
        });

        return projectCard;
    }

    /**
     * Update statistics display
     */
    async updateStatistics() {
        try {
            const totalProjects = this.projects.length;
            const totalIdeas = await this.db.getTotalIdeasCount();
            const recentActivity = await this.db.getRecentProjectsCount();

            if (this.totalProjectsEl) this.totalProjectsEl.textContent = totalProjects;
            if (this.totalIdeasEl) this.totalIdeasEl.textContent = totalIdeas;
            if (this.recentActivityEl) this.recentActivityEl.textContent = recentActivity;
        } catch (error) {
            console.error('Error updating statistics:', error);
            // Set fallback values
            if (this.totalProjectsEl) this.totalProjectsEl.textContent = this.projects.length;
            if (this.totalIdeasEl) this.totalIdeasEl.textContent = '?';
            if (this.recentActivityEl) this.recentActivityEl.textContent = '?';
        }
    }

    /**
     * Toggle empty state display
     */
    toggleEmptyState() {
        if (this.emptyState) {
            this.emptyState.style.display = this.projects.length === 0 ? 'block' : 'none';
        }
    }

    /**
     * Load projects from database
     */
    async loadProjects() {
        try {
            this.projects = await this.db.getAllProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
            Utils.showToast('Failed to load projects.');
        }
    }
}
