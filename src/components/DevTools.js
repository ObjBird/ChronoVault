// 开发工具组件 - 用于管理 IndexedDB 文件数据
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Trash2, Download, RefreshCw, Info } from 'lucide-react';
import {
    getFileList,
    clearAllFiles,
    getFileById,
    deleteFile
} from '../services/fileService';
import { formatFileSize, formatTxHash } from '../utils/sealHelpers';
import toast from 'react-hot-toast';

const DevTools = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalFiles: 0,
        totalSize: 0,
        byType: {}
    });

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        setLoading(true);
        try {
            const fileList = await getFileList();
            setFiles(fileList);

            // 计算统计信息
            const totalSize = fileList.reduce((sum, file) => sum + file.size, 0);
            const byType = fileList.reduce((acc, file) => {
                acc[file.type] = (acc[file.type] || 0) + 1;
                return acc;
            }, {});

            setStats({
                totalFiles: fileList.length,
                totalSize,
                byType
            });
        } catch (error) {
            console.error('加载文件列表失败:', error);
            toast.error('加载文件列表失败');
        } finally {
            setLoading(false);
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm('确定要清除所有文件数据吗？此操作不可恢复！')) {
            return;
        }

        try {
            await clearAllFiles();
            await loadFiles();
            toast.success('所有文件数据已清除');
        } catch (error) {
            console.error('清除数据失败:', error);
            toast.error('清除数据失败');
        }
    };

    const handleDeleteFile = async (fileId) => {
        if (!window.confirm('确定要删除这个文件吗？')) {
            return;
        }

        try {
            await deleteFile(fileId);
            await loadFiles();
            toast.success('文件已删除');
        } catch (error) {
            console.error('删除文件失败:', error);
            toast.error('删除文件失败');
        }
    };

    const handleDownloadFile = async (fileId) => {
        try {
            const file = await getFileById(fileId);
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('下载文件失败:', error);
            toast.error('下载文件失败');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="dev-tools"
        >
            <div className="dev-tools-header">
                <h2>
                    <Database size={24} />
                    IndexedDB 文件管理工具
                </h2>
                <div className="dev-tools-actions">
                    <button
                        onClick={loadFiles}
                        disabled={loading}
                        className="btn btn-secondary"
                    >
                        <RefreshCw size={16} className={loading ? 'rotating' : ''} />
                        刷新
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="btn btn-danger"
                        disabled={files.length === 0}
                    >
                        <Trash2 size={16} />
                        清除所有
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">总文件数</div>
                    <div className="stat-value">{stats.totalFiles}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">总大小</div>
                    <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">图片</div>
                    <div className="stat-value">{stats.byType.image || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">音频</div>
                    <div className="stat-value">{stats.byType.audio || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">视频</div>
                    <div className="stat-value">{stats.byType.video || 0}</div>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner" />
                    <p>加载中...</p>
                </div>
            ) : files.length === 0 ? (
                <div className="empty-state">
                    <Info size={48} />
                    <p>暂无文件数据</p>
                    <small>上传一些文件到封印中，然后来这里查看</small>
                </div>
            ) : (
                <div className="files-table">
                    <table>
                        <thead>
                            <tr>
                                <th>文件名</th>
                                <th>类型</th>
                                <th>大小</th>
                                <th>上传时间</th>
                                <th>关联封印</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.map((file) => (
                                <tr key={file.id}>
                                    <td className="file-name">
                                        <span title={file.name}>
                                            {file.name.length > 30
                                                ? file.name.slice(0, 30) + '...'
                                                : file.name
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${file.type}`}>
                                            {file.type}
                                        </span>
                                    </td>
                                    <td>{formatFileSize(file.size)}</td>
                                    <td>
                                        {new Date(file.uploadedAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td>
                                        {file.sealId ? (
                                            <span className="seal-id" title={file.sealId}>
                                                {formatTxHash(file.sealId)}
                                            </span>
                                        ) : (
                                            <span className="no-seal">未关联</span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="file-actions">
                                            <button
                                                onClick={() => handleDownloadFile(file.id)}
                                                className="action-btn download"
                                                title="下载"
                                            >
                                                <Download size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteFile(file.id)}
                                                className="action-btn delete"
                                                title="删除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <style jsx>{`
                .dev-tools {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 24px;
                    margin: 24px 0;
                }

                .dev-tools-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .dev-tools-header h2 {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 0;
                    color: white;
                    font-size: 1.5rem;
                }

                .dev-tools-actions {
                    display: flex;
                    gap: 12px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                }

                .stat-label {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 8px;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 600;
                    color: white;
                    font-family: 'JetBrains Mono', monospace;
                }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                    padding: 40px;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.6);
                }

                .files-table {
                    overflow-x: auto;
                }

                .files-table table {
                    width: 100%;
                    border-collapse: collapse;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    overflow: hidden;
                }

                .files-table th,
                .files-table td {
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .files-table th {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.8);
                    font-weight: 600;
                    font-size: 14px;
                }

                .files-table td {
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                }

                .file-name {
                    font-family: 'JetBrains Mono', monospace;
                }

                .type-badge {
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                }

                .type-badge.image {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }

                .type-badge.audio {
                    background: rgba(59, 130, 246, 0.2);
                    color: #3b82f6;
                }

                .type-badge.video {
                    background: rgba(168, 85, 247, 0.2);
                    color: #a855f7;
                }

                .seal-id {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }

                .no-seal {
                    color: rgba(255, 255, 255, 0.4);
                    font-style: italic;
                }

                .file-actions {
                    display: flex;
                    gap: 8px;
                }

                .action-btn {
                    padding: 6px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-btn.download {
                    background: rgba(34, 197, 94, 0.2);
                    color: #22c55e;
                }

                .action-btn.download:hover {
                    background: rgba(34, 197, 94, 0.3);
                }

                .action-btn.delete {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                }

                .action-btn.delete:hover {
                    background: rgba(239, 68, 68, 0.3);
                }

                .btn-danger {
                    background: rgba(239, 68, 68, 0.2);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }

                .btn-danger:hover {
                    background: rgba(239, 68, 68, 0.3);
                }

                .rotating {
                    animation: rotate 1s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 768px) {
                    .dev-tools-header {
                        flex-direction: column;
                        gap: 16px;
                        align-items: stretch;
                    }

                    .dev-tools-actions {
                        justify-content: center;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }

                    .files-table {
                        font-size: 12px;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default DevTools; 