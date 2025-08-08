// 主程序入口
class MinecraftCannonApp {
    constructor() {
        this.initTimeout = null;
        this.init();
    }

    // 初始化应用程序
    async init() {
        try {
            // 显示加载状态
            this.showLoadingMessage('正在初始化应用程序...');
            
            // 设置初始化超时
            this.initTimeout = setTimeout(() => {
                this.showError('初始化超时，正在尝试备用方案...');
                this.forceInit();
            }, 10000);

            // 等待数据库初始化完成
            await cannonDB.init();
            console.log('数据库初始化完成，存储类型:', cannonDB.getStorageType());
            
            // 清除超时
            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.initTimeout = null;
            }
            
            // 初始化图表
            trajectoryChart = new TrajectoryChart('trajectoryChart');
            console.log('图表初始化完成');
            
            // 加载初始数据
            await this.loadInitialData();
            
            // 更新UI
            await uiManager.updateCannonList();
            
            // 隐藏加载状态
            this.hideLoadingMessage();
            
            this.showSuccess(`应用程序初始化完成 (${cannonDB.getStorageType()})`);
            console.log('应用程序初始化完成');
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.hideLoadingMessage();
            
            // 尝试强制初始化
            this.forceInit();
        }
    }

    // 强制初始化（备用方案）
    async forceInit() {
        try {
            console.log('尝试强制初始化...');
            
            // 直接使用内存存储
            if (!cannonDB.isInitialized()) {
                cannonDB.useMemoryStorage = true;
                cannonDB.memoryStorage = [];
                cannonDB.isReady = true;
            }
            
            // 初始化图表
            if (!trajectoryChart) {
                trajectoryChart = new TrajectoryChart('trajectoryChart');
            }
            
            // 加载基本数据
            await this.loadInitialData();
            await uiManager.updateCannonList();
            
            this.hideLoadingMessage();
            this.showSuccess('应用程序初始化完成 (内存存储模式)');
            
        } catch (error) {
            console.error('强制初始化也失败:', error);
            this.hideLoadingMessage();
            this.showFatalError();
        }
    }

    // 显示致命错误
    showFatalError() {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #fff;">
                    <h2 style="color: #f44336; margin-bottom: 20px;">🚫 初始化失败</h2>
                    <p style="margin-bottom: 20px;">应用程序无法正常启动，可能的原因：</p>
                    <ul style="text-align: left; max-width: 400px; margin: 0 auto 20px;">
                        <li>浏览器不支持现代Web技术</li>
                        <li>存储空间不足</li>
                        <li>浏览器安全限制</li>
                    </ul>
                    <button onclick="location.reload()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                    ">🔄 重新加载页面</button>
                </div>
            `;
        }
    }

    // 显示加载消息
    showLoadingMessage(message) {
        this.hideLoadingMessage(); // 先隐藏之前的消息
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-message';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        `;
        
        loadingDiv.innerHTML = `
            <div style="
                width: 20px;
                height: 20px;
                border: 2px solid #fff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <span>${message}</span>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(loadingDiv);
    }

    // 隐藏加载消息
    hideLoadingMessage() {
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // 加载初始数据
    async loadInitialData() {
        try {
            const cannons = await cannonDB.getAllCannons();
            
            // 如果没有数据，添加示例数据
            if (cannons.length === 0) {
                await this.addSampleData();
            }
            
            // 默认显示所有火炮
            if (trajectoryChart) {
                await trajectoryChart.showAll();
            }
        } catch (error) {
            console.error('加载初始数据失败:', error);
            // 即使加载失败也继续，不抛出错误
        }
    }

    // 添加示例数据
    async addSampleData() {
        const sampleCannons = [
            {
                author: "Steve",
                name: "基础火炮MK1",
                trajectoryData: [
                    { range: 100, low: 12, medium: 25, high: 18 },
                    { range: 200, low: 24, medium: 48, high: 32 },
                    { range: 300, low: 36, medium: 72, high: 48 },
                    { range: 400, low: 42, medium: 86, high: 58 },
                    { range: 500, low: 48, medium: 96, high: 64 },
                    { range: 600, low: 52, medium: 104, high: 68 },
                    { range: 700, low: 54, medium: 108, high: 72 },
                    { range: 800, low: 56, medium: 112, high: 74 },
                    { range: 900, low: 58, medium: 116, high: 76 },
                    { range: 1000, low: 60, medium: 120, high: 78 }
                ],
                createdAt: new Date().toISOString()
            },
            {
                author: "Alex",
                name: "重型火炮V2",
                trajectoryData: [
                    { range: 150, low: 18, medium: 35, high: 28 },
                    { range: 300, low: 45, medium: 88, high: 62 },
                    { range: 450, low: 68, medium: 132, high: 94 },
                    { range: 600, low: 88, medium: 168, high: 118 },
                    { range: 750, low: 102, medium: 196, high: 138 },
                    { range: 900, low: 114, medium: 218, high: 152 },
                    { range: 1050, low: 124, medium: 236, high: 164 },
                    { range: 1200, low: 132, medium: 248, high: 172 },
                    { range: 1350, low: 138, medium: 256, high: 178 }
                ],
                createdAt: new Date().toISOString()
            },
            {
                author: "Notch",
                name: "精密火炮Pro",
                trajectoryData: [
                    { range: 200, low: 32, medium: 58, high: 42 },
                    { range: 350, low: 58, medium: 112, high: 78 },
                    { range: 500, low: 82, medium: 158, high: 108 },
                    { range: 650, low: 102, medium: 196, high: 134 },
                    { range: 800, low: 118, medium: 226, high: 154 },
                    { range: 950, low: 132, medium: 248, high: 168 },
                    { range: 1100, low: 142, medium: 264, high: 178 },
                    { range: 1250, low: 148, medium: 274, high: 184 }
                ],
                createdAt: new Date().toISOString()
            }
        ];

        try {
            for (const cannon of sampleCannons) {
                await cannonDB.addCannon(cannon);
            }
            console.log('示例数据已添加');
        } catch (error) {
            console.error('添加示例数据失败:', error);
        }
    }

    // 显示错误信息
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                ">&times;</button>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 8000);
    }

    // 显示成功信息
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        successDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }
}

// 页面加载完成后启动应用程序
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，启动应用程序...');
    
    // 检查基本的浏览器支持
    if (typeof Promise === 'undefined') {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #fff;">
                <h2 style="color: #f44336;">浏览器版本过低</h2>
                <p>请使用现代浏览器访问此应用</p>
            </div>
        `;
        return;
    }
    
    try {
        new MinecraftCannonApp();
    } catch (error) {
        console.error('应用启动失败:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #fff;">
                <h2 style="color: #f44336;">启动失败</h2>
                <p>应用程序无法启动，请刷新页面重试</p>
                <button onclick="location.reload()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 20px;
                ">刷新页面</button>
            </div>
        `;
    }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && trajectoryChart) {
        // 页面重新可见时刷新图表
        setTimeout(() => {
            trajectoryChart.updateChart();
        }, 100);
    }
});

// 处理窗口大小变化
window.addEventListener('resize', () => {
    if (trajectoryChart && trajectoryChart.chart) {
        setTimeout(() => {
            trajectoryChart.chart.resize();
        }, 200);
    }
});

// 防止页面意外关闭时丢失正在编辑的数据
window.addEventListener('beforeunload', (e) => {
    const addModal = document.getElementById('addModal');
    if (addModal && addModal.style.display === 'block') {
        e.preventDefault();
        e.returnValue = '您有未保存的火炮数据，确定要离开吗？';
        return e.returnValue;
    }
});

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});