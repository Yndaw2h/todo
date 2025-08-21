/**
 * Database Manager for IndexedDB operations
 * Handles all database interactions for projects and content
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'ProjectManagerDB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create projects store
                if (!db.objectStoreNames.contains('projects')) {
                    const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
                    projectStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Create content store
                if (!db.objectStoreNames.contains('content')) {
                    const contentStore = db.createObjectStore('content', { keyPath: 'id' });
                    contentStore.createIndex('projectId', 'projectId', { unique: false });
                    contentStore.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Create counters store
                if (!db.objectStoreNames.contains('counters')) {
                    const counterStore = db.createObjectStore('counters', { keyPath: 'name' });
                    // Initialize counters
                    counterStore.add({ name: 'projectId', value: 1 });
                    counterStore.add({ name: 'contentId', value: 1 });
                }
            };
        });
    }

    async getNextId(counterName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['counters'], 'readwrite');
            const store = transaction.objectStore('counters');
            
            const getRequest = store.get(counterName);
            getRequest.onsuccess = () => {
                const counter = getRequest.result || { name: counterName, value: 1 };
                const nextId = counter.value;
                counter.value = nextId + 1;
                
                const putRequest = store.put(counter);
                putRequest.onsuccess = () => resolve(nextId);
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async saveProject(project) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            
            const request = store.put(project);
            request.onsuccess = () => resolve(project);
            request.onerror = () => reject(request.error);
        });
    }

    async getProject(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProjects() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects'], 'readonly');
            const store = transaction.objectStore('projects');
            
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProject(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects', 'content'], 'readwrite');
            const projectStore = transaction.objectStore('projects');
            const contentStore = transaction.objectStore('content');
            
            // Delete project
            const deleteProjectRequest = projectStore.delete(id);
            
            // Delete all content for this project
            const contentIndex = contentStore.index('projectId');
            const contentRequest = contentIndex.getAllKeys(id);
            
            contentRequest.onsuccess = () => {
                const contentIds = contentRequest.result;
                contentIds.forEach(contentId => {
                    contentStore.delete(contentId);
                });
            };

            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async saveContent(content) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['content'], 'readwrite');
            const store = transaction.objectStore('content');
            
            const request = store.put(content);
            request.onsuccess = () => resolve(content);
            request.onerror = () => reject(request.error);
        });
    }

    async getProjectContent(projectId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['content'], 'readonly');
            const store = transaction.objectStore('content');
            const index = store.index('projectId');
            
            const request = index.getAll(projectId);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteContent(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['content'], 'readwrite');
            const store = transaction.objectStore('content');
            
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    async getTotalIdeasCount() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['content'], 'readonly');
            const store = transaction.objectStore('content');
            
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getRecentProjectsCount(days = 7) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['projects', 'content'], 'readonly');
            const projectStore = transaction.objectStore('projects');
            const contentStore = transaction.objectStore('content');
            
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - days);
            const weekAgoISO = weekAgo.toISOString();
            
            // Get all projects
            const projectsRequest = projectStore.getAll();
            
            projectsRequest.onsuccess = () => {
                const projects = projectsRequest.result;
                const recentProjectIds = new Set();
                
                // Check projects created recently
                projects.forEach(project => {
                    if (project.createdAt > weekAgoISO) {
                        recentProjectIds.add(project.id);
                    }
                });
                
                // Check content created recently
                const contentRequest = contentStore.getAll();
                contentRequest.onsuccess = () => {
                    const contents = contentRequest.result;
                    contents.forEach(content => {
                        if (content.createdAt > weekAgoISO) {
                            recentProjectIds.add(content.projectId);
                        }
                    });
                    resolve(recentProjectIds.size);
                };
                contentRequest.onerror = () => reject(contentRequest.error);
            };
            
            projectsRequest.onerror = () => reject(projectsRequest.error);
        });
    }
}
