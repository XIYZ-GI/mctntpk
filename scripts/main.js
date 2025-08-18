// 主应用管理类
class CannonApp {
    constructor() {
        this.isLoading = false;
        this.cannonsData = new Map();
        this.authorsData = new Map();
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            
            // 初始化组件
            await this.initializeComponents();
            
            // 加载数据
            await this.loadAllData();
            
            // 渲染界面
            await this.renderInterface();
            
            // 加载保存的设置
            await window.controlsManager.loadSavedSettings();
            
            this.hideLoading();
            
            console.log('红石火炮数据分析系统初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showError('系统初始化失败，请刷新页面重试');
            this.hideLoading();
        }
    }

    // 初始化组件
    async initializeComponents() {
        // 组件已在各自的文件中初始化
        console.log('组件初始化完成');
    }

    // 加载所有数据
    async loadAllData() {
        try {
            // 检查API连通性
            const apiConnected = await window.cannonAPI.checkConnectivity();
            
            if (apiConnected) {
                await this.syncWithAPI();
            } else {
                console.warn('API连接失败，使用本地数据');
                this.showNotification('无法连接到服务器，使用本地缓存数据', 'warning');
            }
            
            // 从本地数据库加载数据
            await this.loadFromDatabase();
            
        } catch (error) {
            console.error('数据加载失败:', error);
            this.showNotification('数据加载失败，部分功能可能不可用', 'error');
        }
    }

    // 与API同步数据
    async syncWithAPI() {
        try {
            console.log('开始与API同步数据...');
            
            // 获取远程火炮列表
            const remoteList = await window.cannonAPI.getCannonList();
            const remoteFiles = remoteList.files || [];
            
            // 获取本地已有的文件
            const localCannons = await window.cannonDB.getAllCannons();
            const localFiles = new Set(localCannons.map(c => c.filename));
            
            // 找出需要下载的新文件
            const newFiles = remoteFiles.filter(filename => !localFiles.has(filename));
            
            if (newFiles.length > 0) {
                console.log(`发现 ${newFiles.length} 个新的火炮数据文件`);
                
                // 批量下载新文件
                const newCannonsData = await window.cannonAPI.batchGetCannonData(newFiles);
                
                // 保存到本地数据库
                const cannonsToSave = newCannonsData.map(item => ({
                    filename: item.filename,
                    ...item.data
                }));
                
                if (cannonsToSave.length > 0) {
                    await window.cannonDB.saveCannons(cannonsToSave);
                    this.showNotification(`成功同步 ${cannonsToSave.length} 个新的火炮数据`, 'success');
                }
            } else {
                console.log('本地数据已是最新');
            }
            
        } catch (error) {
            console.error('API同步失败:', error);
            throw error;
        }
    }

    // 从数据库加载数据
    async loadFromDatabase() {
        try {
            const cannons = await window.cannonDB.getAllCannons();
            
            // 处理火炮数据
            cannons.forEach(cannon => {
                this.cannonsData.set(cannon.filename, cannon);
                
                // 按作者分组
                const author = cannon.火炮作者 || '未知作者';
                if (!this.authorsData.has(author)) {
                    this.authorsData.set(author, []);
                }
                this.authorsData.get(author).push(cannon);
                
                // 添加到图表
                window.chartManager.addCannonData(cannon);
            });
            
            console.log(`从本地数据库加载了 ${cannons.length} 个火炮数据`);
            
        } catch (error) {
            console.error('从数据库加载数据失败:', error);
            throw error;
        }
    }

    // 渲染界面
    async renderInterface() {
        this.renderCannonsList();
        this.renderLegend();
        this.setupEventListeners();
    }

