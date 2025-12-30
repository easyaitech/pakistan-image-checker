export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <h1 style={{ fontSize: '72px', marginBottom: '20px' }}>404</h1>
      <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
        页面未找到
      </p>
      <a
        href="/"
        style={{
          padding: '12px 24px',
          backgroundColor: '#4CAF50',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '6px',
        }}
      >
        返回首页
      </a>
    </div>
  );
}
