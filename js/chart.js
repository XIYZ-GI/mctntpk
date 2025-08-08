// 图表管理类
class TrajectoryChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.chart = null;
        this.visibleCannons = new Set();
        this.initChart();
    }

    // 初始化图表
    initChart() {
        const ctx = this.canvas.getContext('2d');
        
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
                        display: false
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
        const cannons = await cannonDB.getAllCannons();
        const datasets = [];
        let maxRange = 1450;
        let maxTrajectory = 400;

        cannons.forEach((cannon, index) => {
            if (this.visibleCannons.has(cannon.id)) {
                const data = this.processCannonData(cannon);
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
        });

        // 更新图表数据和坐标轴范围
        this.chart.data.datasets = datasets;
        this.chart.options.scales.x.max = maxRange;
        this.chart.options.scales.y.max = maxTrajectory;
        
        // 更新刻度步长
        this.chart.options.scales.x.ticks.stepSize = Math.max(200, Math.round(maxRange / 10));
        this.chart.options.scales.y.ticks.stepSize = Math.max(50, Math.round(maxTrajectory / 10));
        
        this.chart.update();
    }

    // 处理火炮数据为图表格式
    processCannonData(cannon) {
        const data = [];
        
        cannon.trajectoryData.forEach(rangeData => {
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
        this.visibleCannons.add(cannonId);
        this.updateChart();
    }

    // 隐藏火炮
    hideCannon(cannonId) {
        this.visibleCannons.delete(cannonId);
        this.updateChart();
    }

    // 显示所有火炮
    async showAll() {
        const cannons = await cannonDB.getAllCannons();
        cannons.forEach(cannon => {
            this.visibleCannons.add(cannon.id);
        });
        this.updateChart();
    }

    // 隐藏所有火炮
    hideAll() {
        this.visibleCannons.clear();
        this.updateChart();
    }

    // 检查火炮是否可见
    isVisible(cannonId) {
        return this.visibleCannons.has(cannonId);
    }
}

// 创建全局图表实例
let trajectoryChart;