    // 渲染火炮列表
    renderCannonsList() {
        const container = document.getElementById('authors-container');
        container.innerHTML = '';
        
        if (this.authorsData.size === 0) {
            container.innerHTML = '<p class="no-data">暂无火炮数据</p>';
            return;
        }
        
        // 按作者分组渲染
        Array.from(this.authorsData.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .forEach(([author, cannons]) => {
                const authorGroup = this.createAuthorGroup(author, cannons);
                container.appendChild(authorGroup);
            });
    }

    // 创建作者分组
    createAuthorGroup(author, cannons) {
        const group = document.createElement('div');
        group.className = 'author-group';
        
        const header = document.createElement('div');
        header.className = 'author-header';
        header.textContent = `${author} (${cannons.length} 个火炮)`;
        
        const cannonsContainer = document.createElement('div');
        cannonsContainer.className = 'cannons-container';
        
        cannons
            .sort((a, b) => a.火炮名称.localeCompare(b.火炮名称))
            .forEach(cannon => {
                const card = this.createCannonCard(cannon);
                cannonsContainer.appendChild(card);
            });
        
        group.appendChild(header);
        group.appendChild(cannonsContainer);
        
        return group;
    }

    // 创建火炮卡片
    createCannonCard(cannon) {
        const card = document.createElement('div');
        card.className = 'cannon-card';
        card.dataset.filename = cannon.filename;
        card.style.setProperty('--cannon-color', cannon.颜色);
        
        card.innerHTML = `
            <div class="cannon-name">${cannon.火炮名称}</div>
            <div class="cannon-params">${cannon.火炮参数}</div>
            <div class="cannon-author">作者: ${cannon.火炮作者}</div>
        `;
        
        // 添加点击事件
        card.addEventListener('click', () => {
            const isVisible = window.chartManager.toggleCannonVisibility(cannon.filename);
            card.classList.toggle('hidden', !isVisible);
            window.controlsManager.updateLegend();
        });
        
        return card;
    }

    // 渲染图例
    renderLegend() {
        window.controlsManager.updateLegend();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 页面刷新时保存数据
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'a':
                        e.preventDefault();
                        window.chartManager.showAllCannons();
                        window.controlsManager.updateCannonCardsVisibility();
                        window.controlsManager.updateLegend();
                        break;
                    case 'h':
                        e.preventDefault();
                        window.chartManager.hideAllCannons();
                        window.controlsManager.updateCannonCardsVisibility();
                        window.controlsManager.updateLegend();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshData();
                        break;
                }
            }
        });
    }

    // 刷新数据
    async refreshData() {
        try {
            this.showLoading();
            
            // 清空API缓存
            window.cannonAPI.clearCache();
            
            // 重新同步数据
            await this.syncWithAPI();
            
            // 重新加载界面
            this.cannonsData.clear();
            this.authorsData.clear();
            window.chartManager.clearAllData();
            
            await this.loadFromDatabase();
            await this.renderInterface();
            
            this.hideLoading();
            this.showNotification('数据刷新完成', 'success');
            
        } catch (error) {
            console.error('数据刷新失败:', error);
            this.showNotification('数据刷新失败', 'error');
            this.hideLoading();
        }
    }

    // 保存当前状态
    async saveCurrentState() {
        try {
            const state = {
                visibleCannons: Array.from(window.chartManager.visibleDatasets),
                chartRange: window.chartManager.currentRange,
                timestamp: Date.now()
            };
            
            await window.cannonDB.saveSetting('appState', state);
        } catch (error) {
            console.error('保存状态失败:', error);
        }
    }

    // 恢复上次状态
    async restoreState() {
        try {
            const state = await window.cannonDB.getSetting('appState');
            
            if (state && state.visibleCannons) {
                // 恢复可见的火炮
                state.visibleCannons.forEach(filename => {
                    window.chartManager.visibleDatasets.add(filename);
                });
                
                window.chartManager.updateChart();
                window.controlsManager.updateCannonCardsVisibility();
                window.controlsManager.updateLegend();
            }
        } catch (error) {
            console.error('恢复状态失败:', error);
        }
    }

    // 显示加载状态
    showLoading() {
        this.isLoading = true;
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = '<div class="chart-loading">正在加载数据...</div>';
        }
    }

    // 隐藏加载状态
    hideLoading() {
        this.isLoading = false;
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer && chartContainer.querySelector('.chart-loading')) {
            chartContainer.innerHTML = '<canvas id="main-chart"></canvas>';
            // 重新初始化图表
            window.chartManager = new CannonChartManager('main-chart');
            // 重新添加数据
            this.cannonsData.forEach(cannon => {
                window.chartManager.addCannonData(cannon);
            });
        }
    }

    // 显示错误
    showError(message) {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="chart-error">
                    <h3>加载失败</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        window.controlsManager.showNotification(message, type);
    }

    // 获取应用统计信息
    getAppStats() {
        return {
            火炮总数: this.cannonsData.size,
            作者总数: this.authorsData.size,
            图表统计: window.chartManager.getChartStats(),
            数据库统计: window.cannonDB.getStats()
        };
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.cannonApp = new CannonApp();
});

// 添加全局样式到页面
const globalStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        max-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-info {
        background: linear-gradient(45deg, #4ecdc4, #44a08d);
    }
    
    .notification-success {
        background: linear-gradient(45deg, #28a745, #20c997);
    }
    
    .notification-warning {
        background: linear-gradient(45deg, #ffc107, #fd7e14);
    }
    
    .notification-error {
        background: linear-gradient(45deg, #dc3545, #c82333);
    }
    
    .no-data {
        text-align: center;
        color: #a0a0a0;
        font-style: italic;
        padding: 40px 20px;
        background: linear-gradient(135deg, #1a1a2a, #2a2a3a);
        border-radius: 10px;
        border: 2px dashed #444;
    }
    
    .btn-disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
`;

// 添加样式到页面
const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);