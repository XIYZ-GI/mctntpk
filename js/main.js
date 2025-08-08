// 主程序入口
class MinecraftCannonApp {
    constructor() {
        this.initTimeout = null;
        this.debugMode = true; // 启用调试模式
        console.log('MinecraftCannonApp构造函数被调用');
        this.init();
    }

    // 初始化应用程序
    async init() {
        try {
            console.log('开始初始化应用程序...');
            
            // 显示加载状态
            this.showLoadingMessage('正在初始化应用程序...');
            
            // 设置初始化超时
            this.initTimeout = setTimeout(() => {
                console.error('初始化超时');
                this.showError('初始化超时，正在尝试备用方案...');
                this.forceInit();
            }, 15000);

            // 步骤1: 等待数据库初始化完成
            console.log('步骤1: 初始化数据库...');
            this.showLoadingMessage('正在初始化数据库...');
            await cannonDB.init();
            console.log('数据库初始化完成，存储类型:', cannonDB.getStorageType());
            
            // 步骤2: 初始化图表
            console.log('步骤2: 初始化图表...');
            this.showLoadingMessage('正在初始化图表...');
            await this.initChart();
            
            // 步骤3: 加载初始数据
            console.log('步骤3: 加载初始数据...');
            this.showLoadingMessage('正在加载数据...');
            await this.loadInitialData();
            
            // 步骤4: 更新UI
            console.log('步骤4: 更新UI...');
            this.showLoadingMessage('正在更新界面...');
            await uiManager.updateCannonList();
            
            // 清除超时
            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.initTimeout = null;
            }
            
            // 隐藏加载状态
            this.hideLoadingMessage();
            
            this.showSuccess(`应用程序初始化完成 (${cannonDB.getStorageType()})`);
            console.log('应用程序初始化完成');
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.hideLoadingMessage();
            
            // 清除超时
            if (this.initTimeout) {
                clearTimeout(this.initTimeout);
                this.initTimeout = null;
            }
            
            // 显示错误并尝试强制初始化
            this.showError('初始化失败: ' + error.message);
            setTimeout(() => this.forceInit(), 2000);
        }
    }

    // 初始化图表
    async initChart() {
        return new Promise((resolve, reject) => {
            console.log('开始初始化图表...');
            
            // 创建图表实例
            trajectoryChart = new TrajectoryChart('trajectoryChart');
            
            // 监听图表初始化完成事件
            const onChartInitialized = (event) => {
                console.log('图表初始化完成事件触发');
                window.removeEventListener('chart-initialized', onChartInitialized);
                resolve();
            };
            
            window.addEventListener('chart-initialized', onChartInitialized);
            
            // 设置超时
            setTimeout(() => {
                if (!trajectoryChart || !trajectoryChart.isReady()) {
                    console.error('图表初始化超时');
                    window.removeEventListener('chart-initialized', onChartInitialized);
                    // 不要reject，而是继续执行
                    resolve();
                }
            }, 8000);
        });
    }

    // 强制初始化（备用方案）
    async forceInit() {
        try {
            console.log('尝试强制初始化...');
            this.showLoadingMessage('正在尝试备用初始化方案...');
            
            // 直接使用内存存储
            if (!cannonDB.isInitialized()) {
                console.log('强制初始化数据库为内存模式');
                cannonDB.useMemoryStorage = true;
                cannonDB.memoryStorage = [];
                cannonDB.isReady = true;
            }
            
            // 检查图表状态
            if (!trajectoryChart || !trajectoryChart.isReady()) {
                console.log('图表未就绪，显示备用界面');
                this.showChartFallback();
            }
            
            // 加载基本数据
            await this.loadInitialData();
            await uiManager.updateCannonList();
            
            this.hideLoadingMessage();
            this.showSuccess('应用程序初始化完成 (备用模式)');
            
        } catch (error) {
            console.error('强制初始化也失败:', error);
            this.hideLoadingMessage();
            this.showFatalError(error.message);
        }
    }

    // 显示图表备用界面
    showChartFallback() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div style="
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    min-height: 400px;
                    color: #fff;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    border: 2px dashed rgba(255, 255, 255, 0.3);
                    padding: 30px;
                    text-align: center;
                ">
                    <div style="font-size: 64px; margin-bottom: 20px;">📊</div>
                    <div style="font-size: 24px; margin-bottom: 15px; font-weight: bold;">图表功能暂时不可用</div>
                    <div style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin-bottom: 20px; max-width: 400px; line-height: 1.5;">
                        图表库加载失败，但您仍可以使用添加、删除、导入导出等功能。
                    </div>
                    <div style="margin-bottom: 20px;">
                        <button onclick="location.reload()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-right: 10px;
                        ">🔄 刷新页面</button>
                        <button onclick="this.parentElement.parentElement.style.display='none'" style="
                            background: #666;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">隐藏提示</button>
                    </div>
                </div>
            `;
        }
    }

    // 显示致命错误
    showFatalError(errorMessage) {
        const container = document.querySelector('.container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #fff;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
                    <h2 style="color: #f44336; margin-bottom: 20px;">初始化失败</h2>
                    <p style="margin-bottom: 15px; font-size: 18px;">应用程序无法正常启动</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; max-width: 600px; margin-left: auto; margin-right: auto;">
                        <p style="color: #ffeb3b; margin-bottom: 10px;"><strong>错误信息:</strong></p>
                        <p style="font-family: monospace; font-size: 14px; color: #ff9800;">${errorMessage}</p>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <p><strong>可能的原因:</strong></p>
                        <ul style="text-align: left; max-width: 500px; margin: 0 auto 20px;">
                            <li>网络连接问题，无法加载图表库</li>
                            <li>浏览器不支持现代Web技术</li>
                            <li>浏览器安全设置过于严格</li>
                            <li>存储空间不足</li>
                        </ul>
                    </div>
                    <div>
                        <button onclick="location.reload()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-right: 10px;
                        ">🔄 重新加载页面</button>
                        <button onclick="window.open('https://www.google.com/chrome/', '_blank')" style="
                            background: #2196F3;
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        ">📱 建议使用Chrome浏览器</button>
                    </div>
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
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 30px 40px;
            border-radius: 15px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
            font-size: 16px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            min-width: 300px;
        `;
        
        loadingDiv.innerHTML = `
            <div style="
                width: 40px;
                height: 40px;
                border: 4px solid #333;
                border-top: 4px solid #4CAF50;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <div style="text-align: center;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">正在初始化</div>
                <div style="color: #ccc;">${message}</div>
            </div>
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
            console.log('当前数据库中的火炮数量:', cannons.length);
            
            // 如果没有数据，添加示例数据
            if (cannons.length === 0) {
                console.log('没有数据，添加示例数据');
                await this.addSampleData();
            }
            
            // 默认显示所有火炮
            if (trajectoryChart && trajectoryChart.isReady()) {
                console.log('显示所有火炮到图表');
                await trajectoryChart.showAll();
            } else {
                console.warn('图表未就绪，跳过显示火炮');
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
            background: linear-gradient(45deg, #f44336, #d32f2f);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(244, 67, 54, 0.3);
            z-index: 10000;
            max-width: 350px;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        errorDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-size: 16px; margin-bottom: 5px;">⚠️ 错误</div>
                    <div style="font-size: 14px; font-weight: normal; line-height: 1.4;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 15px;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
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
        }, 10000);
    }

    // 显示成功信息
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);
            z-index: 10000;
            max-width: 350px;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        successDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div style="font-size: 16px; margin-bottom: 5px;">✅ 成功</div>
                    <div style="font-size: 14px; font-weight: normal; line-height: 1.4;">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    margin-left: 15px;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 6000);
    }
}

// 页面加载完成后启动应用程序
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== 页面加载完成，启动应用程序 ===');
    
    // 检查基本的浏览器支持
    if (typeof Promise === 'undefined') {
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #fff; background: #000;">
                <h2 style="color: #f44336;">浏览器版本过低</h2>
                <p>请使用现代浏览器访问此应用（推荐Chrome、Firefox、Edge）</p>
            </div>
        `;
        return;
    }
    
    try {
        console.log('创建应用程序实例...');
        new MinecraftCannonApp();
    } catch (error) {
        console.error('应用启动失败:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #fff; background: #000;">
                <h2 style="color: #f44336;">启动失败</h2>
                <p>应用程序无法启动: ${error.message}</p>
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
    if (!document.hidden && trajectoryChart && trajectoryChart.isReady()) {
        console.log('页面重新可见，刷新图表');
        setTimeout(() => {
            trajectoryChart.updateChart();
        }, 100);
    }
});

// 处理窗口大小变化
window.addEventListener('resize', () => {
    if (trajectoryChart && trajectoryChart.chart) {
        console.log('窗口大小变化，调整图表');
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
    console.error('全局错误捕获:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
});

// 调试信息输出
console.log('=== 调试信息 ===');
console.log('User Agent:', navigator.userAgent);
console.log('支持IndexedDB:', !!window.indexedDB);
console.log('支持localStorage:', !!window.localStorage);
console.log('支持Canvas:', !!document.createElement('canvas').getContext);
console.log('==================');