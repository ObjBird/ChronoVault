// 文件上传服务 - 使用 IndexedDB 存储
import indexedDBService from './indexedDBService';

/**
 * 生成唯一文件ID
 * @returns {string} 文件ID
 */
const generateFileId = () => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 上传文件并存储到 IndexedDB
 * @param {File} file - 要上传的文件
 * @param {string} sealId - 关联的封印ID (可选)
 * @returns {Promise<string>} 返回文件ID
 */
export const uploadFile = async (file, sealId = null) => {
    try {
        // 验证文件
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        // 生成文件ID
        const fileId = generateFileId();

        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // 存储文件到 IndexedDB
        const fileData = await indexedDBService.storeFile(file, fileId, sealId);

        console.log('文件上传并存储成功:', fileData);
        return fileId;
    } catch (error) {
        console.error('文件上传失败:', error);
        throw new Error(`文件上传失败: ${error.message}`);
    }
};

/**
 * 批量上传文件
 * @param {File[]} files - 要上传的文件数组
 * @param {string} sealId - 关联的封印ID (可选)
 * @returns {Promise<string[]>} 返回文件ID数组
 */
export const uploadFiles = async (files, sealId = null) => {
    try {
        const uploadPromises = files.map(file => uploadFile(file, sealId));
        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('批量文件上传失败:', error);
        throw new Error(`批量文件上传失败: ${error.message}`);
    }
};

/**
 * 根据文件ID获取文件信息
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 文件信息
 */
export const getFileById = async (fileId) => {
    try {
        const fileInfo = await indexedDBService.getFileById(fileId);
        return fileInfo;
    } catch (error) {
        console.error('获取文件失败:', error);
        throw new Error(`获取文件失败: ${error.message}`);
    }
};

/**
 * 根据封印ID获取所有相关文件
 * @param {string} sealId - 封印ID
 * @returns {Promise<Array>} 文件列表
 */
export const getFilesBySealId = async (sealId) => {
    try {
        const files = await indexedDBService.getFilesBySealId(sealId);
        return files;
    } catch (error) {
        console.error('获取封印文件失败:', error);
        throw new Error(`获取封印文件失败: ${error.message}`);
    }
};

/**
 * 更新文件的封印ID关联
 * @param {string} fileId - 文件ID
 * @param {string} sealId - 封印ID
 * @returns {Promise<boolean>} 更新结果
 */
export const updateFileSealId = async (fileId, sealId) => {
    try {
        await indexedDBService.updateFileSealId(fileId, sealId);
        return true;
    } catch (error) {
        console.error('更新文件封印ID失败:', error);
        throw new Error(`更新文件封印ID失败: ${error.message}`);
    }
};

/**
 * 批量更新文件的封印ID关联
 * @param {string[]} fileIds - 文件ID数组
 * @param {string} sealId - 封印ID
 * @returns {Promise<boolean>} 更新结果
 */
export const updateFilesSealId = async (fileIds, sealId) => {
    try {
        const updatePromises = fileIds.map(fileId => updateFileSealId(fileId, sealId));
        await Promise.all(updatePromises);
        return true;
    } catch (error) {
        console.error('批量更新文件封印ID失败:', error);
        throw new Error(`批量更新文件封印ID失败: ${error.message}`);
    }
};

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<boolean>} 删除结果
 */
export const deleteFile = async (fileId) => {
    try {
        await indexedDBService.deleteFile(fileId);
        console.log('文件删除成功:', fileId);
        return true;
    } catch (error) {
        console.error('删除文件失败:', error);
        throw new Error(`删除文件失败: ${error.message}`);
    }
};

/**
 * 获取文件列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 文件列表
 */
export const getFileList = async (options = {}) => {
    try {
        let files = await indexedDBService.getAllFiles();

        // 应用筛选条件
        if (options.type) {
            files = files.filter(file => file.type === options.type);
        }

        if (options.sealId) {
            files = files.filter(file => file.sealId === options.sealId);
        }

        // 按上传时间排序
        files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        if (options.limit) {
            files = files.slice(0, options.limit);
        }

        return files;
    } catch (error) {
        console.error('获取文件列表失败:', error);
        throw new Error(`获取文件列表失败: ${error.message}`);
    }
};

/**
 * 验证文件类型和大小
 * @param {File} file - 要验证的文件
 * @param {Object} options - 验证选项
 * @returns {Object} 验证结果
 */
export const validateFile = (file, options = {}) => {
    const {
        maxSize = 100 * 1024 * 1024, // 默认100MB
        allowedTypes = ['image', 'audio', 'video'],
    } = options;

    const result = {
        valid: true,
        errors: [],
    };

    // 检查文件大小
    if (file.size > maxSize) {
        result.valid = false;
        result.errors.push(`文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`);
    }

    // 检查文件类型
    const fileType = file.type.split('/')[0];
    if (!allowedTypes.includes(fileType)) {
        result.valid = false;
        result.errors.push(`不支持的文件类型: ${file.type}`);
    }

    // 检查文件名
    if (!file.name || file.name.length > 255) {
        result.valid = false;
        result.errors.push('文件名无效或过长');
    }

    return result;
};

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} 文件扩展名
 */
export const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * 生成文件缩略图（仅适用于图片）
 * @param {File} file - 图片文件
 * @param {Object} options - 缩略图选项
 * @returns {Promise<string>} Base64格式的缩略图
 */
export const generateThumbnail = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            reject(new Error('只能为图片文件生成缩略图'));
            return;
        }

        const {
            width = 200,
            height = 200,
            quality = 0.8,
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // 计算缩放比例
            const scale = Math.min(width / img.width, height / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            canvas.width = scaledWidth;
            canvas.height = scaledHeight;

            // 绘制缩放后的图片
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

            // 转为Base64
            const thumbnail = canvas.toDataURL('image/jpeg', quality);
            resolve(thumbnail);
        };

        img.onerror = () => {
            reject(new Error('无法加载图片'));
        };

        img.src = URL.createObjectURL(file);
    });
};

/**
 * 从文件对象创建预览URL
 * @param {File} file - 文件对象
 * @returns {string} 预览URL
 */
export const createPreviewUrl = (file) => {
    return URL.createObjectURL(file);
};

/**
 * 释放预览URL
 * @param {string} url - 预览URL
 */
export const revokePreviewUrl = (url) => {
    URL.revokeObjectURL(url);
};

/**
 * 清理所有文件数据（用于开发/测试）
 * @returns {Promise<boolean>} 清理结果
 */
export const clearAllFiles = async () => {
    try {
        await indexedDBService.clearAll();
        console.log('所有文件数据已清理');
        return true;
    } catch (error) {
        console.error('清理文件数据失败:', error);
        throw new Error(`清理文件数据失败: ${error.message}`);
    }
}; 