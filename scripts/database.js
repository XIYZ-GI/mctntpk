// 数据库管理类
class CannonDatabase {
    constructor() {
        this.db = new Dexie('CannonDataDB');
        this.initDatabase();
    }

    initDatabase() {
        // 定义数据库结构
        this.db.version(1).stores({
            cannons: 'filename, 火炮作者, 火炮名称, 火炮参数, 颜色, 火炮数据json',
            settings: 'key, value'
        });

        this.db.open().catch(err => {
            console.error('数据库打开失败:', err);
        });
    }

    // 保存火炮数据
    async saveCannon(cannonData) {
        try {
            await this.db.cannons.put(cannonData);
            console.log('火炮数据已保存:', cannonData.filename);
        } catch (error) {
            console.error('保存火炮数据失败:', error);
            throw error;
        }
    }

    // 获取所有火炮数据
    async getAllCannons() {
        try {
            return await this.db.cannons.toArray();
        } catch (error) {
            console.error('获取火炮数据失败:', error);
            return [];
        }
    }

    // 根据文件名获取火炮数据
    async getCannonByFilename(filename) {
        try {
            return await this.db.cannons.get(filename);
        } catch (error) {
            console.error('获取火炮数据失败:', error);
            return null;
        }
    }

    // 根据作者获取火炮数据
    async getCannonsByAuthor(author) {
        try {
            return await this.db.cannons.where('火炮作者').equals(author).toArray();
        } catch (error) {
            console.error('获取作者火炮数据失败:', error);
            return [];
        }
    }

    // 删除火炮数据
    async deleteCannon(filename) {
        try {
            await this.db.cannons.delete(filename);
            console.log('火炮数据已删除:', filename);
        } catch (error) {
            console.error('删除火炮数据失败:', error);
            throw error;
        }
    }

    // 清空所有数据
    async clearAllData() {
        try {
            await this.db.cannons.clear();
            console.log('所有火炮数据已清空');
        } catch (error) {
            console.error('清空数据失败:', error);
            throw error;
        }
    }

    // 保存设置
    async saveSetting(key, value) {
        try {
            await this.db.settings.put({ key, value });
        } catch (error) {
            console.error('保存设置失败:', error);
            throw error;
        }
    }

    // 获取设置
    async getSetting(key, defaultValue = null) {
        try {
            const setting = await this.db.settings.get(key);
            return setting ? setting.value : defaultValue;
        } catch (error) {
            console.error('获取设置失败:', error);
            return defaultValue;
        }
    }

    // 获取数据库统计信息
    async getStats() {
        try {
            const cannonCount = await this.db.cannons.count();
            const authors = await this.db.cannons.orderBy('火炮作者').uniqueKeys();
            
            return {
                总火炮数量: cannonCount,
                作者数量: authors.length,
                作者列表: authors
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return {
                总火炮数量: 0,
                作者数量: 0,
                作者列表: []
            };
        }
    }

    // 检查是否存在某个文件
    async hasFile(filename) {
        try {
            const cannon = await this.db.cannons.get(filename);
            return !!cannon;
        } catch (error) {
            console.error('检查文件存在性失败:', error);
            return false;
        }
    }

    // 批量保存火炮数据
    async saveCannons(cannonsData) {
        try {
            await this.db.cannons.bulkPut(cannonsData);
            console.log(`批量保存了 ${cannonsData.length} 个火炮数据`);
        } catch (error) {
            console.error('批量保存火炮数据失败:', error);
            throw error;
        }
    }

    // 导出数据库数据
    async exportData() {
        try {
            const cannons = await this.getAllCannons();
            const settings = await this.db.settings.toArray();
            
            return {
                cannons,
                settings,
                exportTime: new Date().toISOString(),
                version: '1.0.0'
            };
        } catch (error) {
            console.error('导出数据失败:', error);
            throw error;
        }
    }

    // 导入数据库数据
    async importData(data) {
        try {
            if (data.cannons && Array.isArray(data.cannons)) {
                await this.db.cannons.bulkPut(data.cannons);
            }
            
            if (data.settings && Array.isArray(data.settings)) {
                await this.db.settings.bulkPut(data.settings);
            }
            
            console.log('数据导入成功');
        } catch (error) {
            console.error('导入数据失败:', error);
            throw error;
        }
    }
}

// 创建全局数据库实例
window.cannonDB = new CannonDatabase();