import { useState, useEffect } from 'react';

function AccountSettings({ isOpen, onClose, userInfo, onUpdate }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    mobile: '',
    age: '',
    gender: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  // Sync profileData with userInfo when modal opens or userInfo changes
  useEffect(() => {
    if (isOpen && userInfo) {
      setProfileData({
        username: userInfo.username || '',
        email: userInfo.email || '',
        mobile: userInfo.mobile || '',
        age: userInfo.age || '',
        gender: userInfo.gender || ''
      });
    }
  }, [isOpen, userInfo]);

  // Clear messages when switching tabs
  useEffect(() => {
    setMessage({ type: '', text: '' });
    setShowDeleteConfirm(false);
    setDeleteConfirmationText('');
  }, [activeTab]);

  if (!isOpen) return null;

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Fetch updated profile to ensure data is synced
        const profileResponse = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        const profileResult = await profileResponse.json();
        if (profileResult.success && onUpdate) {
          onUpdate(profileResult.user);
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'delete account') {
      setMessage({ type: 'error', text: 'Please type "delete account" correctly to confirm deletion.' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        localStorage.clear();
        window.location.href = '/';
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="account-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Account Settings</h2>
          <button className="close-button" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-sidebar">
            <div className="settings-header">
              <h3>Account</h3>
              <p>Manage your account info.</p>
            </div>
            <nav className="settings-nav">
              <button
                className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fa-solid fa-user"></i>
                <span>Profile</span>
              </button>
              <button
                className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fa-solid fa-shield-halved"></i>
                <span>Security</span>
              </button>
            </nav>
          </div>

          <div className="settings-content">
            {message.text && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="settings-section">
                <h3>Profile Information</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                  Fields are locked once saved. Contact support to change saved information.
                </p>
                <form onSubmit={handleProfileSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <div className="input-with-lock">
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={profileData.username}
                          disabled
                        />
                        <i className="fa-solid fa-lock" style={{ color: 'var(--color-text-secondary)' }}></i>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">
                        Email
                        {profileData.email && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--color-success)' }}></i>}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="your.email@example.com"
                        disabled={!!profileData.email && userInfo?.email}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="mobile">
                        Mobile
                        {profileData.mobile && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--color-success)' }}></i>}
                      </label>
                      <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        value={profileData.mobile}
                        onChange={handleProfileChange}
                        placeholder="+1 234 567 8900"
                        disabled={!!profileData.mobile && userInfo?.mobile}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="age">
                        Age
                        {profileData.age && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--color-success)' }}></i>}
                      </label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={profileData.age}
                        onChange={handleProfileChange}
                        min="18"
                        max="120"
                        placeholder="25"
                        disabled={!!profileData.age && userInfo?.age}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">
                      Gender
                      {profileData.gender && <i className="fa-solid fa-lock" style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--color-success)' }}></i>}
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={profileData.gender}
                      onChange={handleProfileChange}
                      disabled={!!profileData.gender && userInfo?.gender}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <h3>Security</h3>

                <div className="security-item">
                  <div className="security-label">
                    <strong>Password</strong>
                  </div>
                  <div className="password-display">
                    <span>••••••••••</span>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="password-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      minLength="6"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      minLength="6"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-update" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="delete-section">
                  <h4>Delete Account</h4>
                  {!showDeleteConfirm ? (
                    <>
                      <p className="delete-warning">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        className="btn-delete"
                        onClick={() => setShowDeleteConfirm(true)}
                        type="button"
                      >
                        Delete account
                      </button>
                    </>
                  ) : (
                    <div className="delete-confirmation-box" style={{ marginTop: '15px' }}>
                      <p className="delete-warning" style={{ marginBottom: '10px', color: '#dc3545' }}>
                        To confirm deletion, type <strong>delete account</strong> below:
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        placeholder="delete account"
                        className="delete-input"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          marginBottom: '10px',
                          fontSize: '1rem'
                        }}
                      />
                      <div className="delete-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmationText !== 'delete account' || loading}
                          style={{
                            background: deleteConfirmationText === 'delete account' ? '#dc3545' : '#e9ecef',
                            color: deleteConfirmationText === 'delete account' ? 'white' : '#6c757d',
                            cursor: deleteConfirmationText === 'delete account' ? 'pointer' : 'not-allowed',
                            opacity: loading ? 0.7 : 1
                          }}
                        >
                          {loading ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmationText('');
                            setMessage({ type: '', text: '' });
                          }}
                          style={{
                            padding: '10px 20px',
                            background: 'transparent',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
