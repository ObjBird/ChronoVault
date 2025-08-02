import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Calendar, Clock, FileText, Image, Music, Video, Upload, X, Send } from 'lucide-react';
import { format, addHours } from 'date-fns';
import { useWeb3 } from '../context/Web3Context';
import { uploadFile } from '../services/fileService';
import toast from 'react-hot-toast';

const CreateSealPage = () => {
    const { createSeal, isConnected } = useWeb3();
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        unlockDate: '',
        unlockTime: '12:00',
    });
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // 设置默认解锁时间为当前时间+1小时
    useEffect(() => {
        const defaultUnlockTime = addHours(new Date(), 1);
        setFormData(prev => ({
            ...prev,
            unlockDate: format(defaultUnlockTime, 'yyyy-MM-dd'),
            unlockTime: format(defaultUnlockTime, 'HH:mm'),
        }));
    }, []);

    const onDrop = useCallback((acceptedFiles) => {
        const newFiles = acceptedFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            type: file.type.split('/')[0],
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'audio/*': ['.mp3', '.wav', '.ogg', '.m4a'],
            'video/*': ['.mp4', '.webm', '.mov', '.avi'],
        },
        maxSize: 100 * 1024 * 1024, // 100MB
    });

    const removeFile = (id) => {
        setFiles(prev => prev.filter(file => file.id !== id));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getFileIcon = (type) => {
        switch (type) {
            case 'image': return Image;
            case 'audio': return Music;
            case 'video': return Video;
            default: return FileText;
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 验证钱包连接
        if (!isConnected) {
            toast.error('请先连接钱包后再创建封印');
            return;
        }

        // 验证必填内容
        if (!formData.content.trim()) {
            toast.error('请填写封印内容，这是创建时间封印的必要信息');
            return;
        }

        // 如果没有设置解锁时间，使用默认时间（当前时间+1小时）
        let unlockDate = formData.unlockDate;
        let unlockTime = formData.unlockTime;

        if (!unlockDate) {
            const defaultUnlockTime = addHours(new Date(), 1);
            unlockDate = format(defaultUnlockTime, 'yyyy-MM-dd');
            unlockTime = format(defaultUnlockTime, 'HH:mm');
        }

        const unlockDateTime = new Date(`${unlockDate}T${unlockTime}`);
        if (unlockDateTime <= new Date()) {
            toast.error('解锁时间必须在未来');
            return;
        }

        setIsCreating(true);

        try {
            // Upload files if any
            let mediaIds = '';
            if (files.length > 0) {
                setIsUploading(true);
                const uploadPromises = files.map(({ file }) => uploadFile(file));
                const uploadResults = await Promise.all(uploadPromises);
                mediaIds = uploadResults.join(',');
                setIsUploading(false);
            }

            // Create seal content object
            const sealContent = {
                title: formData.title || `时间封印 ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, // 如果没有标题，使用默认标题
                content: formData.content,
                createdAt: new Date().toISOString(),
            };

            // Convert unlock time to timestamp
            const unlockTimestamp = Math.floor(unlockDateTime.getTime() / 1000);

            // Create seal on blockchain
            const sealId = await createSeal(
                JSON.stringify(sealContent),
                unlockTimestamp,
                mediaIds
            );

            if (sealId !== null) {
                // Reset form
                const defaultUnlockTime = addHours(new Date(), 1);
                setFormData({
                    title: '',
                    content: '',
                    unlockDate: format(defaultUnlockTime, 'yyyy-MM-dd'),
                    unlockTime: format(defaultUnlockTime, 'HH:mm'),
                });
                setFiles([]);

                toast.success(`封印创建成功！封印ID: ${sealId}`);
            }
        } catch (error) {
            console.error('创建封印失败:', error);
            toast.error('创建封印失败，请重试');
        } finally {
            setIsCreating(false);
            setIsUploading(false);
        }
    };

    return (
        <div className="create-seal-page">
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="page-header"
                >
                    <h1 className="page-title gradient-text-primary">创建时间封印</h1>
                    <p className="page-subtitle">
                        将珍贵的记忆封存在时间的胶囊中，让它在未来的某个时刻重新绽放
                    </p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="seal-form"
                >
                    <div className="form-grid">
                        {/* Left Column */}
                        <div className="form-column">
                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={20} />
                                    封印标题 (可选)
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="给这个时间封印起个名字... (不填写会自动生成)"
                                    className="input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={20} />
                                    封印内容 *
                                </label>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    placeholder="写下你想对未来的自己或世界说的话..."
                                    className="input textarea"
                                    rows={8}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Clock size={20} />
                                    解锁时间 (可选，默认1小时后)
                                </label>
                                <div className="datetime-input">
                                    <input
                                        type="date"
                                        name="unlockDate"
                                        value={formData.unlockDate}
                                        onChange={handleInputChange}
                                        min={format(new Date(), 'yyyy-MM-dd')}
                                        className="input date-input"
                                    />
                                    <input
                                        type="time"
                                        name="unlockTime"
                                        value={formData.unlockTime}
                                        onChange={handleInputChange}
                                        className="input time-input"
                                    />
                                </div>
                                <p className="time-hint">
                                    💡 如果不设置时间，封印将在1小时后自动解锁
                                </p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="form-column">
                            <div className="form-group">
                                <label className="form-label">
                                    <Upload size={20} />
                                    媒体文件 (可选 - 图片、音频、视频)
                                </label>
                                <div
                                    {...getRootProps()}
                                    className={`dropzone ${isDragActive ? 'active' : ''}`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="dropzone-content">
                                        <Upload size={48} />
                                        <p>
                                            {isDragActive
                                                ? '放开文件上传'
                                                : '拖拽文件到这里，或点击选择文件'}
                                        </p>
                                        <span className="dropzone-hint">
                                            支持图片、音频和视频文件，最大100MB
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {files.length > 0 && (
                                <div className="uploaded-files">
                                    {files.map((fileItem) => {
                                        const Icon = getFileIcon(fileItem.type);
                                        return (
                                            <div key={fileItem.id} className="file-item">
                                                <div className="file-info">
                                                    <Icon size={24} />
                                                    <div className="file-details">
                                                        <span className="file-name">{fileItem.file.name}</span>
                                                        <span className="file-size">
                                                            {formatFileSize(fileItem.file.size)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {fileItem.preview && (
                                                    <img
                                                        src={fileItem.preview}
                                                        alt="preview"
                                                        className="file-preview"
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFile(fileItem.id)}
                                                    className="remove-file-btn"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <motion.div
                        className="form-footer"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <button
                            type="submit"
                            disabled={isCreating || isUploading}
                            className="btn btn-primary submit-btn time-lock"
                        >
                            {isUploading ? (
                                <>
                                    <div className="spinner" />
                                    上传文件中...
                                </>
                            ) : isCreating ? (
                                <>
                                    <div className="spinner" />
                                    创建封印中...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    创建时间封印
                                </>
                            )}
                        </button>
                    </motion.div>
                </motion.form>
            </div>

            <style jsx="true">{`
        .create-seal-page {
          min-height: 100vh;
          padding: 40px 0 80px;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .page-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 16px;
          font-family: 'JetBrains Mono', monospace;
        }

        .page-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto;
        }

        .seal-form {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          backdrop-filter: blur(20px);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }

        .form-group {
          margin-bottom: 32px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
          font-size: 1.1rem;
        }

        .datetime-input {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }

        .dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .dropzone:hover, .dropzone.active {
          border-color: rgba(102, 126, 234, 0.6);
          background: rgba(102, 126, 234, 0.1);
        }

        .dropzone-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.7);
        }

        .dropzone-hint {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        .uploaded-files {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .file-details {
          display: flex;
          flex-direction: column;
        }

        .file-name {
          font-weight: 500;
          color: white;
        }

        .file-size {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .file-preview {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 8px;
        }

        .remove-file-btn {
          padding: 8px;
          background: rgba(255, 0, 0, 0.2);
          border: none;
          border-radius: 8px;
          color: #ff6b6b;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .remove-file-btn:hover {
          background: rgba(255, 0, 0, 0.3);
        }

        .form-footer {
          display: flex;
          justify-content: center;
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .submit-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 48px;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .time-hint {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 8px;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 2.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .seal-form {
            padding: 24px;
          }

          .datetime-input {
            grid-template-columns: 1fr;
          }

          .submit-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
        </div>
    );
};

export default CreateSealPage; 