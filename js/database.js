// 数据库管理类
class CannonDatabase {
    constructor() {
        this.dbName = 'MinecraftCannonDB';
        this.version = 1;
        this.db = null;
        this.isReady = false;
    }

    // 初始化数据库
    async init() {
        try {
            // 检查浏览器是否支持IndexedDB
            if (!window.indexedDB) {
                console.warn('浏览器不支持IndexedDB，使用localStorage作为备用');
                return this.initLocalStorage();
            }

            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);

                request.onerror = () => {
                    console.error('IndexedDB打开失败，切换到localStorage');
                    this.initLocalStorage().then(resolve).catch(reject);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    this.isReady = true;
                    console.log('IndexedDB连接成功');
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    try {
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
                        console.log('数据库结构创建成功');
                    } catch (error) {
                        console.error('数据库结构创建失败:', error);
                        reject(error);
                    }
                };

                // 设置超时
                setTimeout(() => {
                    if (!this.isReady) {
                        console.warn('IndexedDB初始化超时，切换到localStorage');
                        this.initLocalStorage().then(resolve).catch(reject);
                    }
                }, 5000);
            });
        } catch (error) {
            console.error('数据库初始化失败:', error);
            return this.initLocalStorage();
        }
    }

    // 初始化localStorage作为备用存储
    async initLocalStorage() {
        try {
            this.useLocalStorage = true;
            this.isReady = true;
            
            // 检查localStorage是否可用
            const testKey = 'test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            console.log('localStorage初始化成功');
            return Promise.resolve();
        } catch (error) {
            console.error('localStorage也不可用:', error);
            // 使用内存存储作为最后备用方案
            this.useMemoryStorage = true;
            this.memoryStorage = [];
            this.isReady = true;
            console.log('使用内存存储作为备用方案');
            return Promise.resolve();
        }
    }

    // 添加火炮数据
    async addCannon(cannonData) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        if (this.useMemoryStorage) {
            const id = Date.now();
            const newCannon = { ...cannonData, id };
            this.memoryStorage.push(newCannon);
            return Promise.resolve(id);
        }

        if (this.useLocalStorage) {
            try {
                const cannons = this.getLocalStorageCannons();
                const id = Date.now();
                const newCannon = { ...cannonData, id };
                cannons.push(newCannon);
                localStorage.setItem('minecraft_cannons', JSON.stringify(cannons));
                return Promise.resolve(id);
            } catch (error) {
                console.error('localStorage添加失败:', error);
                throw error;
            }
        }

        return new Promise((resolve, reject) => {
            try {
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
            } catch (error) {
                reject(error);
            }
        });
    }

    // 获取所有火炮数据
    async getAllCannons() {
        if (!this.isReady) {
            return [];
        }

        if (this.useMemoryStorage) {
            return Promise.resolve([...this.memoryStorage]);
        }

        if (this.useLocalStorage) {
            try {
                return Promise.resolve(this.getLocalStorageCannons());
            } catch (error) {
                console.error('localStorage读取失败:', error);
                return [];
            }
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['cannons'], 'readonly');
                const store = transaction.objectStore('cannons');
                
                const request = store.getAll();
                
                request.onsuccess = () => {
                    resolve(request.result || []);
                };
                
                request.onerror = () => {
                    console.error('获取数据失败:', request.error);
                    resolve([]); // 发生错误时返回空数组而不是reject
                };
            } catch (error) {
                console.error('数据库操作失败:', error);
                resolve([]); // 发生错误时返回空数组
            }
        });
    }

    // 删除火炮数据
    async deleteCannon(id) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        if (this.useMemoryStorage) {
            const index = this.memoryStorage.findIndex(cannon => cannon.id === id);
            if (index > -1) {
                this.memoryStorage.splice(index, 1);
            }
            return Promise.resolve();
        }

        if (this.useLocalStorage) {
            try {
                const cannons = this.getLocalStorageCannons();
                const filteredCannons = cannons.filter(cannon => cannon.id !== id);
                localStorage.setItem('minecraft_cannons', JSON.stringify(filteredCannons));
                return Promise.resolve();
            } catch (error) {
                console.error('localStorage删除失败:', error);
                throw error;
            }
        }

        return new Promise((resolve, reject) => {
            try {
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
            } catch (error) {
                reject(error);
            }
        });
    }

    // 获取localStorage中的火炮数据
    getLocalStorageCannons() {
        try {
            const data = localStorage.getItem('minecraft_cannons');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('解析localStorage数据失败:', error);
            return [];
        }
    }

    // 获取所有作者
    async getAllAuthors() {
        try {
            const cannons = await this.getAllCannons();
            const authors = [...new Set(cannons.map(cannon => cannon.author))];
            return authors.filter(author => author && author.trim() !== '');
        } catch (error) {
            console.error('获取作者列表失败:', error);
            return [];
        }
    }

    // 根据作者获取火炮
    async getCannonsByAuthor(author) {
        try {
            const cannons = await this.getAllCannons();
            return cannons.filter(cannon => cannon.author === author);
        } catch (error) {
            console.error('根据作者获取火炮失败:', error);
            return [];
        }
    }

    // 导入数据
    async importData(data) {
        if (!this.isReady) {
            throw new Error('数据库未初始化');
        }

        if (this.useMemoryStorage) {
            this.memoryStorage = [];
            data.forEach((cannon, index) => {
                const newCannon = { ...cannon, id: Date.now() + index };
                this.memoryStorage.push(newCannon);
            });
            return Promise.resolve();
        }

        if (this.useLocalStorage) {
            try {
                const processedData = data.map((cannon, index) => ({
                    ...cannon,
                    id: Date.now() + index
                }));
                localStorage.setItem('minecraft_cannons', JSON.stringify(processedData));
                return Promise.resolve();
            } catch (error) {
                console.error('localStorage导入失败:', error);
                throw error;
            }
        }

        return new Promise(async (resolve, reject) => {
            try {
                const transaction = this.db.transaction(['cannons'], 'readwrite');
                const store = transaction.objectStore('cannons');
                
                // 清空现有数据
                await new Promise((resolveInner, rejectInner) => {
                    const clearRequest = store.clear();
                    clearRequest.onsuccess = () => resolveInner();
                    clearRequest.onerror = () => rejectInner(clearRequest.error);
                });
                
                // 导入新数据
                let completed = 0;
                const total = data.length;
                
                if (total === 0) {
                    resolve();
                    return;
                }
                
                data.forEach((cannon) => {
                    const cannonCopy = { ...cannon };
                    delete cannonCopy.id; // 删除id，让数据库自动生成
                    
                    const addRequest = store.add(cannonCopy);
                    addRequest.onsuccess = () => {
                        completed++;
                        if (completed === total) {
                            resolve();
                        }
                    };
                    addRequest.onerror = () => {
                        reject(addRequest.error);
                    };
                });
                
            } catch (error) {
                reject(error);
            }
        });
    }

    // 导出数据
    async exportData() {
        try {
            return await this.getAllCannons();
        } catch (error) {
            console.error('导出数据失败:', error);
            return [];
        }
    }

    // 检查数据库状态
    isInitialized() {
        return this.isReady;
    }

    // 获取存储类型
    getStorageType() {
        if (this.useMemoryStorage) return 'memory';
        if (this.useLocalStorage) return 'localStorage';
        return 'indexedDB';
    }
}

// 创建全局数据库实例
const cannonDB = new CannonDatabase();