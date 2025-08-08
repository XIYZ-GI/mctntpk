// 数据库管理类
class CannonDatabase {
    constructor() {
        this.dbName = 'MinecraftCannonDB';
        this.version = 1;
        this.db = null;
        this.init();
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('数据库打开失败');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('数据库连接成功');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // 创建火炮数据表
                if (!this.db.objectStoreNames.contains('cannons')) {
                    const store = this.db.createObjectStore('cannons', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // 创建索引
                    store.createIndex('author', 'author', { unique: false });
                    store.createIndex('name', 'name', { unique: false });
                }
            };
        });
    }

    // 添加火炮数据
    async addCannon(cannonData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cannons'], 'readwrite');
            const store = transaction.objectStore('cannons');
            
            const request = store.add(cannonData);
            
            request.onsuccess = () => {
                console.log('火炮数据添加成功');
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('火炮数据添加失败');
                reject(request.error);
            };
        });
    }

    // 获取所有火炮数据
    async getAllCannons() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cannons'], 'readonly');
            const store = transaction.objectStore('cannons');
            
            const request = store.getAll();
            
            request.onsuccess = () => {
                resolve(request.result);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // 删除火炮数据
    async deleteCannon(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cannons'], 'readwrite');
            const store = transaction.objectStore('cannons');
            
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log('火炮数据删除成功');
                resolve();
            };
            
            request.onerror = () => {
                console.error('火炮数据删除失败');
                reject(request.error);
            };
        });
    }

    // 获取所有作者
    async getAllAuthors() {
        const cannons = await this.getAllCannons();
        const authors = [...new Set(cannons.map(cannon => cannon.author))];
        return authors.filter(author => author && author.trim() !== '');
    }

    // 根据作者获取火炮
    async getCannonsByAuthor(author) {
        const cannons = await this.getAllCannons();
        return cannons.filter(cannon => cannon.author === author);
    }

    // 导入数据
    async importData(data) {
        const transaction = this.db.transaction(['cannons'], 'readwrite');
        const store = transaction.objectStore('cannons');
        
        // 清空现有数据
        await new Promise((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject();
        });
        
        // 导入新数据
        for (const cannon of data) {
            delete cannon.id; // 删除id，让数据库自动生成
            await new Promise((resolve, reject) => {
                const addRequest = store.add(cannon);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject();
            });
        }
    }

    // 导出数据
    async exportData() {
        return await this.getAllCannons();
    }
}

// 创建全局数据库实例
const cannonDB = new CannonDatabase();