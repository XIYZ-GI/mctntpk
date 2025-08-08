// 图表管理类
class TrajectoryChart {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.chart = null;
        this.visibleCannons = new Set();
        this.isInitialized = false;
        this.initializationAttempts = 0;
        this.maxInitAttempts = 10;
        
        console.log('TrajectoryChart构造函数被调用');
        this.waitForChartJS();
    }

    // 等待Chart.js加载完成
    waitForChartJS() {
        console.log('等待Chart.js加载...');
        
        // 如果Chart.js已经加载
        if (typeof Chart !== 'undefined') {
            console.log('Chart.js已经可用，直接初始化');
            this.initChart();
            return;
        }

        // 监听Chart.js加载事件
        const onChartJSLoaded = () => {
            console.log('收到Chart.js加载完成事件');
            window.removeEventListener('chartjs-loaded', onChartJSLoaded);
            window.removeEventListener('chartjs-error', onChartJSError);
            this.initChart();
        };

        const onChartJSError = () => {
            console.error('Chart.js加载失败');
            window.removeEventListener('chartjs-loaded', onChartJSLoaded);
            window.removeEventListener('chartjs-error', onChartJSError);
            this.showChartError('图表库加载失败');
        };

        window.addEventListener('chartjs-loaded', onChartJSLoaded);
        window.addEventListener('chartjs-error', onChartJSError);

        // 设置超时机制
        setTimeout(() => {
            if (!this.isInitialized) {
                console.error('Chart.js加载超时');
                window.removeEventListener('chartjs-loaded', onChartJSLoaded);
                window.removeEventListener('chartjs-error', onChartJSError);
                this.tryFallbackInit();
            }
        }, 10000);
    }

    // 尝试备用初始化方案
    tryFallbackInit() {
        console.log('尝试备用初始化方案...');
        
        this.initializationAttempts++;
        
        if (this.initializationAttempts >= this.maxInitAttempts) {
            console.error('达到最大初始化尝试次数');
            this.showChartError('图表初始化失败，已达到最大重试次数');
            return;
        }

        // 检查Chart是否已经可用
        if (typeof Chart !== 'undefined') {
            console.log('Chart.js现在可用了，尝试初始化');
            this.initChart();
        } else {
            console.log('Chart.js仍然不可用，1秒后重试');
            setTimeout(() => this.tryFallbackInit(), 1000);
        }
    }

    // 初始化图表
    initChart() {
        try {
            console.log('开始初始化图表...');
            
            if (!this.canvas) {
                console.error('找不到图表画布元素:', this.canvasId);
                this.showChartError('找不到图表画布');
                return;
            }

            // 检查Chart.js是否真正可用
            if (typeof Chart === 'undefined') {
                console.error('Chart未定义');
                this.showChartError('Chart.js未加载');
                return;
            }

            console.log('Chart.js版本:', Chart.version);

            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                console.error('无法获取canvas上下文');
                this.showChartError('无法获取画布上下文');
                return;
            }

            console.log('创建Chart实例...');
            
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    datasets: []
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '火力曲线 - 射程与弹道',
                            color: '#ffffff',
                            font: {
                                size: 18,
                                weight: 'bold'
                            }
                        },
                        legend: {
                            display: true,
                            position: 'right',
                            labels: {
                                color: '#ffffff',
                                usePointStyle: true,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) {
                                    return `射程: ${context[0].parsed.x} 格`;
                                },
                                label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.y} 条弹道`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: {
                                display: true,
                                text: '射程 (格)',
                                color: '#ffffff',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: true,
                                borderColor: '#ffffff'
                            },
                            ticks: {
                                color: '#ffffff',
                                stepSize: 200,
                                callback: function(value) {
                                    return value + '格';
                                }
                            },
                            min: 0,
                            max: 1450
                        },
                        y: {
                            title: {
                                display: true,
                                text: '弹道数量 (条)',
                                color: '#ffffff',
                                font: {
                                    size: 14,
                                    weight: 'bold'
                                }
                            },
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: true,
                                borderColor: '#ffffff'
                            },
                            ticks: {
                                color: '#ffffff',
                                stepSize: 50,
                                callback: function(value) {
                                    return value + '条';
                                }
                            },
                            min: 0,
                            max: 400
                        }
                    },
                    elements: {
                        line: {
                            tension: 0.4 // 使曲线平滑
                        },
                        point: {
                            radius: 3,
                            hoverRadius: 6
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    }
                }
            });

            this.isInitialized = true;
            console.log('图表初始化成功');
            
            // 触发初始化完成事件
            window.dispatchEvent(new CustomEvent('chart-initialized', {
                detail: { chart: this }
            }));
            
        } catch (error) {
            console.error('图表初始化失败:', error);
            this.showChartError('图表初始化失败: ' + error.message);
        }
    }

    // 显示图表错误
    showChartError(message) {
        console.log('显示图表错误:', message);
        
        if (this.canvas) {
            const parent = this.canvas.parentElement;
            if (parent) {
                parent.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100%;
                        min-height: 300px;
                        color: #fff;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 10px;
                        border: 2px dashed rgba(255, 255, 255, 0.3);
                        padding: 20px;
                        text-align: center;
                    ">
                        <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                        <div style="font-size: 18px; margin-bottom: 10px; font-weight: bold;">图表暂不可用</div>
                        <div style="font-size: 14px; color: rgba(255, 255, 255, 0.7); margin-bottom: 15px;">${message}</div>
                        <button onclick="location.reload()" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 14px;
                        ">🔄 重新加载页面</button>
                    </div>
                `;
            }
        }
    }

    // 生成随机颜色
    generateColor(index) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE',
            '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', '#AED6F1'
        ];
        return colors[index % colors.length];
    }

    // 更新图表数据
    async updateChart() {
        if (!this.isInitialized || !this.chart) {
            console.warn('图表未初始化，跳过更新');
            return;
        }

        try {
            console.log('开始更新图表...');
            
            const cannons = await cannonDB.getAllCannons();
            console.log('获取到火炮数据:', cannons.length, '个');
            
            const datasets = [];
            let maxRange = 1450;
            let maxTrajectory = 400;

            cannons.forEach((cannon, index) => {
                if (this.visibleCannons.has(cannon.id)) {
                    console.log('处理火炮:', cannon.name);
                    const data = this.processCannonData(cannon);
                    console.log('处理后的数据点数量:', data.length);
                    
                    if (data.length > 0) { // 只有有数据的才添加
                        const color = this.generateColor(index);
                        
                        datasets.push({
                            label: cannon.name,
                            data: data,
                            borderColor: color,
                            backgroundColor: color + '20',
                            fill: false,
                            tension: 0.4
                        });

                        // 更新最大值
                        const cannonMaxRange = Math.max(...data.map(point => point.x));
                        const cannonMaxTrajectory = Math.max(...data.map(point => point.y));
                        maxRange = Math.max(maxRange, cannonMaxRange + 200);
                        maxTrajectory = Math.max(maxTrajectory, cannonMaxTrajectory + 100);
                    }
                }
            });

            console.log('数据集数量:', datasets.length);
            console.log('最大射程:', maxRange, '最大弹道:', maxTrajectory);

            // 更新图表数据和坐标轴范围
            this.chart.data.datasets = datasets;
            this.chart.options.scales.x.max = maxRange;
            this.chart.options.scales.y.max = maxTrajectory;
            
            // 更新刻度步长
            this.chart.options.scales.x.ticks.stepSize = Math.max(200, Math.round(maxRange / 10));
            this.chart.options.scales.y.ticks.stepSize = Math.max(50, Math.round(maxTrajectory / 10));
            
            this.chart.update('none'); // 使用'none'模式加快更新速度
            console.log('图表更新完成');
            
        } catch (error) {
            console.error('图表更新失败:', error);
        }
    }

    // 处理火炮数据为图表格式
    processCannonData(cannon) {
        if (!cannon.trajectoryData || !Array.isArray(cannon.trajectoryData)) {
            console.warn('火炮数据格式异常:', cannon);
            return [];
        }

        const data = [];
        
        cannon.trajectoryData.forEach(rangeData => {
            if (!rangeData || typeof rangeData.range !== 'number') {
                return; // 跳过异常数据
            }

            const range = rangeData.range;
            
            // 处理三个角度范围的数据
            if (rangeData.low > 0) {
                data.push({ x: range, y: rangeData.low });
            }
            if (rangeData.medium > 0) {
                data.push({ x: range, y: rangeData.medium });
            }
            if (rangeData.high > 0) {
                data.push({ x: range, y: rangeData.high });
            }
        });

        if (data.length === 0) {
            return [];
        }

        // 按射程排序
        data.sort((a, b) => a.x - b.x);
        
        // 移除重复的x值，保留y值较大的点
        const uniqueData = [];
        const rangeMap = new Map();
        
        data.forEach(point => {
            if (!rangeMap.has(point.x) || rangeMap.get(point.x) < point.y) {
                rangeMap.set(point.x, point.y);
            }
        });
        
        rangeMap.forEach((y, x) => {
            uniqueData.push({ x, y });
        });
        
        return uniqueData.sort((a, b) => a.x - b.x);
    }

    // 显示火炮
    showCannon(cannonId) {
        console.log('显示火炮:', cannonId);
        this.visibleCannons.add(cannonId);
        this.updateChart();
    }

    // 隐藏火炮
    hideCannon(cannonId) {
        console.log('隐藏火炮:', cannonId);
        this.visibleCannons.delete(cannonId);
        this.updateChart();
    }

    // 显示所有火炮
    async showAll() {
        try {
            console.log('显示所有火炮');
            const cannons = await cannonDB.getAllCannons();
            cannons.forEach(cannon => {
                this.visibleCannons.add(cannon.id);
            });
            this.updateChart();
        } catch (error) {
            console.error('显示所有火炮失败:', error);
        }
    }

    // 隐藏所有火炮
    hideAll() {
        console.log('隐藏所有火炮');
        this.visibleCannons.clear();
        this.updateChart();
    }

    // 检查火炮是否可见
    isVisible(cannonId) {
        return this.visibleCannons.has(cannonId);
    }

    // 检查图表是否已初始化
    isReady() {
        return this.isInitialized;
    }
}

// 创建全局图表实例
let trajectoryChart;