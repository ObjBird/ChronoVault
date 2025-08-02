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
      {/* 背景粒子效果 */}
      <div className="background-particles">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`
          }} />
        ))}
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, type: "spring", stiffness: 100 }}
          className="page-header"
        >
          <motion.button
            onClick={() => navigate('/vault')}
            className="back-btn"
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={20} />
            返回金库
          </motion.button>

          <div className="seal-actions">
            <motion.button
              onClick={handleShare}
              className="btn btn-secondary action-btn"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 size={16} />
              分享
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.3, type: "spring", stiffness: 80 }}
          className="seal-detail-card"
        >
          <motion.div
            className="seal-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <motion.div
              className="seal-status-section"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6, type: "spring" }}
            >
              <motion.div
                className={`seal-status ${seal.isUnlocked ? 'unlocked' : 'locked'}`}
                whileHover={{ scale: 1.05 }}
                animate={seal.isUnlocked ? {
                  boxShadow: ["0 0 20px rgba(34, 197, 94, 0.3)", "0 0 40px rgba(34, 197, 94, 0.6)", "0 0 20px rgba(34, 197, 94, 0.3)"],
                } : {
                  boxShadow: ["0 0 20px rgba(239, 68, 68, 0.3)", "0 0 40px rgba(239, 68, 68, 0.6)", "0 0 20px rgba(239, 68, 68, 0.3)"],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {seal.isUnlocked ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                    >
                      <Unlock size={24} />
                    </motion.div>
                    <span>已解锁</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Lock size={24} />
                    </motion.div>
                    <span>锁定中</span>
                  </>
                )}
              </motion.div>
              <motion.div
                className="seal-id"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                封印 #{seal.id.slice(0, 6)}...{seal.id.slice(-4)}
              </motion.div>
            </motion.div>

            <motion.h1
              className="seal-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
            >
              {seal.parsedContent.title}
            </motion.h1>

            <motion.div
              className="seal-meta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              {[
                { icon: User, text: `创建者: ${seal.creator === account ? '您' : `${seal.creator.slice(0, 6)}...${seal.creator.slice(-4)}`}` },
                { icon: Calendar, text: `创建时间: ${format(new Date(seal.parsedContent.createdAt), 'yyyy年MM月dd日 HH:mm')}` },
                { icon: Clock, text: seal.isUnlocked ? `解锁时间: ${formatDate(seal.unlockTime)}` : `将于 ${formatDate(seal.unlockTime)} 解锁` }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="meta-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                >
                  <item.icon size={16} />
                  <span>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {seal.parsedContent.emotion && (
              <motion.div
                className="emotion-section"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.6, type: "spring" }}
                whileHover={{ scale: 1.05 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Heart size={16} />
                </motion.div>
                <span>当时心境: {seal.parsedContent.emotion}</span>
              </motion.div>
            )}

            {seal.parsedContent.tags && seal.parsedContent.tags.length > 0 && (
              <motion.div
                className="tags-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.6 }}
              >
                {seal.parsedContent.tags.map((tag, index) => (
                  <motion.span
                    key={index}
                    className="tag"
                    initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: 1.8 + index * 0.1, duration: 0.5, type: "spring" }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Tag size={12} />
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="seal-content-section"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            {!seal.isUnlocked && !forceUnlock && timeRemaining && (
              <motion.div
                className="countdown-section"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.2, duration: 0.8, type: "spring" }}
              >
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.4, duration: 0.6 }}
                >
                  距离解锁还有:
                </motion.h3>
                <div className="countdown">
                  {[
                    { value: timeRemaining.days, label: '天' },
                    { value: timeRemaining.hours, label: '时' },
                    { value: timeRemaining.minutes, label: '分' },
                    { value: timeRemaining.seconds, label: '秒' }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="countdown-item"
                      initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ delay: 2.6 + index * 0.1, duration: 0.6, type: "spring" }}
                      whileHover={{ scale: 1.1, rotateY: 10 }}
                    >
                      <motion.span
                        className="countdown-number"
                        key={item.value}
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {item.value}
                      </motion.span>
                      <span className="countdown-label">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              className="content-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 0.8 }}
            >
              <motion.h3
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 3.2, duration: 0.6 }}
              >
                封印内容
              </motion.h3>
              <motion.div
                className="content-text"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.4, duration: 0.8 }}
              >
                {seal.isUnlocked || forceUnlock ? (
                  <>
                    {forceUnlock && !seal.isUnlocked && (
                      <motion.div
                        className="force-unlock-warning"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 3.6, duration: 0.5 }}
                      >
                        ⚠️ 您正在提前查看未解锁的封印内容
                      </motion.div>
                    )}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 3.8, duration: 1 }}
                    >
                      {seal.parsedContent.content}
                    </motion.p>
                  </>
                ) : (
                  <motion.div
                    className="locked-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.6, duration: 0.8 }}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Lock size={48} />
                    </motion.div>
                    <p>内容已被时间锁定，请等待解锁时间到达或使用强制查看</p>
                    <motion.button
                      onClick={() => navigate('/vault')}
                      className="btn btn-secondary"
                      style={{ marginTop: '16px' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      返回金库
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            {(seal.isUnlocked || forceUnlock) && seal.mediaIds && (
              <motion.div
                className="media-section"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 4, duration: 0.8 }}
              >
                <motion.h3
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 4.2, duration: 0.6 }}
                >
                  媒体文件
                </motion.h3>
                {loadingMedia ? (
                  <motion.div
                    className="loading-media"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.4, duration: 0.6 }}
                  >
                    <motion.div
                      className="spinner"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p>正在加载媒体文件...</p>
                  </motion.div>
                ) : mediaFiles.length > 0 ? (
                  <motion.div
                    className="media-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.4, duration: 0.8 }}
                  >
                    {mediaFiles.map((media, index) => {
                      const Icon = getFileIcon(media.type);
                      return (
                        <motion.div
                          key={index}
                          className="media-item"
                          initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                          transition={{ delay: 4.6 + index * 0.2, duration: 0.6, type: "spring" }}
                          whileHover={{ scale: 1.05, rotateY: 5 }}
                        >
                          <div className="media-preview">
                            {media.type === 'image' ? (
                              <motion.img
                                src={media.url}
                                alt={media.name}
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 4.8 + index * 0.2, duration: 0.6 }}
                              />
                            ) : media.type === 'video' ? (
                              <motion.video
                                controls
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 4.8 + index * 0.2, duration: 0.6 }}
                              >
                                <source src={media.url} type={media.mimeType} />
                              </motion.video>
                            ) : media.type === 'audio' ? (
                              <motion.audio
                                controls
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 4.8 + index * 0.2, duration: 0.6 }}
                              >
                                <source src={media.url} type={media.mimeType} />
                              </motion.audio>
                            ) : (
                              <motion.div
                                className="file-placeholder"
                                initial={{ opacity: 0, scale: 1.2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 4.8 + index * 0.2, duration: 0.6 }}
                              >
                                <motion.div
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ duration: 3, repeat: Infinity }}
                                >
                                  <Icon size={48} />
                                </motion.div>
                                <span>{media.name}</span>
                              </motion.div>
                            )}
                          </div>
                          <motion.div
                            className="media-info"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 5 + index * 0.2, duration: 0.6 }}
                          >
                            <span className="media-name">{media.name}</span>
                            <motion.a
                              href={media.url}
                              download={media.name}
                              className="download-btn"
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Download size={16} />
                              下载
                            </motion.a>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.4, duration: 0.6 }}
                  >
                    暂无媒体文件
                  </motion.p>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        .seal-detail-page {
          min-height: 100vh;
          padding: 40px 0 80px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, 
            #0f0f23 0%, 
            #1a1a2e 25%, 
            #16213e 50%, 
            #0f3460 75%, 
            #0d2444 100%
          );
        }

        .background-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: rgba(102, 126, 234, 0.6);
          border-radius: 50%;
          animation: float linear infinite;
        }

        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }

        .particle:nth-child(2n) {
          background: rgba(34, 197, 94, 0.4);
          width: 3px;
          height: 3px;
        }

        .particle:nth-child(3n) {
          background: rgba(251, 191, 36, 0.5);
          width: 1px;
          height: 1px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
          position: relative;
          z-index: 1;
        }

        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          position: relative;
          z-index: 2;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          color: white;
          text-decoration: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
        }

        .back-btn:hover {
          background: rgba(102, 126, 234, 0.2);
          border-color: rgba(102, 126, 234, 0.5);
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
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
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .seal-detail-card {
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.08) 0%, 
            rgba(255, 255, 255, 0.03) 50%, 
            rgba(255, 255, 255, 0.08) 100%
          );
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 32px;
          padding: 48px;
          backdrop-filter: blur(30px);
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 80px rgba(102, 126, 234, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transform-style: preserve-3d;
        }

        .seal-detail-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(102, 126, 234, 0.05) 20%, 
            transparent 40%, 
            rgba(34, 197, 94, 0.05) 60%, 
            transparent 80%, 
            rgba(251, 191, 36, 0.05) 100%
          );
          border-radius: 32px;
          opacity: 0.7;
          animation: shimmer 8s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        .seal-header {
          margin-bottom: 40px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(102, 126, 234, 0.2);
          position: relative;
          z-index: 1;
        }

        .seal-status-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .seal-status {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 28px;
          border-radius: 24px;
          font-weight: 700;
          font-size: 1.2rem;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .seal-status.unlocked {
          background: linear-gradient(135deg, 
            rgba(34, 197, 94, 0.3) 0%, 
            rgba(34, 197, 94, 0.2) 50%, 
            rgba(34, 197, 94, 0.3) 100%
          );
          color: #22c55e;
          border: 2px solid rgba(34, 197, 94, 0.5);
          box-shadow: 
            0 0 30px rgba(34, 197, 94, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .seal-status.locked {
          background: linear-gradient(135deg, 
            rgba(239, 68, 68, 0.3) 0%, 
            rgba(239, 68, 68, 0.2) 50%, 
            rgba(239, 68, 68, 0.3) 100%
          );
          color: #ef4444;
          border: 2px solid rgba(239, 68, 68, 0.5);
          box-shadow: 
            0 0 30px rgba(239, 68, 68, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .seal-id {
          font-family: 'JetBrains Mono', monospace;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .seal-title {
          font-size: 3rem;
          font-weight: 900;
          background: linear-gradient(135deg, 
            #ffffff 0%, 
            #e0e7ff 30%, 
            #c7d2fe 60%, 
            #a5b4fc 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 32px;
          line-height: 1.1;
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
          font-family: 'JetBrains Mono', monospace;
        }

        .seal-meta {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 15px;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          cursor: default;
        }

        .meta-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateX(8px);
        }

        .emotion-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          padding: 16px 24px;
          background: linear-gradient(135deg, 
            rgba(251, 191, 36, 0.2) 0%, 
            rgba(251, 191, 36, 0.1) 50%, 
            rgba(251, 191, 36, 0.2) 100%
          );
          border: 2px solid rgba(251, 191, 36, 0.3);
          border-radius: 20px;
          color: #fbbf24;
          backdrop-filter: blur(20px);
          box-shadow: 0 0 30px rgba(251, 191, 36, 0.2);
          font-weight: 600;
        }

        .tags-section {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.3) 0%, 
            rgba(102, 126, 234, 0.2) 50%, 
            rgba(102, 126, 234, 0.3) 100%
          );
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.4);
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          backdrop-filter: blur(15px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
          transition: all 0.3s ease;
        }

        .tag:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 30px rgba(102, 126, 234, 0.3);
        }

        .seal-content-section h3 {
          font-size: 1.8rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffffff, #e0e7ff, #c7d2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 24px;
          font-family: 'JetBrains Mono', monospace;
        }

        .countdown-section {
          margin-bottom: 48px;
          text-align: center;
          padding: 32px;
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.05) 0%, 
            rgba(255, 255, 255, 0.02) 50%, 
            rgba(255, 255, 255, 0.05) 100%
          );
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 24px;
          backdrop-filter: blur(20px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .countdown-section h3 {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 32px;
          font-size: 1.6rem;
          font-weight: 600;
        }

        .countdown {
          display: flex;
          justify-content: center;
          gap: 32px;
          flex-wrap: wrap;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 20px;
          background: linear-gradient(145deg, 
            rgba(102, 126, 234, 0.15) 0%, 
            rgba(102, 126, 234, 0.08) 50%, 
            rgba(102, 126, 234, 0.15) 100%
          );
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-radius: 20px;
          min-width: 100px;
          backdrop-filter: blur(15px);
          box-shadow: 
            0 8px 32px rgba(102, 126, 234, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .countdown-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 255, 255, 0.1), 
            transparent
          );
          transition: left 0.6s ease;
        }

        .countdown-item:hover::before {
          left: 100%;
        }

        .countdown-number {
          font-size: 2.5rem;
          font-weight: 900;
          color: #667eea;
          font-family: 'JetBrains Mono', monospace;
          text-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
          line-height: 1;
        }

        .countdown-label {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 8px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
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
          margin-bottom: 48px;
        }

        .content-text {
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.05) 0%, 
            rgba(255, 255, 255, 0.02) 50%, 
            rgba(255, 255, 255, 0.05) 100%
          );
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(20px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .content-text::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(102, 126, 234, 0.02) 50%, 
            transparent 100%
          );
          border-radius: 20px;
        }

        .content-text p {
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.8;
          font-size: 1.2rem;
          margin: 0;
          white-space: pre-wrap;
          position: relative;
          z-index: 1;
          font-weight: 400;
        }

        .locked-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding: 48px;
          text-align: center;
          color: rgba(255, 255, 255, 0.6);
          background: linear-gradient(145deg, 
            rgba(239, 68, 68, 0.05) 0%, 
            rgba(239, 68, 68, 0.02) 50%, 
            rgba(239, 68, 68, 0.05) 100%
          );
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 20px;
          backdrop-filter: blur(20px);
        }

        .locked-content p {
          font-size: 1.1rem;
          font-weight: 500;
        }

        .media-section {
          margin-bottom: 32px;
        }

        .loading-media {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 40px;
          text-align: center;
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(15px);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(102, 126, 234, 0.3);
          border-top: 3px solid #667eea;
          border-radius: 50%;
        }

        .media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .media-item {
          background: linear-gradient(145deg, 
            rgba(255, 255, 255, 0.08) 0%, 
            rgba(255, 255, 255, 0.03) 50%, 
            rgba(255, 255, 255, 0.08) 100%
          );
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 20px;
          overflow: hidden;
          backdrop-filter: blur(20px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .media-item:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border-color: rgba(102, 126, 234, 0.4);
        }

        .media-preview {
          width: 100%;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, 
            rgba(0, 0, 0, 0.3) 0%, 
            rgba(0, 0, 0, 0.1) 50%, 
            rgba(0, 0, 0, 0.3) 100%
          );
          overflow: hidden;
          position: relative;
        }

        .media-preview::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, 
            transparent 0%, 
            rgba(102, 126, 234, 0.1) 50%, 
            transparent 100%
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .media-item:hover .media-preview::before {
          opacity: 1;
        }

        .media-preview img,
        .media-preview video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .media-item:hover .media-preview img,
        .media-item:hover .media-preview video {
          transform: scale(1.05);
        }

        .media-preview audio {
          width: 90%;
        }

        .file-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.6);
          padding: 20px;
        }

        .file-placeholder span {
          font-size: 15px;
          text-align: center;
          word-break: break-all;
          font-weight: 500;
        }

        .media-info {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
        }

        .media-name {
          color: rgba(255, 255, 255, 0.9);
          font-weight: 600;
          flex: 1;
          margin-right: 16px;
          word-break: break-all;
          font-size: 15px;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.3) 0%, 
            rgba(102, 126, 234, 0.2) 50%, 
            rgba(102, 126, 234, 0.3) 100%
          );
          color: #667eea;
          border: 1px solid rgba(102, 126, 234, 0.4);
          border-radius: 12px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .download-btn:hover {
          background: linear-gradient(135deg, 
            rgba(102, 126, 234, 0.4) 0%, 
            rgba(102, 126, 234, 0.3) 50%, 
            rgba(102, 126, 234, 0.4) 100%
          );
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }

        @media (max-width: 768px) {
          .seal-detail-page {
            padding: 20px 0 40px;
          }

          .container {
            padding: 0 16px;
          }

          .background-particles {
            display: none; /* 移动端隐藏粒子以提升性能 */
          }

          .seal-title {
            font-size: 2.2rem;
            margin-bottom: 24px;
          }

          .page-header {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
            margin-bottom: 24px;
          }

          .seal-actions {
            justify-content: center;
          }

          .seal-detail-card {
            padding: 24px 20px;
            border-radius: 24px;
            margin: 0 -4px;
          }

          .seal-status-section {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
            margin-bottom: 24px;
          }

          .seal-status {
            justify-content: center;
            padding: 12px 20px;
            font-size: 1rem;
          }

          .seal-meta {
            gap: 12px;
            margin-bottom: 24px;
          }

          .meta-item {
            padding: 10px 14px;
            font-size: 14px;
          }

          .emotion-section {
            padding: 12px 18px;
            font-size: 14px;
          }

          .countdown-section {
            padding: 24px 16px;
            margin-bottom: 32px;
          }

          .countdown {
            gap: 16px;
            justify-content: space-around;
          }

          .countdown-item {
            min-width: 70px;
            padding: 16px 12px;
          }

          .countdown-number {
            font-size: 1.8rem;
          }

          .countdown-label {
            font-size: 12px;
          }

          .content-text {
            padding: 24px 20px;
          }

          .content-text p {
            font-size: 1.1rem;
            line-height: 1.7;
          }

          .locked-content {
            padding: 32px 20px;
          }

          .media-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .media-item {
            margin: 0;
          }

          .media-preview {
            height: 180px;
          }

          .media-info {
            padding: 16px;
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .media-name {
            margin-right: 0;
            margin-bottom: 0;
            text-align: center;
          }

          .download-btn {
            justify-content: center;
          }

          .back-btn, .action-btn {
            padding: 10px 16px;
            font-size: 13px;
          }

          .tags-section {
            gap: 8px;
          }

          .tag {
            padding: 8px 12px;
            font-size: 12px;
          }
        }

        @media (max-width: 480px) {
          .seal-title {
            font-size: 1.8rem;
          }

          .seal-detail-card {
            padding: 20px 16px;
          }

          .countdown {
            gap: 12px;
          }

          .countdown-item {
            min-width: 60px;
            padding: 12px 8px;
          }

          .countdown-number {
            font-size: 1.5rem;
          }

          .content-text {
            padding: 20px 16px;
          }

          .content-text p {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SealDetailPage; 