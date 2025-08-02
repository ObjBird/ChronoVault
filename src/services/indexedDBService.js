// IndexedDB 文件存储服务
const DB_NAME = 'ChronoVaultFiles';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class IndexedDBService {
    constructor() {
        this.db = null;
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // 创建文件存储对象仓库
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                    // 创建索引
                    store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('sealId', 'sealId', { unique: false });
                }
            };
        });
    }

    // 确保数据库已初始化
    async ensureDB() {
        if (!this.db) {
            await this.init();
        }
        return this.db;
    }

    // 存储文件
    async storeFile(file, fileId, sealId = null) {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            // 将文件转换为 ArrayBuffer
            const reader = new FileReader();
            reader.onload = () => {
                // 在 FileReader 完成后创建事务，确保事务保持活跃
                const transaction = this.db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                const fileData = {
                    id: fileId,
                    name: file.name,
                    size: file.size,
                    type: file.type.split('/')[0], // image, audio, video
                    mimeType: file.type,
                    data: reader.result, // ArrayBuffer
                    uploadedAt: new Date().toISOString(),
                    sealId: sealId, // 关联的封印ID
                };

                const request = store.add(fileData);

                request.onsuccess = () => {
                    console.log('文件存储到 IndexedDB 成功:', fileData.id);
                    resolve(fileData);
                };

                request.onerror = () => {
                    reject(new Error('存储文件到 IndexedDB 失败'));
                };

                transaction.onerror = () => {
                    reject(new Error('IndexedDB 事务失败'));
                };
            };

            reader.onerror = () => {
                reject(new Error('读取文件失败'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // 根据ID获取文件
    async getFileById(fileId) {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(fileId);

            request.onsuccess = () => {
                if (request.result) {
                    // 将 ArrayBuffer 转换回 Blob
                    const blob = new Blob([request.result.data], { type: request.result.mimeType });
                    const fileInfo = {
                        ...request.result,
                        url: URL.createObjectURL(blob),
                        blob: blob,
                    };
                    delete fileInfo.data; // 移除原始 ArrayBuffer 数据
                    resolve(fileInfo);
                } else {
                    reject(new Error('文件不存在'));
                }
            };

            request.onerror = () => {
                reject(new Error('获取文件失败'));
            };
        });
    }

    // 根据封印ID获取相关文件
    async getFilesBySealId(sealId) {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index('sealId');
            const request = index.getAll(sealId);

            request.onsuccess = () => {
                const files = request.result.map(fileData => {
                    const blob = new Blob([fileData.data], { type: fileData.mimeType });
                    return {
                        ...fileData,
                        url: URL.createObjectURL(blob),
                        blob: blob,
                    };
                });
                resolve(files);
            };

            request.onerror = () => {
                reject(new Error('获取文件列表失败'));
            };
        });
    }

    // 删除文件
    async deleteFile(fileId) {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(fileId);

            request.onsuccess = () => {
                console.log('文件删除成功:', fileId);
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error('删除文件失败'));
            };
        });
    }

    // 获取所有文件
    async getAllFiles() {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const files = request.result.map(fileData => {
                    // 不包含原始数据，只返回元信息
                    const { data, ...fileInfo } = fileData;
                    return fileInfo;
                });
                resolve(files);
            };

            request.onerror = () => {
                reject(new Error('获取文件列表失败'));
            };
        });
    }

    // 更新文件的封印ID
    async updateFileSealId(fileId, sealId) {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // 先获取文件数据
            const getRequest = store.get(fileId);

            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    const fileData = getRequest.result;
                    fileData.sealId = sealId;

                    // 更新文件数据
                    const putRequest = store.put(fileData);

                    putRequest.onsuccess = () => {
                        console.log('文件封印ID更新成功:', fileId, sealId);
                        resolve(true);
                    };

                    putRequest.onerror = () => {
                        reject(new Error('更新文件封印ID失败'));
                    };
                } else {
                    reject(new Error('文件不存在'));
                }
            };

            getRequest.onerror = () => {
                reject(new Error('获取文件失败'));
            };
        });
    }

    // 清理所有数据
    async clearAll() {
        await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                console.log('所有文件数据已清理');
                resolve(true);
            };

            request.onerror = () => {
                reject(new Error('清理数据失败'));
            };
        });
    }
}

// 创建单例实例
const indexedDBService = new IndexedDBService();

export default indexedDBService; 