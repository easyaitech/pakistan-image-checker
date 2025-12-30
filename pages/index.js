import { useState, useRef } from 'react';
import Head from 'next/head';
import {
  ISSUE_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  ISSUE_TYPE_ICONS
} from '../lib/analysis-prompts';

export default function Home() {
  // 状态管理
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'url'
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 文件选择处理
  const handleFileSelect = (file) => {
    setError('');

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('只支持 PNG、JPEG、JPG、WebP 格式的图片');
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('图片大小不能超过 10MB');
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  // 拖拽处理
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 点击上传
  const handleClickUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // URL 输入处理
  const handleUrlInputChange = (e) => {
    setImageUrl(e.target.value);
    setError('');
  };

  const handleLoadUrl = () => {
    if (!imageUrl.trim()) {
      setError('请输入图片 URL');
      return;
    }

    try {
      new URL(imageUrl);
      setPreviewUrl(imageUrl);
      setImageFile(null);
      setResult(null);
      setError('');
    } catch (err) {
      setError('请输入有效的图片 URL');
    }
  };

  // 文件转 base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 分析图片
  const handleAnalyze = async () => {
    setError('');
    setResult(null);

    if (!previewUrl) {
      setError('请先上传或输入图片');
      return;
    }

    setAnalyzing(true);

    try {
      let imageData;
      if (inputMode === 'file' && imageFile) {
        imageData = await fileToBase64(imageFile);
      } else {
        imageData = imageUrl;
      }

      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageSource: inputMode,
          imageData: imageData,
          fileName: imageFile?.name,
        }),
      });

      // 先检查响应状态
      if (!response.ok) {
        // 尝试读取错误信息
        let errorMessage = '分析失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // 如果不是 JSON，读取文本
          const errorText = await response.text();
          errorMessage = `服务器错误 (${response.status}): ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      setResult(data);
    } catch (err) {
      console.error('分析错误:', err);
      setError(err.message || '分析过程中出现错误');
    } finally {
      setAnalyzing(false);
    }
  };

  // 重置
  const handleReset = () => {
    setImageFile(null);
    setImageUrl('');
    setPreviewUrl('');
    setResult(null);
    setError('');
  };

  return (
    <>
      <Head>
        <title>巴基斯坦本地化图片合规检查器</title>
        <meta name="description" content="检查图片设计是否符合巴基斯坦本地化要求" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>🇵🇰 巴基斯坦本地化图片合规检查器</h1>
          <p style={styles.subtitle}>
            检查图片设计是否符合巴基斯坦的语言习惯、设计风格、宗教禁忌和文化习俗
          </p>
        </div>

        <div style={styles.mainCard}>
          {/* 输入方式切换 */}
          <div style={styles.tabContainer}>
            <button
              style={inputMode === 'file' ? styles.tabActive : styles.tab}
              onClick={() => setInputMode('file')}
            >
              📁 文件上传
            </button>
            <button
              style={inputMode === 'url' ? styles.tabActive : styles.tab}
              onClick={() => setInputMode('url')}
            >
              🔗 URL 输入
            </button>
          </div>

          {/* 文件上传区 */}
          {inputMode === 'file' && (
            <div style={styles.uploadContainer}>
              <div
                style={{
                  ...styles.uploadArea,
                  ...(dragOver ? styles.uploadAreaDragOver : {})
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClickUpload}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <div style={styles.uploadIcon}>📤</div>
                <p style={styles.uploadText}>
                  {imageFile ? imageFile.name : '拖拽图片到此处，或点击上传'}
                </p>
                <p style={styles.uploadHint}>支持 PNG、JPEG、JPG、WebP，最大 10MB</p>
              </div>
            </div>
          )}

          {/* URL 输入区 */}
          {inputMode === 'url' && (
            <div style={styles.urlContainer}>
              <input
                type="text"
                value={imageUrl}
                onChange={handleUrlInputChange}
                placeholder="https://example.com/image.jpg"
                style={styles.urlInput}
                onKeyPress={(e) => e.key === 'Enter' && handleLoadUrl()}
              />
              <button onClick={handleLoadUrl} style={styles.loadButton}>
                加载图片
              </button>
            </div>
          )}

          {/* 图片预览 */}
          {previewUrl && (
            <div style={styles.previewContainer}>
              <img src={previewUrl} alt="预览" style={styles.previewImage} />
              <button onClick={handleReset} style={styles.resetButton}>
                重新选择
              </button>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div style={styles.errorBox}>
              ⚠️ {error}
            </div>
          )}

          {/* 分析按钮 */}
          {previewUrl && !result && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                ...styles.analyzeButton,
                ...(analyzing ? styles.analyzeButtonDisabled : {})
              }}
            >
              {analyzing ? '🔄 分析中...' : '🔍 开始分析'}
            </button>
          )}

          {/* 分析结果 */}
          {result && (
            <div style={styles.resultContainer}>
              {/* 总体状态 */}
              <div style={{
                ...styles.statusBox,
                ...(result.hasIssues ? styles.statusBoxIssues : styles.statusBoxClean)
              }}>
                {result.hasIssues ? (
                  <>
                    <span style={styles.statusIcon}>⚠️</span>
                    <span style={styles.statusText}>发现问题</span>
                  </>
                ) : (
                  <>
                    <span style={styles.statusIcon}>✅</span>
                    <span style={styles.statusText}>未发现问题</span>
                  </>
                )}
              </div>

              {/* 总结 */}
              {result.overallSummary && (
                <div style={styles.summaryBox}>
                  {result.overallSummary}
                </div>
              )}

              {/* 问题列表 */}
              {result.hasIssues && result.issues && result.issues.length > 0 && (
                <div style={styles.issuesContainer}>
                  <h3 style={styles.issuesTitle}>发现的问题</h3>

                  {/* 按严重程度排序 */}
                  {result.issues
                    .sort((a, b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return order[a.severity] - order[b.severity];
                    })
                    .map((issue, index) => (
                      <div key={index} style={styles.issueCard}>
                        <div style={styles.issueHeader}>
                          <span style={styles.issueType}>
                            {ISSUE_TYPE_ICONS[issue.type]} {ISSUE_TYPE_LABELS[issue.type]}
                          </span>
                          <span
                            style={{
                              ...styles.severityBadge,
                              backgroundColor: SEVERITY_COLORS[issue.severity]
                            }}
                          >
                            {SEVERITY_LABELS[issue.severity]}严重程度
                          </span>
                        </div>
                        <p style={styles.issueDescription}>{issue.description}</p>
                        <div style={styles.suggestionBox}>
                          <strong>💡 建议：</strong> {issue.suggestion}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 重新分析按钮 */}
              <button onClick={handleReset} style={styles.retryButton}>
                🔄 检查其他图片
              </button>
            </div>
          )}
        </div>

        {/* 页脚说明 */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            使用 Claude Opus 4.5 进行智能分析 · 仅供参考，建议结合人工复核
          </p>
        </div>
      </div>
    </>
  );
}

// 样式定义
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    maxWidth: '600px',
    lineHeight: '1.5',
  },
  mainCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    padding: '30px',
    width: '100%',
    maxWidth: '700px',
  },
  tabContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #e5e5e5',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#666',
    fontSize: '14px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
  },
  tabActive: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#4CAF50',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    borderBottom: '2px solid #4CAF50',
    marginBottom: '-2px',
  },
  uploadContainer: {
    marginBottom: '20px',
  },
  uploadArea: {
    border: '2px dashed #ccc',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  uploadAreaDragOver: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  uploadIcon: {
    fontSize: '48px',
    marginBottom: '10px',
  },
  uploadText: {
    fontSize: '16px',
    color: '#333',
    marginBottom: '5px',
  },
  uploadHint: {
    fontSize: '12px',
    color: '#999',
  },
  urlContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  urlInput: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
  },
  loadButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  previewContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  resetButton: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  errorBox: {
    padding: '12px',
    backgroundColor: '#fef3f3',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    marginBottom: '20px',
    fontSize: '14px',
  },
  analyzeButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  analyzeButtonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  resultContainer: {
    marginTop: '30px',
  },
  statusBox: {
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  statusBoxClean: {
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
  },
  statusBoxIssues: {
    backgroundColor: '#fef3f3',
    color: '#dc2626',
    border: '1px solid #fecaca',
  },
  statusIcon: {
    fontSize: '24px',
  },
  statusText: {
    fontSize: '18px',
  },
  summaryBox: {
    padding: '12px',
    backgroundColor: '#f0f8ff',
    borderLeft: '4px solid #4CAF50',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#333',
  },
  issuesContainer: {
    marginTop: '20px',
  },
  issuesTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: '15px',
  },
  issueCard: {
    padding: '16px',
    backgroundColor: '#fafafa',
    border: '1px solid #e5e5e5',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  issueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  issueType: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  severityBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  issueDescription: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '10px',
    lineHeight: '1.5',
  },
  suggestionBox: {
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #4CAF50',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#333',
  },
  retryButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '20px',
  },
  footer: {
    marginTop: '30px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
  },
};
