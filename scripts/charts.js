// 图表管理类
class CannonChartManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.chart = null;
        this.datasets = new Map(); // 存储所有数据集
        this.visibleDatasets = new Set(); // 存储可见的数据集
        this.currentRange = {
            horizontal: { min: -200, max: 200 },
            vertical: { min: -40, max: 170 }
        };
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
                scales: {
                    x: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: '射程 (格)',
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        min: 0,
                        max: 1300,
                        ticks: {
                            stepSize: 200,
                            color: '#a0a0a0'
                        },
                        grid: {
                            color: 'rgba(160, 160, 160, 0.2)',
                            lineWidth: 1
                        }
                    },
                    y: {
                        type: 'linear',
                        title: {
                            display: true,
                            text: '弹道数量 (条)',
                            color: '#ffffff',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        min: 0,
                        max: 400,
                        ticks: {
                            color: '#a0a0a0'
                        },
                        grid: {
                            color: 'rgba(160, 160, 160, 0.2)',
                            lineWidth: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // 使用自定义图例
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 30, 46, 0.95)',
                        titleColor: '#4ecdc4',
                        bodyColor: '#ffffff',
                        borderColor: '#4ecdc4',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
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
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    },
                    line: {
                        borderWidth: 2,
                        tension: 0.1
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // 添加火炮数据
    addCannonData(cannonData) {
        const { filename, 火炮名称, 火炮参数, 颜色, 火炮数据json } = cannonData;
        
        if (!火炮数据json || typeof 火炮数据json !== 'object') {
            console.warn(`火炮数据格式错误: ${filename}`);
            return;
        }

        // 计算综合火力数据
        const comprehensiveData = this.calculateComprehensiveData(火炮数据json);
        
        const dataset = {
            label: 火炮名称,
            data: comprehensiveData,
            borderColor: 颜色,
            backgroundColor: 颜色 + '20', // 添加透明度
            filename: filename,
            params: 火炮参数,
            hidden: false
        };

        this.datasets.set(filename, {
            cannon: cannonData,
            dataset: dataset,
            rawData: 火炮数据json
        });

        this.visibleDatasets.add(filename);
        this.updateChart();
        
        console.log(`已添加火炮数据: ${火炮名称}`);
    }

    // 计算综合火力数据
    calculateComprehensiveData(cannonDataJson) {
        const points = [];
        
        // 遍历所有距离
        Object.keys(cannonDataJson).forEach(distance => {
            const distanceNum = parseInt(distance);
            if (isNaN(distanceNum)) return;
            
            const distanceData = cannonDataJson[distance];
            let totalTrajectories = 0;
            
            // 计算该距离下所有偏移的弹道总数
            if (distanceData.水平偏移) {
                Object.values(distanceData.水平偏移).forEach(count => {
                    totalTrajectories += count || 0;
                });
            }
            
            if (distanceData.垂直偏移) {
                Object.values(distanceData.垂直偏移).forEach(count => {
                    totalTrajectories += count || 0;
                });
            }
            
            if (totalTrajectories > 0) {
                points.push({
                    x: distanceNum,
                    y: totalTrajectories
                });
            }
        });
        
        // 按距离排序
        return points.sort((a, b) => a.x - b.x);
    }

    // 计算特定范围的火力数据
    calculateRangeData(cannonDataJson, horizontalRange, verticalRange) {
        const points = [];
        
        Object.keys(cannonDataJson).forEach(distance => {
            const distanceNum = parseInt(distance);
            if (isNaN(distanceNum)) return;
            
            const distanceData = cannonDataJson[distance];
            let totalTrajectories = 0;
            
            // 计算水平偏移范围内的弹道数量
            if (distanceData.水平偏移) {
                Object.entries(distanceData.水平偏移).forEach(([offset, count]) => {
                    const offsetNum = parseInt(offset);
                    if (offsetNum >= horizontalRange.min && offsetNum <= horizontalRange.max) {
                        totalTrajectories += count || 0;
                    }
                });
            }
            
            // 计算垂直偏移范围内的弹道数量
            if (distanceData.垂直偏移) {
                Object.entries(distanceData.垂直偏移).forEach(([offset, count]) => {
                    const offsetNum = parseInt(offset);
                    if (offsetNum >= verticalRange.min && offsetNum <= verticalRange.max) {
                        totalTrajectories += count || 0;
                    }
                });
            }
            
            if (totalTrajectories > 0) {
                points.push({
                    x: distanceNum,
                    y: totalTrajectories
                });
            }
        });
        
        return points.sort((a, b) => a.x - b.x);
    }

    // 应用预设范围
    applyPresetRange(presetType) {
        let title, horizontalRange, verticalRange;
        
        switch (presetType) {
            case 'comprehensive':
                title = '综合火力曲线 - 射程与弹道';
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: -40, max: 170 };
                break;
            case 'flat':
                title = '平射火力曲线 - 射程与弹道';
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: 0, max: 40 };
                break;
            case 'high':
                title = '高射火力曲线 - 射程与弹道';
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: 40, max: 80 };
                break;
            case 'antiair':
                title = '防空火力曲线 - 射程与弹道';
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: 80, max: 170 };
                break;
            case 'halfaxis':
                title = '半轴火力曲线 - 射程与弹道';
                horizontalRange = { min: 0, max: 40 };
                verticalRange = { min: -40, max: 170 };
                break;
            default:
                return;
        }
        
        this.currentRange = { horizontal: horizontalRange, vertical: verticalRange };
        this.updateChartTitle(title);
        this.updateAllDatasets();
    }

    // 应用自定义范围
    applyCustomRange(horizontalRange, verticalRange) {
        this.currentRange = { horizontal: horizontalRange, vertical: verticalRange };
        
        const title = `自定义火力曲线 - 水平[${horizontalRange.min},${horizontalRange.max}] 垂直[${verticalRange.min},${verticalRange.max}]`;
        this.updateChartTitle(title);
        this.updateAllDatasets();
    }

    // 更新所有数据集
    updateAllDatasets() {
        this.datasets.forEach((item, filename) => {
            if (this.visibleDatasets.has(filename)) {
                const newData = this.calculateRangeData(
                    item.rawData, 
                    this.currentRange.horizontal, 
                    this.currentRange.vertical
                );
                item.dataset.data = newData;
            }
        });
        
        this.updateChart();
    }

    // 显示/隐藏火炮数据
    toggleCannonVisibility(filename) {
        if (this.visibleDatasets.has(filename)) {
            this.visibleDatasets.delete(filename);
        } else {
            this.visibleDatasets.add(filename);
        }
        
        this.updateChart();
        return this.visibleDatasets.has(filename);
    }

    // 显示所有火炮
    showAllCannons() {
        this.datasets.forEach((item, filename) => {
            this.visibleDatasets.add(filename);
        });
        this.updateChart();
    }

    // 隐藏所有火炮
    hideAllCannons() {
        this.visibleDatasets.clear();
        this.updateChart();
    }

    // 更新图表
    updateChart() {
        const visibleDatasets = [];
        let maxY = 0;
        
        this.datasets.forEach((item, filename) => {
            if (this.visibleDatasets.has(filename)) {
                visibleDatasets.push(item.dataset);
                
                // 计算最大Y值
                item.dataset.data.forEach(point => {
                    if (point.y > maxY) maxY = point.y;
                });
            }
        });
        
        // 动态调整Y轴最大值
        this.chart.options.scales.y.max = Math.ceil((maxY + 100) / 100) * 100;
        
        this.chart.data.datasets = visibleDatasets;
        this.chart.update('none'); // 无动画更新，提高性能
    }

    // 更新图表标题
    updateChartTitle(title) {
        const titleElement = document.getElementById('chart-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    // 获取可见的火炮列表
    getVisibleCannons() {
        const visible = [];
        this.visibleDatasets.forEach(filename => {
            if (this.datasets.has(filename)) {
                visible.push(this.datasets.get(filename).cannon);
            }
        });
        return visible;
    }

    // 清空所有数据
    clearAllData() {
        this.datasets.clear();
        this.visibleDatasets.clear();
        this.updateChart();
    }

    // 移除特定火炮数据
    removeCannonData(filename) {
        this.datasets.delete(filename);
        this.visibleDatasets.delete(filename);
        this.updateChart();
    }

    // 获取统计信息
    getChartStats() {
        return {
            总数据集: this.datasets.size,
            可见数据集: this.visibleDatasets.size,
            当前范围: this.currentRange
        };
    }
}

// 创建全局图表管理器实例
window.chartManager = new CannonChartManager('main-chart');