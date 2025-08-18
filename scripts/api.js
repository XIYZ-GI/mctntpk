// API接口管理类
class CannonAPI {
    constructor(baseURL = 'http://api.tntpk.oooiai.com') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API请求失败 (${endpoint}):`, error);
            throw error;
        }
    }

    // 获取缓存的数据
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // 设置缓存数据
    setCachedData(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // 健康检查
    async healthCheck() {
        try {
            const data = await this.request('/health');
            return data.status === 'healthy';
        } catch (error) {
            console.error('API健康检查失败:', error);
            return false;
        }
    }

    // 获取所有火炮文件列表
    async getCannonList() {
        const cacheKey = 'cannon_list';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const data = await this.request('/cannons/list');
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('获取火炮列表失败:', error);
            return { files: [] };
        }
    }

    // 获取所有火炮基础信息
    async getAllCannons() {
        const cacheKey = 'all_cannons';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const data = await this.request('/cannons/all');
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('获取所有火炮信息失败:', error);
            return { cannons: [] };
        }
    }

    // 根据文件名获取火炮详细数据
    async getCannonData(filename) {
        const cacheKey = `cannon_${filename}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const data = await this.request(`/cannons/data/${encodeURIComponent(filename)}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`获取火炮数据失败 (${filename}):`, error);
            return null;
        }
    }

    // 根据作者获取火炮列表
    async getCannonsByAuthor(author) {
        const cacheKey = `author_${author}`;
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const data = await this.request(`/cannons/by-author/${encodeURIComponent(author)}`);
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`获取作者火炮列表失败 (${author}):`, error);
            return { cannons: [] };
        }
    }

    // 获取所有作者列表
    async getAuthors() {
        const cacheKey = 'authors';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const data = await this.request('/cannons/authors');
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('获取作者列表失败:', error);
            return { authors: [] };
        }
    }

    // 获取统计信息
    async getStatistics() {
        const cacheKey = 'statistics';
        const cached = this.getCachedData(cacheKey);
        
        if (cached) {
            return cached;
        }

        try {
            const data = await this.request('/cannons/stats');
            this.setCachedData(cacheKey, data);
            return data;
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return {
                总火炮数量: 0,
                作者数量: 0,
                作者列表: []
            };
        }
    }

    // 批量获取火炮详细数据
    async batchGetCannonData(filenames) {
        const results = [];
        
        // 分批处理，避免并发请求过多
        const batchSize = 5;
        for (let i = 0; i < filenames.length; i += batchSize) {
            const batch = filenames.slice(i, i + batchSize);
            const batchPromises = batch.map(filename => this.getCannonData(filename));
            
            try {
                const batchResults = await Promise.allSettled(batchPromises);
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled' && result.value) {
                        results.push({
                            filename: batch[index],
                            data: result.value
                        });
                    } else {
                        console.warn(`获取火炮数据失败: ${batch[index]}`);
                    }
                });
            } catch (error) {
                console.error('批量获取火炮数据失败:', error);
            }
        }
        
        return results;
    }

    // 清空缓存
    clearCache() {
        this.cache.clear();
        console.log('API缓存已清空');
    }

    // 清空特定缓存
    clearCacheByKey(key) {
        this.cache.delete(key);
        console.log(`缓存已清空: ${key}`);
    }

    // 预加载数据
    async preloadData() {
        try {
            console.log('开始预加载数据...');
            
            // 并行加载基础数据
            const [cannonsData, authorsData] = await Promise.allSettled([
                this.getAllCannons(),
                this.getAuthors()
            ]);

            console.log('预加载完成');
            
            return {
                cannons: cannonsData.status === 'fulfilled' ? cannonsData.value : { cannons: [] },
                authors: authorsData.status === 'fulfilled' ? authorsData.value : { authors: [] }
            };
        } catch (error) {
            console.error('预加载数据失败:', error);
            return {
                cannons: { cannons: [] },
                authors: { authors: [] }
            };
        }
    }

    // 检查API连通性
    async checkConnectivity() {
        try {
            await this.request('/');
            return true;
        } catch (error) {
            console.warn('API连通性检查失败:', error);
            return false;
        }
    }
}

// 创建全局API实例
window.cannonAPI = new CannonAPI();