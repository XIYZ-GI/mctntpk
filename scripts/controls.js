// 控制面板管理类
class ControlsManager {
    constructor() {
        this.init();
    }

    init() {
        this.initRangeControls();
        this.initPresetButtons();
        this.initGlobalControls();
    }

    // 初始化范围控制
    initRangeControls() {
        const horizontalMin = document.getElementById('horizontal-min');
        const horizontalMax = document.getElementById('horizontal-max');
        const verticalMin = document.getElementById('vertical-min');
        const verticalMax = document.getElementById('vertical-max');
        const applyBtn = document.getElementById('apply-range-btn');

        // 输入验证
        [horizontalMin, horizontalMax].forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value < -200) e.target.value = -200;
                if (value > 200) e.target.value = 200;
                this.validateRangeInputs();
            });
        });

        [verticalMin, verticalMax].forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (value < -40) e.target.value = -40;
                if (value > 170) e.target.value = 170;
                this.validateRangeInputs();
            });
        });

        // 应用范围按钮
        applyBtn.addEventListener('click', () => {
            this.applyCustomRange();
        });

        // 回车键应用
        [horizontalMin, horizontalMax, verticalMin, verticalMax].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.applyCustomRange();
                }
            });
        });
    }

    // 验证范围输入
    validateRangeInputs() {
        const horizontalMin = parseInt(document.getElementById('horizontal-min').value);
        const horizontalMax = parseInt(document.getElementById('horizontal-max').value);
        const verticalMin = parseInt(document.getElementById('vertical-min').value);
        const verticalMax = parseInt(document.getElementById('vertical-max').value);
        const applyBtn = document.getElementById('apply-range-btn');

        const isValid = (
            !isNaN(horizontalMin) && !isNaN(horizontalMax) &&
            !isNaN(verticalMin) && !isNaN(verticalMax) &&
            horizontalMin < horizontalMax &&
            verticalMin < verticalMax
        );

        applyBtn.disabled = !isValid;
        
        if (isValid) {
            applyBtn.classList.remove('btn-disabled');
            applyBtn.classList.add('btn-primary');
        } else {
            applyBtn.classList.add('btn-disabled');
            applyBtn.classList.remove('btn-primary');
        }
    }

    // 应用自定义范围
    applyCustomRange() {
        const horizontalMin = parseInt(document.getElementById('horizontal-min').value);
        const horizontalMax = parseInt(document.getElementById('horizontal-max').value);
        const verticalMin = parseInt(document.getElementById('vertical-min').value);
        const verticalMax = parseInt(document.getElementById('vertical-max').value);

        if (isNaN(horizontalMin) || isNaN(horizontalMax) || isNaN(verticalMin) || isNaN(verticalMax)) {
            this.showNotification('请输入有效的数值范围', 'error');
            return;
        }

        if (horizontalMin >= horizontalMax || verticalMin >= verticalMax) {
            this.showNotification('最小值必须小于最大值', 'error');
            return;
        }

        // 清除预设按钮的激活状态
        this.clearPresetSelection();

        // 应用范围到图表
        window.chartManager.applyCustomRange(
            { min: horizontalMin, max: horizontalMax },
            { min: verticalMin, max: verticalMax }
        );

        this.showNotification('范围设置已应用', 'success');
        
        // 保存设置到本地存储
        this.saveRangeSettings(horizontalMin, horizontalMax, verticalMin, verticalMax);
    }

    // 初始化预设按钮
    initPresetButtons() {
        const presetButtons = document.querySelectorAll('.btn-preset');
        
        presetButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const presetType = e.target.dataset.preset;
                this.applyPreset(presetType, button);
            });
        });
    }

    // 应用预设
    applyPreset(presetType, buttonElement) {
        // 清除所有预设按钮的激活状态
        this.clearPresetSelection();
        
        // 激活当前按钮
        buttonElement.classList.add('active');
        
        // 应用预设到图表
        window.chartManager.applyPresetRange(presetType);
        
        // 更新范围输入框
        this.updateRangeInputs(presetType);
        
        this.showNotification(`已应用${buttonElement.textContent}预设`, 'success');
        
        // 保存预设选择
        this.savePresetSelection(presetType);
    }

    // 清除预设选择
    clearPresetSelection() {
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    // 更新范围输入框
    updateRangeInputs(presetType) {
        let horizontalRange, verticalRange;
        
        switch (presetType) {
            case 'comprehensive':
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: -40, max: 170 };
                break;
            case 'flat':
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: 0, max: 40 };
                break;
            case 'high':
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: 40, max: 80 };
                break;
            case 'antiair':
                horizontalRange = { min: -200, max: 200 };
                verticalRange = { min: 80, max: 170 };
                break;
            case 'halfaxis':
                horizontalRange = { min: 0, max: 40 };
                verticalRange = { min: -40, max: 170 };
                break;
            default:
                return;
        }
        
        document.getElementById('horizontal-min').value = horizontalRange.min;
        document.getElementById('horizontal-max').value = horizontalRange.max;
        document.getElementById('vertical-min').value = verticalRange.min;
        document.getElementById('vertical-max').value = verticalRange.max;
        
        this.validateRangeInputs();
    }

    // 初始化全局控制
    initGlobalControls() {
        const showAllBtn = document.getElementById('show-all-btn');
        const hideAllBtn = document.getElementById('hide-all-btn');

        showAllBtn.addEventListener('click', () => {
            window.chartManager.showAllCannons();
            this.updateCannonCardsVisibility();
            this.updateLegend();
            this.showNotification('已显示所有火炮', 'success');
        });

        hideAllBtn.addEventListener('click', () => {
            window.chartManager.hideAllCannons();
            this.updateCannonCardsVisibility();
            this.updateLegend();
            this.showNotification('已隐藏所有火炮', 'success');
        });
    }

    // 更新火炮卡片的可见性
    updateCannonCardsVisibility() {
        const visibleCannons = window.chartManager.getVisibleCannons();
        const visibleFilenames = new Set(visibleCannons.map(c => c.filename));
        
        document.querySelectorAll('.cannon-card').forEach(card => {
            const filename = card.dataset.filename;
            if (visibleFilenames.has(filename)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    }

    // 更新图例
    updateLegend() {
        const legendContainer = document.getElementById('legend-container');
        const visibleCannons = window.chartManager.getVisibleCannons();
        
        legendContainer.innerHTML = '';
        
        if (visibleCannons.length === 0) {
            legendContainer.innerHTML = '<p class="no-data">当前没有显示的火炮数据</p>';
            return;
        }
        
        visibleCannons.forEach(cannon => {
            const legendItem = this.createLegendItem(cannon);
            legendContainer.appendChild(legendItem);
        });
    }

    // 创建图例项
    createLegendItem(cannon) {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.style.setProperty('--cannon-color', cannon.颜色);
        
        item.innerHTML = `
            <div class="legend-color" style="background-color: ${cannon.颜色}"></div>
            <div class="legend-info">
                <div class="legend-name">${cannon.火炮名称}</div>
                <div class="legend-params">${cannon.火炮参数} - ${cannon.火炮作者}</div>
            </div>
        `;
        
        return item;
    }

    // 显示通知
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 保存范围设置
    async saveRangeSettings(hMin, hMax, vMin, vMax) {
        try {
            await window.cannonDB.saveSetting('customRange', {
                horizontal: { min: hMin, max: hMax },
                vertical: { min: vMin, max: vMax },
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('保存范围设置失败:', error);
        }
    }

    // 保存预设选择
    async savePresetSelection(presetType) {
        try {
            await window.cannonDB.saveSetting('selectedPreset', {
                type: presetType,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('保存预设选择失败:', error);
        }
    }

    // 加载保存的设置
    async loadSavedSettings() {
        try {
            const savedPreset = await window.cannonDB.getSetting('selectedPreset');
            const savedRange = await window.cannonDB.getSetting('customRange');
            
            if (savedPreset && savedPreset.type) {
                // 激活保存的预设
                const presetButton = document.querySelector(`[data-preset="${savedPreset.type}"]`);
                if (presetButton) {
                    this.applyPreset(savedPreset.type, presetButton);
                }
            } else if (savedRange) {
                // 应用保存的自定义范围
                const { horizontal, vertical } = savedRange;
                document.getElementById('horizontal-min').value = horizontal.min;
                document.getElementById('horizontal-max').value = horizontal.max;
                document.getElementById('vertical-min').value = vertical.min;
                document.getElementById('vertical-max').value = vertical.max;
                this.applyCustomRange();
            }
        } catch (error) {
            console.error('加载保存的设置失败:', error);
        }
    }

    // 重置所有设置
    resetAllSettings() {
        // 重置范围输入
        document.getElementById('horizontal-min').value = -200;
        document.getElementById('horizontal-max').value = 200;
        document.getElementById('vertical-min').value = -40;
        document.getElementById('vertical-max').value = 170;
        
        // 清除预设选择
        this.clearPresetSelection();
        
        // 应用综合预设
        const comprehensiveBtn = document.querySelector('[data-preset="comprehensive"]');
        if (comprehensiveBtn) {
            this.applyPreset('comprehensive', comprehensiveBtn);
        }
        
        this.showNotification('设置已重置', 'success');
    }
}

// 创建全局控制管理器实例
window.controlsManager = new ControlsManager();