import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Tag,
  User,
  Image,
  Music,
  Video,
  FileText,
  Download,
  Heart,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import { useWeb3 } from '../context/Web3Context';
import { getFileById } from '../services/fileService';
import toast from 'react-hot-toast';

const SealDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getSeal, account } = useWeb3();
  const [seal, setSeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [forceUnlock, setForceUnlock] = useState(false);

  useEffect(() => {
    if (id) {
      loadSealDetail();
    }
  }, [id]);

  // 当强制解锁时，加载媒体文件
  useEffect(() => {
    if (forceUnlock && seal && seal.mediaIds && mediaFiles.length === 0) {
      loadMediaFiles(seal.mediaIds);
    }
  }, [forceUnlock, seal]);

  const loadSealDetail = async () => {
    setLoading(true);
    try {
      // 优先使用从列表页传递的数据
      const passedSealData = location.state?.sealData;
      const passedForceUnlock = location.state?.forceUnlock;

      console.log('当前URL参数 id:', id);
      console.log('从列表页传递的数据:', passedSealData);
      console.log('强制解锁参数:', passedForceUnlock);

      // 如果传递了强制解锁参数，设置强制解锁状态
      if (passedForceUnlock) {
        setForceUnlock(true);
      }

      if (passedSealData) {
        // 直接使用传递过来的数据，不调用合约
        console.log('✅ 使用从列表页传递的封印数据，无需调用合约');
        setSeal(passedSealData);

        // Load media files if unlocked or force unlock and has media
        if ((passedSealData.isUnlocked || passedForceUnlock) && passedSealData.mediaIds) {
          console.log('开始加载媒体文件:', passedSealData.mediaIds);
          await loadMediaFiles(passedSealData.mediaIds);
        }
      } else {
        // 如果没有传递数据，才调用合约（兜底机制）
        console.log('⚠️ 没有传递数据，从合约获取封印详情，ID:', id);
        const sealData = await getSeal(id);
        console.log('从合约获取到的数据:', sealData);

        if (sealData) {
          // 检查是否已经是解析过的数据
          if (sealData.parsedContent) {
            console.log('✅ 获取到已解析的封印数据');
            setSeal(sealData);

            // Load media files if unlocked and has media
            if (sealData.isUnlocked && sealData.mediaIds) {
              await loadMediaFiles(sealData.mediaIds);
            }
          } else {
            // 尝试解析内容
            try {
              const parsedContent = JSON.parse(sealData.content);
              const isUnlocked = sealData.unlockTime * 1000 <= Date.now();

              const sealWithContent = {
                id: id,
                ...sealData,
                parsedContent,
                isUnlocked,
              };

              console.log('✅ 成功解析封印内容');
              setSeal(sealWithContent);

              // Load media files if unlocked and has media
              if (isUnlocked && sealData.mediaIds) {
                await loadMediaFiles(sealData.mediaIds);
              }
            } catch (error) {
              console.error('解析封印内容失败:', error);
              setSeal({
                id: id,
                ...sealData,
                parsedContent: {
                  title: '解析失败',
                  content: sealData.content,
                  createdAt: new Date().toISOString()
                },
                isUnlocked: sealData.unlockTime * 1000 <= Date.now(),
              });
            }
          }
        } else {
          console.error('❌ 未能获取到封印数据');
          toast.error('封印不存在或获取失败');
          navigate('/vault');
        }
      }
    } catch (error) {
      console.error('❌ 加载封印详情失败:', error);
      toast.error('加载封印详情失败: ' + error.message);
      navigate('/vault');
    } finally {
      setLoading(false);
    }
  };

  const loadMediaFiles = async (mediaIds) => {
    if (!mediaIds) return;

    setLoadingMedia(true);
    try {
      const ids = mediaIds.split(',').filter(id => id.trim());
      const mediaPromises = ids.map(async (fileId) => {
        try {
          const fileData = await getFileById(fileId.trim());
          return fileData;
        } catch (error) {
          console.error(`加载媒体文件 ${fileId} 失败:`, error);
          return null;
        }
      });

      const resolvedMedia = await Promise.all(mediaPromises);
      const validMedia = resolvedMedia.filter(media => media !== null);
      setMediaFiles(validMedia);
    } catch (error) {
      console.error('加载媒体文件失败:', error);
      toast.error('加载媒体文件失败');
    } finally {
      setLoadingMedia(false);
    }
  };

  const formatDate = (timestamp) => {
    return format(new Date(timestamp * 1000), 'yyyy年MM月dd日 HH:mm:ss');
  };

  const getTimeRemaining = (timestamp) => {
    const now = Date.now();
    const target = timestamp * 1000;
    const diff = target - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return Image;
      case 'audio': return Music;
      case 'video': return Video;
      default: return FileText;
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `时间封印: ${seal.parsedContent.title}`,
          text: seal.isUnlocked ? seal.parsedContent.content.slice(0, 100) + '...' : '这是一个时间封印，等待解锁中...',
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('链接已复制到剪贴板');
      } catch (error) {
        toast.error('分享失败');
      }
    }
  };

  if (loading) {
    return (
      <div className="seal-detail-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner" />
            <p>正在加载封印详情...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!seal) {
    return (
      <div className="seal-detail-page">
        <div className="container">
          <div className="error-state">
            <h2>封印不存在</h2>
            <button onClick={() => navigate('/vault')} className="btn btn-primary">
              返回金库
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timeRemaining = getTimeRemaining(seal.unlockTime);

  return (
    <div className="seal-detail-page">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="page-header"
        >
          <button onClick={() => navigate('/vault')} className="back-btn">
            <ArrowLeft size={20} />
            返回金库
          </button>

          <div className="seal-actions">
            <button onClick={handleShare} className="btn btn-secondary action-btn">
              <Share2 size={16} />
              分享
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="seal-detail-card"
        >
          <div className="seal-header">
            <div className="seal-status-section">
              <div className={`seal-status ${seal.isUnlocked ? 'unlocked' : 'locked'}`}>
                {seal.isUnlocked ? (
                  <>
                    <Unlock size={24} />
                    <span>已解锁</span>
                  </>
                ) : (
                  <>
                    <Lock size={24} />
                    <span>锁定中</span>
                  </>
                )}
              </div>
              <div className="seal-id">封印 #{seal.id.slice(0, 6)}...{seal.id.slice(-4)}</div>
            </div>

            <h1 className="seal-title">{seal.parsedContent.title}</h1>

            <div className="seal-meta">
              <div className="meta-item">
                <User size={16} />
                <span>创建者: {seal.creator === account ? '您' : `${seal.creator.slice(0, 6)}...${seal.creator.slice(-4)}`}</span>
              </div>
              <div className="meta-item">
                <Calendar size={16} />
                <span>创建时间: {format(new Date(seal.parsedContent.createdAt), 'yyyy年MM月dd日 HH:mm')}</span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>
                  {seal.isUnlocked
                    ? `解锁时间: ${formatDate(seal.unlockTime)}`
                    : `将于 ${formatDate(seal.unlockTime)} 解锁`
                  }
                </span>
              </div>
            </div>

            {seal.parsedContent.emotion && (
              <div className="emotion-section">
                <Heart size={16} />
                <span>当时心境: {seal.parsedContent.emotion}</span>
              </div>
            )}

            {seal.parsedContent.tags && seal.parsedContent.tags.length > 0 && (
              <div className="tags-section">
                {seal.parsedContent.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="seal-content-section">
            {!seal.isUnlocked && !forceUnlock && timeRemaining && (
              <motion.div
                className="countdown-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <h3>距离解锁还有:</h3>
                <div className="countdown">
                  <div className="countdown-item">
                    <span className="countdown-number">{timeRemaining.days}</span>
                    <span className="countdown-label">天</span>
                  </div>
                  <div className="countdown-item">
                    <span className="countdown-number">{timeRemaining.hours}</span>
                    <span className="countdown-label">时</span>
                  </div>
                  <div className="countdown-item">
                    <span className="countdown-number">{timeRemaining.minutes}</span>
                    <span className="countdown-label">分</span>
                  </div>
                  <div className="countdown-item">
                    <span className="countdown-number">{timeRemaining.seconds}</span>
                    <span className="countdown-label">秒</span>
                  </div>
                </div>

              </motion.div>
            )}

            <div className="content-section">
              <h3>封印内容</h3>
              <div className="content-text">
                {seal.isUnlocked || forceUnlock ? (
                  <>
                    {forceUnlock && !seal.isUnlocked && (
                      <div className="force-unlock-warning">
                        ⚠️ 您正在提前查看未解锁的封印内容
                      </div>
                    )}
                    <p>{seal.parsedContent.content}</p>
                  </>
                ) : (
                  <div className="locked-content">
                    <Lock size={48} />
                    <p>内容已被时间锁定，请等待解锁时间到达或使用强制查看</p>
                    <button
                      onClick={() => navigate('/vault')}
                      className="btn btn-secondary"
                      style={{ marginTop: '16px' }}
                    >
                      返回金库
                    </button>
                  </div>
                )}
              </div>
            </div>

            {(seal.isUnlocked || forceUnlock) && seal.mediaIds && (
              <div className="media-section">
                <h3>媒体文件</h3>
                {loadingMedia ? (
                  <div className="loading-media">
                    <div className="spinner" />
                    <p>正在加载媒体文件...</p>
                  </div>
                ) : mediaFiles.length > 0 ? (
                  <div className="media-grid">
                    {mediaFiles.map((media, index) => {
                      const Icon = getFileIcon(media.type);
                      return (
                        <div key={index} className="media-item">
                          <div className="media-preview">
                            {media.type === 'image' ? (
                              <img src={media.url} alt={media.name} />
                            ) : media.type === 'video' ? (
                              <video controls>
                                <source src={media.url} type={media.mimeType} />
                              </video>
                            ) : media.type === 'audio' ? (
                              <audio controls>
                                <source src={media.url} type={media.mimeType} />
                              </audio>
                            ) : (
                              <div className="file-placeholder">
                                <Icon size={48} />
                                <span>{media.name}</span>
                              </div>
                            )}
                          </div>
                          <div className="media-info">
                            <span className="media-name">{media.name}</span>
                            <a
                              href={media.url}
                              download={media.name}
                              className="download-btn"
                            >
                              <Download size={16} />
                              下载
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>暂无媒体文件</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .seal-detail-page {
          min-height: 100vh;
          padding: 40px 0 80px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          gap: 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .seal-actions {
          display: flex;
          gap: 12px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
        }

        .seal-detail-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          backdrop-filter: blur(20px);
        }

        .seal-header {
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .seal-status-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .seal-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .seal-status.unlocked {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .seal-status.locked {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .seal-id {
          font-family: 'JetBrains Mono', monospace;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
        }

        .seal-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 24px;
          line-height: 1.2;
        }

        .seal-meta {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
        }

        .emotion-section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 24px;
          padding: 12px 16px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 12px;
          color: #fbbf24;
        }

        .tags-section {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .seal-content-section h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          margin-bottom: 20px;
        }

        .countdown-section {
          margin-bottom: 40px;
          text-align: center;
        }

        .countdown-section h3 {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 24px;
        }

        .countdown {
          display: flex;
          justify-content: center;
          gap: 24px;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          min-width: 80px;
        }

        .countdown-number {
          font-size: 2rem;
          font-weight: 800;
          color: #667eea;
          font-family: 'JetBrains Mono', monospace;
        }

        .countdown-label {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 4px;
        }

        .force-unlock-section {
          margin-top: 32px;
          text-align: center;
          padding: 24px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 16px;
        }

        .force-unlock-btn {
          background: rgba(251, 191, 36, 0.2) !important;
          color: #fbbf24 !important;
          border: 1px solid rgba(251, 191, 36, 0.3) !important;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          transition: all 0.3s ease;
        }

        .force-unlock-btn:hover {
          background: rgba(251, 191, 36, 0.3) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(251, 191, 36, 0.2);
        }

        .force-unlock-tip {
          font-size: 14px;
          color: rgba(251, 191, 36, 0.8);
          margin: 0;
          font-style: italic;
        }

        .force-unlock-warning {
          background: rgba(251, 191, 36, 0.2);
          color: #fbbf24;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          text-align: center;
          font-weight: 500;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }

        .content-section {
          margin-bottom: 40px;
        }

        .content-text {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px;
        }

        .content-text p {
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.7;
          font-size: 1.1rem;
          margin: 0;
          white-space: pre-wrap;
        }

        .locked-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }

        .media-section {
          margin-bottom: 20px;
        }

        .loading-media {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .media-item {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          overflow: hidden;
        }

        .media-preview {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.2);
        }

        .media-preview img,
        .media-preview video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-preview audio {
          width: 100%;
        }

        .file-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.5);
        }

        .file-placeholder span {
          font-size: 14px;
          text-align: center;
          word-break: break-all;
        }

        .media-info {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .media-name {
          color: white;
          font-weight: 500;
          flex: 1;
          margin-right: 12px;
          word-break: break-all;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .download-btn:hover {
          background: rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .seal-title {
            font-size: 2rem;
          }

          .page-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .seal-actions {
            justify-content: center;
          }

          .seal-detail-card {
            padding: 24px;
          }

          .countdown {
            flex-wrap: wrap;
            gap: 16px;
          }

          .countdown-item {
            min-width: 60px;
            padding: 16px;
          }

          .countdown-number {
            font-size: 1.5rem;
          }

          .media-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SealDetailPage; 