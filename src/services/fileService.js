// 文件上传服务
// 注意：这是前端模拟实现，实际项目中需要连接真实的后端服务

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.chronovault.example.com';

/**
 * 上传文件到后端服务
 * @param {File} file - 要上传的文件
 * @returns {Promise<string>} 返回文件ID
 */
export const uploadFile = async (file) => {
    try {
        // 模拟文件上传过程
        const formData = new FormData();
        formData.append('file', file);

        // 在实际项目中，这里应该是真实的API调用
        // const response = await fetch(`${API_BASE_URL}/upload`, {
        //   method: 'POST',
        //   body: formData,
        // });

        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // 模拟成功响应，返回一个假的文件ID
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 在本地存储中保存文件信息（仅用于演示）
        const fileInfo = {
            id: fileId,
            name: file.name,
            size: file.size,
            type: file.type.split('/')[0], // image, audio, video
            mimeType: file.type,
            uploadedAt: new Date().toISOString(),
            // 在实际项目中，这里应该是服务器返回的URL
            url: URL.createObjectURL(file),
        };

        // 保存到localStorage（仅用于演示）
        const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
        existingFiles[fileId] = fileInfo;
        localStorage.setItem('uploadedFiles', JSON.stringify(existingFiles));

        console.log('文件上传成功:', fileInfo);
        return fileId;
    } catch (error) {
        console.error('文件上传失败:', error);
        throw new Error('文件上传失败');
    }
};

/**
 * 根据文件ID获取文件信息
 * @param {string} fileId - 文件ID
 * @returns {Promise<Object>} 文件信息
 */
export const getFileById = async (fileId) => {
    try {
        // 在实际项目中，这里应该是API调用
        // const response = await fetch(`${API_BASE_URL}/files/${fileId}`);
        // const fileInfo = await response.json();

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 从localStorage获取文件信息（仅用于演示）
        const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
        const fileInfo = existingFiles[fileId];

        if (!fileInfo) {
            throw new Error('文件不存在');
        }

        return fileInfo;
    } catch (error) {
        console.error('获取文件失败:', error);
        throw new Error('获取文件失败');
    }
};

/**
 * 删除文件
 * @param {string} fileId - 文件ID
 * @returns {Promise<boolean>} 删除结果
 */
export const deleteFile = async (fileId) => {
    try {
        // 在实际项目中，这里应该是API调用
        // const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        //   method: 'DELETE',
        // });

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 从localStorage删除文件信息（仅用于演示）
        const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
        delete existingFiles[fileId];
        localStorage.setItem('uploadedFiles', JSON.stringify(existingFiles));

        console.log('文件删除成功:', fileId);
        return true;
    } catch (error) {
        console.error('删除文件失败:', error);
        throw new Error('删除文件失败');
    }
};

/**
 * 获取文件列表
 * @param {Object} options - 查询选项
 * @returns {Promise<Array>} 文件列表
 */
export const getFileList = async (options = {}) => {
    try {
        // 在实际项目中，这里应该是API调用
        // const queryParams = new URLSearchParams(options);
        // const response = await fetch(`${API_BASE_URL}/files?${queryParams}`);
        // const files = await response.json();

        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 从localStorage获取文件列表（仅用于演示）
        const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '{}');
        const fileList = Object.values(existingFiles);

        // 应用筛选条件
        let filteredFiles = fileList;

        if (options.type) {
            filteredFiles = filteredFiles.filter(file => file.type === options.type);
        }

        if (options.limit) {
            filteredFiles = filteredFiles.slice(0, options.limit);
        }

        // 按上传时间排序
        filteredFiles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

        return filteredFiles;
    } catch (error) {
        console.error('获取文件列表失败:', error);
        throw new Error('获取文件列表失败');
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