import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Clock,
  Lock,
  Unlock,
  Calendar,
  Tag,
  User,
  Search,
  Filter,
  Image,
  Video,
  Music,
  File,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { useWeb3 } from "../context/Web3Context";
import toast from "react-hot-toast";

const VaultPage = () => {
  const { getUserSeals, getSeal, account, isConnected } = useWeb3();
  const navigate = useNavigate();
  const [seals, setSeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, locked, unlocked

  useEffect(() => {
    if (isConnected && account) {
      loadUserSeals();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  const loadUserSeals = async () => {
    setLoading(true);
    try {
      // 直接从Apollo Client获取处理好的封印数据
      const seals = await getUserSeals();
      console.log(seals, 111111);
      // 按创建时间排序（最新的在前）
      seals.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setSeals(seals);
    } catch (error) {
      console.error("加载封印失败:", error);
      toast.error("加载封印失败");
    } finally {
      setLoading(false);
    }
  };



  // 强制查看封印详情
  const handleForceViewSeal = async (seal) => {
    try {
      // 直接导航到详情页，并传递强制解锁参数
      navigate(`/seal/${seal.id}`, {
        state: {
          sealData: seal,
          forceUnlock: true
        }
      });
      toast.success("跳转到封印详情");
    } catch (error) {
      console.error("跳转失败:", error);
      toast.error("跳转失败");
    }
  };

  // 获取文件类型图标
  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image size={16} />;
      case 'video':
        return <Video size={16} />;
      case 'audio':
        return <Music size={16} />;
      default:
        return <File size={16} />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  const filteredSeals = seals.filter((seal) => {
    const title = seal.parsedContent?.title || "";
    const content = seal.parsedContent?.content || "";
    const tags = seal.parsedContent?.tags || [];

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tags &&
        tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "locked" && !seal.isUnlocked) ||
      (filterStatus === "unlocked" && seal.isUnlocked);

    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp) => {
    return format(new Date(timestamp * 1000), "yyyy年MM月dd日 HH:mm");
  };

  const getTimeRemaining = (timestamp) => {
    const now = Date.now();
    const target = timestamp * 1000;
    const diff = target - now;

    if (diff <= 0) return "已解锁";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}天后解锁`;
    if (hours > 0) return `${hours}小时后解锁`;
    return `${minutes}分钟后解锁`;
  };

  if (!isConnected) {
    return (
      <div className="vault-page">
        <div className="container">
          <div className="not-connected">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="not-connected-content"
            >
              <Clock size={80} />
              <h2>请先连接钱包</h2>
              <p>连接钱包后即可查看您的时间封印金库</p>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-page">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="page-header"
        >
          <h1 className="page-title gradient-text-primary">我的时间金库</h1>
          <p className="page-subtitle">
            这里保存着您所有的珍贵记忆，等待着时间的钥匙将它们解锁
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="vault-controls"
        >
          <div className="search-bar">
            <Search size={20} />
            <input
              type="text"
              placeholder="搜索封印标题、内容或标签..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              onClick={() => setFilterStatus("all")}
              className={`btn ${filterStatus === "all" ? "btn-primary" : "btn-secondary"
                } filter-btn`}
            >
              全部 ({seals.length})
            </button>
            <button
              onClick={() => setFilterStatus("locked")}
              className={`btn ${filterStatus === "locked" ? "btn-primary" : "btn-secondary"
                } filter-btn`}
            >
              <Lock size={16} />
              已锁定 ({seals.filter((s) => !s.isUnlocked).length})
            </button>
            <button
              onClick={() => setFilterStatus("unlocked")}
              className={`btn ${filterStatus === "unlocked" ? "btn-primary" : "btn-secondary"
                } filter-btn`}
            >
              <Unlock size={16} />
              已解锁 ({seals.filter((s) => s.isUnlocked).length})
            </button>


          </div>
        </motion.div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>正在加载您的时间封印...</p>
          </div>
        ) : filteredSeals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
          >
            <Clock size={80} />
            <h3>
              {seals.length === 0 ? "还没有任何时间封印" : "没有找到匹配的封印"}
            </h3>
            <p>
              {seals.length === 0
                ? "创建您的第一个时间封印，开始您的记忆之旅"
                : "尝试调整搜索条件或筛选器"}
            </p>
            {seals.length === 0 && (
              <Link to="/create" className="btn btn-primary">
                创建第一个封印
              </Link>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="seals-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {filteredSeals.map((seal, index) => (
              <motion.div
                key={seal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`seal-card ${seal.isUnlocked ? "unlocked" : "locked"
                  }`}
              >
                <div className="seal-header">
                  <div className="seal-status">
                    {seal.isUnlocked ? (
                      <>
                        <Unlock size={16} />
                        <span>已解锁</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>锁定中</span>
                      </>
                    )}
                  </div>
                  <div className="seal-id">#{seal.id}</div>
                </div>

                <div className="seal-content">
                  <h3 className="seal-title">{seal.parsedContent.title}</h3>
                  <p className="seal-preview">
                    {seal.isUnlocked
                      ? seal.parsedContent.content.slice(0, 100) +
                      (seal.parsedContent.content.length > 100 ? "..." : "")
                      : "🔒 内容已锁定，等待时间解锁..."}
                  </p>

                  {seal.parsedContent.emotion && (
                    <div className="seal-emotion">
                      <span className="emotion-label">当时心境：</span>
                      <span className="emotion-value">
                        {seal.parsedContent.emotion}
                      </span>
                    </div>
                  )}

                  {seal.parsedContent.tags &&
                    seal.parsedContent.tags.length > 0 && (
                      <div className="seal-tags">
                        {seal.parsedContent.tags
                          .slice(0, 3)
                          .map((tag, tagIndex) => (
                            <span key={tagIndex} className="tag">
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                        {seal.parsedContent.tags.length > 3 && (
                          <span className="tag-more">
                            +{seal.parsedContent.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                </div>

                <div className="seal-footer">
                  <div className="seal-time">
                    <Calendar size={14} />
                    <span>
                      {seal.isUnlocked
                        ? `已于 ${formatDate(seal.unlockTime)} 解锁`
                        : getTimeRemaining(seal.unlockTime)}
                    </span>
                  </div>

                  <div className="seal-actions">
                    <button
                      onClick={() => handleForceViewSeal(seal)}
                      className="btn btn-warning force-view-btn"
                      title="强制查看封印内容"
                    >
                      🔓 强制查看
                    </button>
                    {seal.isUnlocked ? (
                      <Link
                        to={`/seal/${seal.id}`}
                        state={{ sealData: seal }}
                        className="btn btn-secondary seal-link"
                      >
                        查看详情
                      </Link>
                    ) : (
                      <button
                        onClick={() => toast.error('封印尚未到期，无法查看详情')}
                        className="btn btn-secondary seal-link disabled"
                        title="封印尚未解锁，无法查看详情"
                      >
                        🔒 未解锁
                      </button>
                    )}
                  </div>
                </div>

                {seal.mediaIds && (
                  <div className="media-indicator">
                    <span>📎 包含媒体文件</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}


      </div>

      <style jsx>{`
        .vault-page {
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
          font-family: "JetBrains Mono", monospace;
        }

        .page-subtitle {
          font-size: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
          max-width: 600px;
          margin: 0 auto;
        }

        .vault-controls {
          display: flex;
          gap: 24px;
          margin-bottom: 40px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-bar {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-bar svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.5);
        }

        .search-input {
          padding-left: 48px;
        }

        .filter-buttons {
          display: flex;
          gap: 12px;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          white-space: nowrap;
        }

        .not-connected,
        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          text-align: center;
          gap: 24px;
        }

        .not-connected-content h2,
        .empty-state h3 {
          font-size: 2rem;
          margin: 0;
          color: white;
        }

        .not-connected-content p,
        .empty-state p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
        }

        .seals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .seal-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(15px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .seal-card.unlocked {
          border-color: rgba(34, 197, 94, 0.3);
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
        }

        .seal-card.locked {
          border-color: rgba(239, 68, 68, 0.3);
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
        }

        .seal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .seal-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .seal-card.unlocked .seal-status {
          background: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .seal-card.locked .seal-status {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .seal-id {
          font-family: "JetBrains Mono", monospace;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
        }

        .seal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-bottom: 12px;
          line-height: 1.3;
        }

        .seal-preview {
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .seal-emotion {
          margin-bottom: 16px;
          font-size: 14px;
        }

        .emotion-label {
          color: rgba(255, 255, 255, 0.5);
        }

        .emotion-value {
          color: #fbbf24;
          font-weight: 500;
          margin-left: 8px;
        }

        .seal-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(102, 126, 234, 0.2);
          color: #667eea;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .tag-more {
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          border-radius: 6px;
          font-size: 12px;
        }

        .seal-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .seal-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .seal-time {
          display: flex;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }

        .seal-link {
          padding: 8px 16px;
          font-size: 14px;
          text-decoration: none;
        }

        .seal-link.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.05) !important;
          color: rgba(255, 255, 255, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        .seal-link.disabled:hover {
          transform: none;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .force-view-btn {
          padding: 6px 12px;
          font-size: 12px;
          background: rgba(251, 191, 36, 0.2) !important;
          color: #fbbf24 !important;
          border-color: rgba(251, 191, 36, 0.3) !important;
          transition: all 0.3s ease;
        }

        .force-view-btn:hover {
          background: rgba(251, 191, 36, 0.3) !important;
          transform: scale(1.05);
        }

        .media-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(0, 0, 0, 0.6);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
        }



        @media (max-width: 768px) {
          .page-title {
            font-size: 2.5rem;
          }

          .vault-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-bar {
            min-width: auto;
          }

          .filter-buttons {
            justify-content: center;
          }

          .seals-grid {
            grid-template-columns: 1fr;
          }

          .seal-footer {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .seal-actions {
            justify-content: center;
            gap: 8px;
          }

          .force-view-btn {
            flex: 1;
            min-width: 0;
          }

          .seal-link {
            text-align: center;
            flex: 1;
          }


        }
      `}</style>
    </div>
  );
};

export default VaultPage;
