// 主程序入口
class MinecraftCannonApp {
    constructor() {
        this.init();
    }

    // 初始化应用程序
    async init() {
        try {
            // 等待数据库初始化完成
            await cannonDB.init();
            console.log('数据库初始化完成');
            
            // 初始化图表
            trajectoryChart = new TrajectoryChart('trajectoryChart');
            console.log('图表初始化完成');
            
            // 加载初始数据
            await this.loadInitialData();
            
            // 更新UI
            await uiManager.updateCannonList();
            
            console.log('应用程序初始化完成');
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.showError('应用程序初始化失败，请刷新页面重试');
        }
    }

    // 加载初始数据
    async loadInitialData() {
        const cannons = await cannonDB.getAllCannons();
        
        // 如果没有数据，添加示例数据
        if (cannons.length === 0) {
            await this.addSampleData();
        }
        
        // 默认显示所有火炮
        await trajectoryChart.showAll();
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

        for (const cannon of sampleCannons) {
            await cannonDB.addCannon(cannon);
        }
        
        console.log('示例数据已添加');
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
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
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
        `;
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
}

// 页面加载完成后启动应用程序
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，启动应用程序...');
    new MinecraftCannonApp();
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && trajectoryChart) {
        // 页面重新可见时刷新图表
        trajectoryChart.updateChart();
    }
});

// 处理窗口大小变化
window.addEventListener('resize', () => {
    if (trajectoryChart && trajectoryChart.chart) {
        setTimeout(() => {
            trajectoryChart.chart.resize();
        }, 100);
    }
});

// 防止页面意外关闭时丢失正在编辑的数据
window.addEventListener('beforeunload', (e) => {
    const addModal = document.getElementById('addModal');
    if (addModal.style.display === 'block') {
        e.preventDefault();
        e.returnValue = '您有未保存的火炮数据，确定要离开吗？';
        return e.returnValue;
    }
});
