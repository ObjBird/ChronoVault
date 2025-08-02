// 封印和文件管理的辅助函数

import { getFilesBySealId, getFileById } from '../services/fileService';

/**
 * 格式化交易哈希显示
 * @param {string} hash - 交易哈希
 * @param {number} startChars - 开头显示的字符数
 * @param {number} endChars - 结尾显示的字符数
 * @returns {string} 格式化后的哈希
 */
export const formatTxHash = (hash, startChars = 6, endChars = 4) => {
    if (!hash || hash.length <= startChars + endChars) {
        return hash;
    }
    return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
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
 * 获取文件类型的图标名称
 * @param {string} type - 文件类型 (image, audio, video)
 * @returns {string} 图标名称
 */
export const getFileTypeIcon = (type) => {
    switch (type) {
        case 'image': return '🖼️';
        case 'audio': return '🎵';
        case 'video': return '🎬';
        default: return '📄';
    }
};

/**
 * 检查文件是否可以预览
 * @param {string} mimeType - 文件MIME类型
 * @returns {boolean} 是否可以预览
 */
export const isPreviewable = (mimeType) => {
    const previewableMimes = [
        // 图片
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // 音频
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg',
        // 视频
        'video/mp4', 'video/webm', 'video/mov', 'video/avi'
    ];

    return previewableMimes.includes(mimeType.toLowerCase());
};

/**
 * 获取封印的统计信息
 * @param {Object} seal - 封印对象
 * @returns {Promise<Object>} 统计信息
 */
export const getSealStats = async (seal) => {
    const stats = {
        totalFiles: 0,
        totalSize: 0,
        fileTypes: {
            image: 0,
            audio: 0,
            video: 0,
            other: 0
        }
    };

    if (!seal.mediaIds) {
        return stats;
    }

    try {
        const files = await getFilesBySealId(seal.id);

        stats.totalFiles = files.length;

        files.forEach(file => {
            stats.totalSize += file.size;
            stats.fileTypes[file.type] = (stats.fileTypes[file.type] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('获取封印统计信息失败:', error);
        return stats;
    }
};

/**
 * 验证封印是否可以解锁
 * @param {Object} seal - 封印对象
 * @returns {Object} 解锁状态信息
 */
export const checkUnlockStatus = (seal) => {
    const now = Date.now();
    const unlockTime = seal.unlockTime * 1000;
    const isUnlocked = unlockTime <= now;

    if (isUnlocked) {
        return {
            canUnlock: true,
            timeRemaining: 0,
            message: '封印已解锁'
        };
    }

    const timeRemaining = unlockTime - now;
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    let message = '';
    if (days > 0) {
        message = `还需等待 ${days} 天 ${hours} 小时`;
    } else if (hours > 0) {
        message = `还需等待 ${hours} 小时 ${minutes} 分钟`;
    } else {
        message = `还需等待 ${minutes} 分钟`;
    }

    return {
        canUnlock: false,
        timeRemaining,
        message,
        days,
        hours,
        minutes
    };
};

/**
 * 生成封印的分享信息
 * @param {Object} seal - 封印对象
 * @returns {Object} 分享信息
 */
export const generateShareInfo = (seal) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/seal/${seal.id}`;

    const title = `时间封印: ${seal.parsedContent.title}`;

    let description = '';
    if (seal.isUnlocked) {
        const content = seal.parsedContent.content;
        description = content.length > 100 ? content.slice(0, 100) + '...' : content;
    } else {
        const unlockStatus = checkUnlockStatus(seal);
        description = `这是一个时间封印，${unlockStatus.message}后解锁`;
    }

    return {
        title,
        description,
        url: shareUrl,
        hashtags: ['ChronoVault', '时间封印', '区块链']
    };
};

/**
 * 下载文件
 * @param {Object} file - 文件对象
 */
export const downloadFile = (file) => {
    try {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('下载文件失败:', error);
        throw new Error('下载文件失败');
    }
};

/**
 * 批量下载封印的所有文件
 * @param {string} sealId - 封印ID
 * @param {string} sealTitle - 封印标题
 */
export const downloadAllSealFiles = async (sealId, sealTitle = '封印文件') => {
    try {
        const files = await getFilesBySealId(sealId);

        if (files.length === 0) {
            throw new Error('没有可下载的文件');
        }

        // 如果只有一个文件，直接下载
        if (files.length === 1) {
            downloadFile(files[0]);
            return;
        }

        // 多个文件时，逐个下载（浏览器限制，无法直接创建ZIP）
        for (let i = 0; i < files.length; i++) {
            setTimeout(() => {
                downloadFile(files[i]);
            }, i * 1000); // 每秒下载一个文件，避免浏览器阻止
        }

    } catch (error) {
        console.error('批量下载失败:', error);
        throw new Error(`批量下载失败: ${error.message}`);
    }
};

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 复制是否成功
 */
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textArea);
            return success;
        }
    } catch (error) {
        console.error('复制到剪贴板失败:', error);
        return false;
    }
};

/**
 * 验证封印内容
 * @param {string} content - 封印内容
 * @param {Array} files - 文件数组
 * @returns {Object} 验证结果
 */
export const validateSealContent = (content, files = []) => {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    // 检查内容
    if (!content || content.trim().length === 0) {
        result.valid = false;
        result.errors.push('封印内容不能为空');
    }

    if (content && content.length > 10000) {
        result.warnings.push('封印内容过长，建议控制在10000字符以内');
    }

    // 检查文件
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxTotalSize = 500 * 1024 * 1024; // 500MB

    if (totalSize > maxTotalSize) {
        result.valid = false;
        result.errors.push(`文件总大小超过限制（${formatFileSize(maxTotalSize)}）`);
    }

    if (files.length > 20) {
        result.warnings.push('文件数量较多，可能影响加载性能');
    }

    return result;
}; 