// UI管理类
class UIManager {
    constructor() {
        this.currentDeleteId = null;
        this.initEventListeners();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 添加按钮
        document.getElementById('addBtn').addEventListener('click', () => {
            this.showAddModal();
        });

        // 删除按钮
        document.getElementById('deleteBtn').addEventListener('click', () => {
            this.showDeleteModal();
        });

        // 导入按钮
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // 导出按钮
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        // 显示/隐藏所有按钮
        document.getElementById('showAllBtn').addEventListener('click', () => {
            trajectoryChart.showAll();
            this.updateCannonList();
        });

        document.getElementById('hideAllBtn').addEventListener('click', () => {
            trajectoryChart.hideAll();
            this.updateCannonList();
        });

        // 模态框事件
        this.initModalEvents();
        
        // 文件导入事件
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileImport(e);
        });
    }

    // 初始化模态框事件
    initModalEvents() {
        // 关闭按钮
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // 点击模态框外部关闭
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // 添加模态框事件
        document.getElementById('applyBasicBtn').addEventListener('click', () => {
            this.applyBasicSettings();
        });

        document.getElementById('confirmAddBtn').addEventListener('click', () => {
            this.confirmAdd();
        });

        // 删除确认事件
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('confirmDeleteModal').style.display = 'none';
        });

        // 作者输入框事件
        document.getElementById('authorInput').addEventListener('input', (e) => {
            if (e.target.value.trim()) {
                document.getElementById('authorSelect').value = '';
            }
        });

        document.getElementById('authorSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                document.getElementById('authorInput').value = e.target.value;
            }
        });
    }

    // 显示添加模态框
    async showAddModal() {
        document.getElementById('addModal').style.display = 'block';
        document.getElementById('detailsForm').style.display = 'none';
        
        // 重置表单
        document.getElementById('maxRange').value = 1250;
        document.getElementById('sampleFreq').value = 50;
        document.getElementById('authorInput').value = '';
        document.getElementById('cannonName').value = '';
        document.getElementById('rangeCards').innerHTML = '';
        
        // 更新作者选择框
        await this.updateAuthorSelect();
    }

    // 更新作者选择框
    async updateAuthorSelect() {
        const authors = await cannonDB.getAllAuthors();
        const select = document.getElementById('authorSelect');
        
        select.innerHTML = '<option value="">选择已有作者</option>';
        authors.forEach(author => {
            const option = document.createElement('option');
            option.value = author;
            option.textContent = author;
            select.appendChild(option);
        });
    }

    // 应用基础设置
    applyBasicSettings() {
        const maxRange = parseInt(document.getElementById('maxRange').value);
        const sampleFreq = parseInt(document.getElementById('sampleFreq').value);
        
        if (maxRange < 100 || maxRange > 5000) {
            alert('极限射程必须在100-5000格之间');
            return;
        }
        
        if (sampleFreq < 10 || sampleFreq > 200) {
            alert('采样频率必须在10-200格之间');
            return;
        }
        
        this.generateRangeCards(maxRange, sampleFreq);
        document.getElementById('detailsForm').style.display = 'block';
    }

    // 生成射程卡片
    generateRangeCards(maxRange, sampleFreq) {
        const cardsContainer = document.getElementById('rangeCards');
        cardsContainer.innerHTML = '';
        
        // 从0开始，按采样频率递增
        for (let range = 0; range <= maxRange; range += sampleFreq) {
            const endRange = Math.min(range + sampleFreq, maxRange);
            
            const card = document.createElement('div');
            card.className = 'range-card';
            
            // 如果是第一个卡片（range=0），显示为0-50格
            const displayRange = range === 0 ? `0-${sampleFreq}格` : `${range}-${endRange}格`;
            
            card.innerHTML = `
                <h4>${displayRange}</h4>
                <div class="trajectory-group">
                    <label>-30~50格高度弹道数量:</label>
                    <input type="number" data-range="${range}" data-type="low" min="0" max="1000" value="0">
                </div>
                <div class="trajectory-group">
                    <label>50~130格高度弹道数量:</label>
                    <input type="number" data-range="${range}" data-type="medium" min="0" max="1000" value="0">
                </div>
                <div class="trajectory-group">
                    <label>130~170格高度弹道数量:</label>
                    <input type="number" data-range="${range}" data-type="high" min="0" max="1000" value="0">
                </div>
            `;
            
            cardsContainer.appendChild(card);
        }
    }

    // 确认添加火炮
    async confirmAdd() {
        const author = document.getElementById('authorInput').value.trim() || 
                      document.getElementById('authorSelect').value;
        const cannonName = document.getElementById('cannonName').value.trim();
        
        if (!author) {
            alert('请输入或选择作者名称');
            return;
        }
        
        if (!cannonName) {
            alert('请输入火炮名称');
            return;
        }
        
        // 收集弹道数据
        const trajectoryData = [];
        const rangeCards = document.querySelectorAll('.range-card');
        
        rangeCards.forEach(card => {
            const inputs = card.querySelectorAll('input[data-range]');
            const range = parseInt(inputs[0].dataset.range);
            
            const low = parseInt(inputs[0].value) || 0;
            const medium = parseInt(inputs[1].value) || 0;
            const high = parseInt(inputs[2].value) || 0;
            
            // 计算总弹道数量（所有高度的弹道数量相加）
            const total = low + medium + high;
            
            trajectoryData.push({
                range: range,
                low: low,
                medium: medium,
                high: high,
                total: total  // 添加总数
            });
        });
        
        // 创建火炮对象
        const cannonData = {
            author: author,
            name: cannonName,
            trajectoryData: trajectoryData,
            createdAt: new Date().toISOString()
        };
        
        try {
            await cannonDB.addCannon(cannonData);
            document.getElementById('addModal').style.display = 'none';
            await this.updateCannonList();
            alert('火炮添加成功！');
        } catch (error) {
            console.error('添加火炮失败:', error);
            alert('添加火炮失败，请重试');
        }
    }

    // 显示删除模态框
    async showDeleteModal() {
        document.getElementById('deleteModal').style.display = 'block';
        await this.updateDeleteList();
    }

    // 更新删除列表
    async updateDeleteList() {
        const cannons = await cannonDB.getAllCannons();
        const deleteList = document.getElementById('deleteCannonList');
        deleteList.innerHTML = '';
        
        if (cannons.length === 0) {
            deleteList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">暂无火炮数据</div>
                    <div style="font-size: 14px;">请先添加一些火炮数据</div>
                </div>
            `;
            return;
        }
        
        // 按作者分组
        const authorGroups = {};
        cannons.forEach(cannon => {
            if (!authorGroups[cannon.author]) {
                authorGroups[cannon.author] = [];
            }
            authorGroups[cannon.author].push(cannon);
        });
        
        // 生成删除列表
        Object.keys(authorGroups).forEach(author => {
            const authorGroup = document.createElement('div');
            authorGroup.className = 'delete-author-group';
            
            const authorTitle = document.createElement('div');
            authorTitle.className = 'delete-author-title';
            authorTitle.textContent = author;
            authorGroup.appendChild(authorTitle);
            
            authorGroups[author].forEach(cannon => {
                const cannonItem = document.createElement('div');
                cannonItem.className = 'delete-cannon-item';
                cannonItem.innerHTML = `
                    <span>${cannon.name}</span>
                    <span>🗑️</span>
                `;
                
                cannonItem.addEventListener('click', () => {
                    this.showDeleteConfirm(cannon.id, cannon.name);
                });
                
                authorGroup.appendChild(cannonItem);
            });
            
            deleteList.appendChild(authorGroup);
        });
    }

    // 显示删除确认
    showDeleteConfirm(cannonId, cannonName) {
        this.currentDeleteId = cannonId;
        document.getElementById('deleteConfirmText').textContent = 
            `确定要删除"${cannonName}"吗？`;
        document.getElementById('confirmDeleteModal').style.display = 'block';
    }

    // 确认删除
    async confirmDelete() {
        if (!this.currentDeleteId) return;
        
        try {
            await cannonDB.deleteCannon(this.currentDeleteId);
            document.getElementById('confirmDeleteModal').style.display = 'none';
            document.getElementById('deleteModal').style.display = 'none';
            await this.updateCannonList();
            alert('火炮删除成功！');
        } catch (error) {
            console.error('删除火炮失败:', error);
            alert('删除火炮失败，请重试');
        }
        
        this.currentDeleteId = null;
    }

    // 处理文件导入
    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (Array.isArray(data)) {
                // 处理导入的数据，确保包含total字段
                const processedData = data.map(cannon => {
                    if (cannon.trajectoryData && Array.isArray(cannon.trajectoryData)) {
                        cannon.trajectoryData = cannon.trajectoryData.map(rangeData => {
                            // 如果没有total字段，计算总数
                            if (typeof rangeData.total === 'undefined') {
                                rangeData.total = (rangeData.low || 0) + (rangeData.medium || 0) + (rangeData.high || 0);
                            }
                            return rangeData;
                        });
                    }
                    return cannon;
                });
                
                await cannonDB.importData(processedData);
                await this.updateCannonList();
                alert(`成功导入${data.length}个火炮数据！`);
            } else {
                alert('文件格式不正确，请选择有效的JSON文件');
            }
        } catch (error) {
            console.error('导入失败:', error);
            alert('导入失败，请检查文件格式');
        }
        
        // 清空文件选择
        event.target.value = '';
    }

    // 导出数据
    async exportData() {
        try {
            const data = await cannonDB.exportData();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `minecraft-cannons-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('数据导出成功！');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        }
    }

    // 更新火炮列表
    async updateCannonList() {
        const cannons = await cannonDB.getAllCannons();
        const cannonList = document.getElementById('cannonList');
        cannonList.innerHTML = '';
        
        if (cannons.length === 0) {
            cannonList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">
                    <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
                    <div style="font-size: 18px; margin-bottom: 10px;">暂无火炮数据</div>
                    <div style="font-size: 14px;">点击"添加"按钮开始创建火炮数据</div>
                </div>
            `;
            return;
        }
        
        // 按作者分组
        const authorGroups = {};
        cannons.forEach(cannon => {
            if (!authorGroups[cannon.author]) {
                authorGroups[cannon.author] = [];
            }
            authorGroups[cannon.author].push(cannon);
        });
        
        // 生成火炮列表
        Object.keys(authorGroups).forEach(author => {
            const authorGroup = document.createElement('div');
            authorGroup.className = 'author-group';
            
            const authorTitle = document.createElement('div');
            authorTitle.className = 'author-title';
            authorTitle.textContent = author;
            authorGroup.appendChild(authorTitle);
            
            authorGroups[author].forEach(cannon => {
                const cannonCard = document.createElement('div');
                cannonCard.className = 'cannon-card';
                cannonCard.textContent = cannon.name;
                
                // 设置卡片状态
                if (trajectoryChart && trajectoryChart.isVisible(cannon.id)) {
                    cannonCard.classList.add('active');
                } else {
                    cannonCard.classList.add('inactive');
                }
                
                cannonCard.addEventListener('click', () => {
                    this.toggleCannon(cannon.id, cannonCard);
                });
                
                authorGroup.appendChild(cannonCard);
            });
            
            cannonList.appendChild(authorGroup);
        });
    }

    // 切换火炮显示状态
    toggleCannon(cannonId, cardElement) {
        if (!trajectoryChart || !trajectoryChart.isReady()) {
            alert('图表未初始化，无法切换显示状态');
            return;
        }
        
        if (trajectoryChart.isVisible(cannonId)) {
            trajectoryChart.hideCannon(cannonId);
            cardElement.classList.remove('active');
            cardElement.classList.add('inactive');
        } else {
            trajectoryChart.showCannon(cannonId);
            cardElement.classList.remove('inactive');
            cardElement.classList.add('active');
        }
    }
}

// 创建全局UI管理实例
const uiManager = new UIManager();