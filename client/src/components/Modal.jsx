function Modal({ title, message, isError, onClose }) {
  return (
    <div 
      className="modal" 
      style={{ 
        display: 'block',
        position: 'fixed',
        zIndex: 9999,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        overflow: 'auto',
        backgroundColor: 'rgba(0,0,0,0.4)'
      }}
    >
      <div 
        className="modal-content" 
        style={{
          backgroundColor: '#fefefe',
          margin: '15% auto',
          padding: '20px',
          border: '1px solid #888',
          width: '80%',
          maxWidth: '400px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <h3 style={{ 
          color: isError ? 'var(--color-error)' : 'var(--color-primary)',
          marginBottom: '15px'
        }}>
          {title}
        </h3>
        <p style={{ marginBottom: '20px', color: '#333' }}>{message}</p>
        <div className="modal-button-group" style={{ textAlign: 'right' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
