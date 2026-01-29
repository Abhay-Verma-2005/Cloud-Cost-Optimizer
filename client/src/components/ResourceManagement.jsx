import { useState, useEffect, useRef } from 'react';
import { SkeletonTable } from './Skeleton';

function ResourceManagement({ awsData, awsCredentials }) {
    // Constants
    const DEFAULT_CPU_LIMIT = 80;
    const DEFAULT_AUTO_SHUTDOWN = true;
    const LOW_UTILIZATION_THRESHOLD = 5; // Production mode alert threshold (< 5%)

    const [instances, setInstances] = useState([]);
    const [limits, setLimits] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState({});
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [mode, setMode] = useState('practicing'); // 'practicing' | 'production'
    const [productionModeEnabled, setProductionModeEnabled] = useState(false); // Production mode on/off
    const [emailSettings, setEmailSettings] = useState({}); // Per-instance email enable/disable
    const [lastEmailSent, setLastEmailSent] = useState({}); // Track last email timestamp
    const refreshIntervalRef = useRef(null);

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    // Load production mode settings on mount
    useEffect(() => {
        const loadProductionModeSettings = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/production-mode-settings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();

                if (data.success) {
                    setProductionModeEnabled(data.enabled);
                    setEmailSettings(data.instanceSettings || {});
                }
            } catch (error) {
                console.error('Error loading production mode settings:', error);
            }
        };

        loadProductionModeSettings();
    }, []);


    // Load instances and limits on mount and when awsData changes
    useEffect(() => {
        if (awsData) {
            // First load shows spinner, subsequent loads are background refreshes
            loadInstancesAndLimits(!isInitialLoad);

            if (isInitialLoad) {
                setIsInitialLoad(false);
            }
            if (isManualRefreshing) {
                setIsManualRefreshing(false);
            }
        }
    }, [awsData, isInitialLoad]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (autoRefresh && awsCredentials) {
            console.log('🔄 Auto-refresh enabled - refreshing every 30 seconds');
            refreshIntervalRef.current = setInterval(() => {
                console.log('🔄 Auto-refreshing AWS data...');
                refreshAWSData();
            }, 30000); // 30 seconds

            return () => {
                if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    console.log('🛑 Auto-refresh stopped');
                }
            };
        }
    }, [autoRefresh, awsCredentials]);

    // Auto-shutdown Monitor Effect
    useEffect(() => {
        if (instances.length > 0) {
            instances.forEach(instance => {
                const instanceLimit = limits[instance.id];
                // Check if auto-shutdown is enabled and threshold breached
                if (instanceLimit?.autoShutdown &&
                    instance.cpuAvg > instanceLimit.cpuLimit &&
                    instance.state === 'running' &&
                    !saving[instance.id]) {

                    console.log(`⚡ Auto-shutdown triggering for ${instance.id}`);
                    handleStopInstance(instance.id, `Auto-shutdown: CPU ${instance.cpuAvg}% > ${instanceLimit.cpuLimit}%`, true);
                }
            });
        }
    }, [instances, limits]); // saving excluded to avoid rapid re-renders, handleStopInstance checks saving state anyway

    const refreshAWSData = async () => {
        setIsManualRefreshing(true);
        // Trigger a re-analysis to get fresh data
        const event = new CustomEvent('refreshAWSData');
        window.dispatchEvent(event);

        // Safety timeout to stop spinner if no data comes back quickly
        setTimeout(() => setIsManualRefreshing(false), 5000);
    };

    const loadInstancesAndLimits = async (isBackgroundRefresh = false) => {
        // Only show loading spinner on initial load, not on background refresh
        if (!isBackgroundRefresh) {
            setLoading(true);
        }

        try {
            console.log(isBackgroundRefresh ? '🔄 Background refresh (Metrics only)...' : 'Loading instances and limits...');

            // 1. FETCH LIMITS (Skip on background refresh to prevent input reset)
            // We only fetch limits on initial load. During auto-refresh, we keep current state
            // so user typing isn't interrupted.
            if (!isBackgroundRefresh) {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/instance-limits', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                console.log('Limits response:', data);

                if (data.success) {
                    // Create limits map
                    const limitsMap = {};
                    data.limits.forEach(limit => {
                        limitsMap[limit.instanceId] = {
                            cpuLimit: limit.cpuLimit,
                            autoShutdown: limit.autoShutdown,
                            autoMonitoring: limit.autoMonitoring || false,
                            breachCount: limit.breachCount || 0
                        };
                    });
                    setLimits(limitsMap);
                }
            }

            // 2. PROCESS INSTANCES (Always update this - CPU and State change dynamically)
            const instancesList = [];

            // Backend returns instances in awsData.ec2Details
            const allInstances = awsData?.ec2Details || awsData?.instances || [];
            const underutilizedEC2 = awsData?.underutilizedEC2 || [];
            const ec2Metrics = awsData?.ec2Metrics || {};

            // Only log on full load to reduce console noise
            if (!isBackgroundRefresh) {
                console.log('EC2 Details from backend:', allInstances);
            }

            // Process all instances
            if (Array.isArray(allInstances) && allInstances.length > 0) {
                allInstances.forEach(inst => {
                    // Check if this instance is underutilized
                    const isUnderutilized = underutilizedEC2.some(u => u.id === inst.id);
                    const underutilizedData = underutilizedEC2.find(u => u.id === inst.id);

                    // Get CPU from ec2Metrics (this has the actual CloudWatch data)
                    const instanceMetrics = ec2Metrics[inst.id];
                    let cpuAvg = 0;

                    // Priority order for CPU data:
                    if (instanceMetrics && instanceMetrics.cpu) {
                        cpuAvg = instanceMetrics.cpu.average || 0;
                    } else if (underutilizedData && underutilizedData.cpuAvg !== undefined) {
                        cpuAvg = underutilizedData.cpuAvg;
                    }

                    instancesList.push({
                        id: inst.id || 'unknown',
                        name: inst.tags?.Name || inst.id || 'Unnamed Instance',
                        type: inst.type || 'unknown',
                        state: inst.state || 'unknown',
                        cpuAvg: parseFloat(cpuAvg),
                        cpuMax: instanceMetrics?.cpu?.maximum || 0,
                        isUnderutilized: isUnderutilized
                    });
                });
            }

            if (!isBackgroundRefresh) {
                console.log('Final instances list:', instancesList);

                if (instancesList.length === 0) {
                    console.warn('⚠️ No instances found in data!');
                }
            } else {
                console.log(`✅ Metrics updated for ${instancesList.length} instances`);
            }

            // React will only re-render the changed text nodes (CPU/State), leaving inputs intact
            setInstances(instancesList);
        } catch (error) {
            console.error('Error loading instances:', error);
            // Don't clear instances on background error, keep old data
            if (!isBackgroundRefresh) {
                setInstances([]);
            }
        } finally {
            if (!isBackgroundRefresh) {
                setLoading(false);
            }
        }
    };



    const handleLimitChange = (instanceId, value) => {
        setLimits(prev => ({
            ...prev,
            [instanceId]: {
                ...prev[instanceId],
                cpuLimit: parseInt(value) || DEFAULT_CPU_LIMIT
            }
        }));
    };

    const handleAutoShutdownToggle = (instanceId) => {
        setLimits(prev => ({
            ...prev,
            [instanceId]: {
                ...prev[instanceId],
                autoShutdown: !prev[instanceId]?.autoShutdown
            }
        }));
    };

    const handleAutoMonitoringToggle = async (instanceId) => {
        const currentState = limits[instanceId]?.autoMonitoring || false;
        const newState = !currentState;

        setSaving(prev => ({ ...prev, [instanceId]: true }));

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/instance-auto-monitor', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceId,
                    enabled: newState,
                    cpuLimit: limits[instanceId]?.cpuLimit || DEFAULT_CPU_LIMIT
                })
            });

            const data = await response.json();

            if (data.success) {
                setLimits(prev => ({
                    ...prev,
                    [instanceId]: {
                        ...prev[instanceId],
                        autoMonitoring: newState
                    }
                }));
                alert(`Auto-monitoring ${newState ? 'enabled' : 'disabled'} for ${instanceId}`);
            } else {
                alert('Failed to update auto-monitoring: ' + data.message);
            }
        } catch (error) {
            console.error('Error toggling auto-monitoring:', error);
            alert('Failed to update auto-monitoring');
        } finally {
            setSaving(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    const handleSaveLimit = async (instanceId) => {
        setSaving(prev => ({ ...prev, [instanceId]: true }));

        try {
            const token = localStorage.getItem('authToken');
            const limit = limits[instanceId] || { cpuLimit: DEFAULT_CPU_LIMIT, autoShutdown: DEFAULT_AUTO_SHUTDOWN };

            const response = await fetch('/api/instance-limits', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceId,
                    cpuLimit: limit.cpuLimit,
                    autoShutdown: limit.autoShutdown
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`Limit saved for ${instanceId}: CPU ${limit.cpuLimit}%, Auto-shutdown: ${limit.autoShutdown ? 'ON' : 'OFF'}`);
            } else {
                alert('Failed to save limit: ' + data.message);
            }
        } catch (error) {
            console.error('Error saving limit:', error);
            alert('Failed to save limit');
        } finally {
            setSaving(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    const handleStopInstance = async (instanceId, reason = 'User triggered stop', skipConfirm = false) => {
        if (!skipConfirm && !window.confirm(`Are you sure you want to stop instance ${instanceId}?`)) {
            return;
        }

        setSaving(prev => ({ ...prev, [instanceId]: true }));

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/stop-instance', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceId,
                    reason
                })
            });

            const data = await response.json();

            if (data.success) {
                alert(`✅ Instance ${instanceId} stopped successfully!`);
                // Trigger refresh to update status
                refreshAWSData();
            } else {
                alert(`❌ Failed to stop instance: ${data.message}`);
            }
        } catch (error) {
            console.error('Error stopping instance:', error);
            alert('Failed to stop instance due to an error');
        } finally {
            setSaving(prev => ({ ...prev, [instanceId]: false }));
        }
    };

    // Toggle production mode on/off
    const handleProductionModeToggle = async () => {
        const newState = !productionModeEnabled;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/production-mode-settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ enabled: newState })
            });

            const data = await response.json();

            if (data.success) {
                setProductionModeEnabled(newState);
                alert(`✅ Production Mode ${newState ? 'enabled' : 'disabled'}! ${newState ? 'Background monitoring will send email alerts for low-utilization instances.' : 'Email alerts are now disabled.'}`);
            } else {
                alert('❌ Failed to update production mode settings');
            }
        } catch (error) {
            console.error('Error toggling production mode:', error);
            alert('Failed to update production mode');
        }
    };

    // Toggle email alerts for specific instance
    const handleInstanceEmailToggle = async (instanceId) => {
        const currentState = emailSettings[instanceId]?.emailEnabled !== false; // Default true
        const newState = !currentState;

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/production-mode-settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceId,
                    emailEnabled: newState
                })
            });

            const data = await response.json();

            if (data.success) {
                setEmailSettings(prev => ({
                    ...prev,
                    [instanceId]: { emailEnabled: newState }
                }));
            } else {
                alert('❌ Failed to update email settings');
            }
        } catch (error) {
            console.error('Error toggling email setting:', error);
            alert('Failed to update email setting');
        }
    };

    const handleSendLowUtilizationEmail = async (instance) => {
        // Check if production mode is enabled
        if (!productionModeEnabled) {
            alert('⚠️ Production Mode is disabled. Please enable it to send email alerts.');
            return;
        }

        // Check if email is enabled for this instance
        const emailEnabled = emailSettings[instance.id]?.emailEnabled !== false;
        if (!emailEnabled) {
            alert('⚠️ Email alerts are disabled for this instance.');
            return;
        }

        // Check 1-hour rate limit
        const lastSent = lastEmailSent[instance.id];
        if (lastSent) {
            const oneHourAgo = Date.now() - 60 * 60 * 1000;
            if (lastSent > oneHourAgo) {
                const minutesLeft = Math.ceil((lastSent - oneHourAgo) / 60000);
                alert(`⏰ Email was sent recently. Please wait ${minutesLeft} minutes before sending again.`);
                return;
            }
        }

        setSaving(prev => ({ ...prev, [instance.id]: true }));

        try {
            const token = localStorage.getItem('authToken');

            // Get user info
            const userResponse = await fetch('/api/user-profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const userData = await userResponse.json();

            // Validate email exists
            if (!userData.email) {
                console.error('User email not found in profile');
                alert('❌ Email not configured. Please update your profile with an email address.');
                setSaving(prev => ({ ...prev, [instance.id]: false }));
                return;
            }

            // Get AWS account ID from credentials
            const credsResponse = await fetch('/api/aws-credentials', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const credsData = await credsResponse.json();

            // Construct the resource management URL
            const actionUrl = `${window.location.origin}/dashboard#resource-management`;

            // Prepare EmailJS parameters
            const templateParams = {
                user_name: userData.username || 'User',
                aws_account_id: credsData.awsAccessKey?.substring(0, 8) + '...' || 'N/A',
                resource_name: `${instance.name} (${instance.id})`,
                action_url: actionUrl,
                to_email: userData.email
            };

            // Send email via EmailJS
            const emailResponse = await fetch('/api/send-low-utilization-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceId: instance.id,
                    instanceName: instance.name,
                    cpuUsage: instance.cpuAvg,
                    templateParams
                })
            });

            const emailData = await emailResponse.json();

            if (emailData.success) {
                console.log(`✅ Low utilization alert sent for ${instance.name}`);
                // Mark email timestamp
                setLastEmailSent(prev => ({ ...prev, [instance.id]: Date.now() }));
                alert(`✅ Email alert sent successfully for ${instance.name}!`);
            } else {
                console.error(`❌ Failed to send email: ${emailData.message}`);
                alert(`❌ Failed to send email: ${emailData.message}`);
            }
        } catch (error) {
            console.error('Error sending email:', error);
        } finally {
            setSaving(prev => ({ ...prev, [instance.id]: false }));
        }
    };

    // Note: Email sending is now handled by the backend monitoring service
    // which runs every 15 minutes independently of user sessions


    if (loading) {
        return (
            <div className="section-card">
                <div className="section-header">
                    <h2><i className="fa-solid fa-sliders"></i> Resource Management</h2>
                </div>
                <div style={{ padding: '20px' }}>
                    <SkeletonTable rows={5} columns={8} />
                </div>
            </div>
        );
    }

    if (instances.length === 0) {
        return (
            <div className="section-card">
                <div className="section-header">
                    <h2><i className="fa-solid fa-sliders"></i> Resource Management</h2>
                </div>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <i className="fa-solid fa-server" style={{ fontSize: '2rem', color: '#999', marginBottom: '16px' }}></i>
                    <p style={{ color: '#666' }}>No instances found. Run an analysis first.</p>
                </div>
            </div>
        );
    }

    return (
        <div id="resourceManagementContent" style={{ display: 'block' }}>
            <div className="section-card">
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2><i className="fa-solid fa-sliders"></i> Resource Management & Auto-Shutdown</h2>
                        <p style={{ fontSize: '0.9rem', color: '#6c757d', margin: '8px 0 0 0' }}>
                            Set CPU limits and enable auto-shutdown for your EC2 instances
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', background: '#e9ecef', borderRadius: '4px', padding: '2px', marginRight: '10px' }}>
                            <button
                                onClick={() => setMode('practicing')}
                                style={{
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    background: mode === 'practicing' ? 'white' : 'transparent',
                                    color: mode === 'practicing' ? '#0d6efd' : '#495057',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    boxShadow: mode === 'practicing' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fa-solid fa-graduation-cap"></i> Practicing
                            </button>
                            <button
                                onClick={() => setMode('production')}
                                style={{
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    background: mode === 'production' ? 'white' : 'transparent',
                                    color: mode === 'production' ? '#0d6efd' : '#495057',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                    boxShadow: mode === 'production' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fa-solid fa-industry"></i> Production
                            </button>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={autoRefresh}
                                onChange={(e) => setAutoRefresh(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                Auto-refresh
                            </span>
                        </label>
                        <button
                            onClick={refreshAWSData}
                            disabled={isManualRefreshing}
                            style={{
                                padding: '8px 16px',
                                background: isManualRefreshing ? '#218838' : '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isManualRefreshing ? 'wait' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                opacity: isManualRefreshing ? 0.8 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <i className={`fa-solid fa-refresh ${isManualRefreshing ? 'fa-spin' : ''}`}></i>
                            {isManualRefreshing ? 'Refreshing...' : 'Refresh Now'}
                        </button>
                    </div>
                </div>

                {mode === 'practicing' ? (
                    <>
                        <div style={{ overflowX: 'auto', position: 'relative', minHeight: '200px' }}>
                            {isManualRefreshing && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 10,
                                    borderRadius: '8px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#007bff' }}></i>
                                        <span style={{ fontWeight: 600, color: '#007bff' }}>Refreshing Data...</span>
                                    </div>
                                </div>
                            )}
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                                opacity: isManualRefreshing ? 0.5 : 1,
                                transition: 'opacity 0.2s'
                            }}>
                                <thead>
                                    <tr style={{
                                        background: '#f8f9fa',
                                        borderBottom: '2px solid #dee2e6'
                                    }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Instance</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>State</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Current CPU</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>CPU Limit (%)</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Auto-Shutdown</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Auto-Monitor</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {instances.map((instance) => {
                                        const instanceLimit = limits[instance.id] || { cpuLimit: DEFAULT_CPU_LIMIT, autoShutdown: DEFAULT_AUTO_SHUTDOWN, autoMonitoring: false };
                                        const isSaving = saving[instance.id];
                                        const isMonitored = instanceLimit.autoMonitoring;
                                        const cpuExceedsLimit = instance.cpuAvg > instanceLimit.cpuLimit;

                                        // IMMEDIATE STOP LOGIC MOVED TO useEffect
                                        // Keeping render pure

                                        return (
                                            <tr
                                                key={instance.id}
                                                style={{
                                                    borderBottom: '1px solid #dee2e6',
                                                    background: cpuExceedsLimit ? '#fff3cd' : 'transparent'
                                                }}
                                            >
                                                <td style={{ padding: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                            {instance.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                                            {instance.id}
                                                        </div>
                                                        {instance.isUnderutilized && (
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                background: '#fff3cd',
                                                                color: '#856404',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                display: 'inline-block',
                                                                marginTop: '4px'
                                                            }}>
                                                                Underutilized
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        background: '#e9ecef',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {instance.type}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        background: instance.state === 'running' ? '#d4edda' : '#f8d7da',
                                                        color: instance.state === 'running' ? '#155724' : '#721c24',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600
                                                    }}>
                                                        {instance.state}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{
                                                        fontWeight: 600,
                                                        color: instance.cpuAvg < 10 ? '#28a745' : instance.cpuAvg > 80 ? '#dc3545' : '#495057'
                                                    }}
                                                        title={`Average: ${instance.cpuAvg.toFixed(2)}% | Max: ${instance.cpuMax.toFixed(2)}%`}
                                                    >
                                                        {instance.cpuAvg.toFixed(1)}%
                                                        {instance.cpuMax > 0 && (
                                                            <div style={{ fontSize: '0.7rem', color: '#6c757d', fontWeight: 'normal' }}>
                                                                max: {instance.cpuMax.toFixed(1)}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="10"
                                                        max="100"
                                                        value={instanceLimit.cpuLimit}
                                                        onChange={(e) => handleLimitChange(instance.id, e.target.value)}
                                                        style={{
                                                            width: '70px',
                                                            padding: '6px',
                                                            border: '1px solid #dee2e6',
                                                            borderRadius: '4px',
                                                            textAlign: 'center',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <label style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        cursor: 'pointer'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={instanceLimit.autoShutdown}
                                                            onChange={() => handleAutoShutdownToggle(instance.id)}
                                                            style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    </label>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {/* TOGGLE SWITCH FOR AUTO-MONITOR */}
                                                    <label style={{
                                                        position: 'relative',
                                                        display: 'inline-block',
                                                        width: '40px',
                                                        height: '20px'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={isMonitored}
                                                            disabled={isSaving}
                                                            onChange={() => handleAutoMonitoringToggle(instance.id)}
                                                            style={{ opacity: 0, width: 0, height: 0 }}
                                                        />
                                                        <span style={{
                                                            position: 'absolute',
                                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                                            top: 0,
                                                            left: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            backgroundColor: isMonitored ? '#28a745' : '#ccc',
                                                            transition: '.4s',
                                                            borderRadius: '34px'
                                                        }}>
                                                            <span style={{
                                                                position: 'absolute',
                                                                content: "",
                                                                height: '16px',
                                                                width: '16px',
                                                                left: isMonitored ? '22px' : '2px',
                                                                bottom: '2px',
                                                                backgroundColor: 'white',
                                                                transition: '.4s',
                                                                borderRadius: '50%'
                                                            }}></span>
                                                        </span>
                                                    </label>
                                                    {isSaving && <div style={{ fontSize: '0.7rem', color: '#666' }}>Saving...</div>}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleSaveLimit(instance.id)}
                                                        disabled={isSaving}
                                                        style={{
                                                            padding: '8px 16px',
                                                            background: 'linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.85rem',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        {isSaving ? (
                                                            <i className="fa-solid fa-spinner fa-spin"></i>
                                                        ) : (
                                                            <>
                                                                <i className="fa-solid fa-save"></i> Save
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legend */}
                        <div style={{
                            marginTop: '20px',
                            padding: '16px',
                            background: '#f8f9fa',
                            borderRadius: '8px',
                            fontSize: '0.85rem'
                        }}>
                            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>
                                <i className="fa-solid fa-info-circle"></i> How It Works
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
                                <li><strong>CPU Limit</strong>: Set the maximum CPU usage threshold (10-100%)</li>
                                <li><strong>Auto-Shutdown</strong>: Enable to automatically stop instance when limit is exceeded</li>
                                <li><strong>Auto-Monitor</strong>: Enable Lambda-based monitoring (checks every 5 minutes)</li>
                                <li><strong>Auto-Refresh</strong>: Automatically refresh data every 30 seconds to see real-time changes</li>
                                <li><strong>Save</strong>: Click to save your limit settings</li>
                            </ul>
                            <div style={{
                                marginTop: '12px',
                                padding: '10px 14px',
                                background: '#f5f5f5',
                                borderRadius: '0px',
                                border: '1px solid #ddd',
                                color: '#555',
                                fontSize: '0.85rem'
                            }}>
                                Auto-Refresh: Data refreshes every 30 seconds when enabled. You can also click "Refresh Now" for immediate updates.
                            </div>
                        </div>
                    </>
                ) : (
                    <div id="productionModeContainer">
                        {/* AWS Style Banner */}
                        <div style={{
                            marginBottom: '24px',
                            padding: '16px 20px',
                            background: productionModeEnabled ? '#f0f9eb' : '#fff8f6',
                            border: `1px solid ${productionModeEnabled ? '#c3e6cb' : '#f5c6cb'}`,
                            borderRadius: '2px', // AWS square-ish corners
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderLeft: `8px solid ${productionModeEnabled ? '#28a745' : '#dc3545'}`
                        }}>
                            <div>
                                <h4 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: '1rem',
                                    color: productionModeEnabled ? '#155724' : '#721c24',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {productionModeEnabled ? (
                                        <>
                                            <i className="fa-solid fa-check-circle"></i> Production Mode Enabled
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-ban"></i> Low Utilization Detection Disabled
                                        </>
                                    )}
                                </h4>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.85rem',
                                    color: productionModeEnabled ? '#28a745' : '#721c24',
                                    lineHeight: '1.4'
                                }}>
                                    {productionModeEnabled
                                        ? '✅ Background monitoring active. Email alerts will be sent automatically every 15 minutes for low-utilization instances.'
                                        : 'Monitoring instances with CPU usage below 5%. Email alerts are sent automatically for cost optimization.'}
                                </p>
                            </div>

                            <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px', flexShrink: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={productionModeEnabled}
                                    onChange={handleProductionModeToggle}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span className="slider round" style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: productionModeEnabled ? '#28a745' : '#ccc',
                                    transition: '.4s',
                                    borderRadius: '24px'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: "",
                                        height: '20px',
                                        width: '20px',
                                        left: productionModeEnabled ? '26px' : '4px',
                                        bottom: '2px',
                                        backgroundColor: 'white',
                                        transition: '.4s',
                                        borderRadius: '50%'
                                    }}></span>
                                </span>
                            </label>
                        </div>

                        {instances.filter(inst => inst.cpuAvg < LOW_UTILIZATION_THRESHOLD && inst.state === 'running').length === 0 ? (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '2px dashed #dee2e6'
                            }}>
                                <i className="fa-solid fa-check-circle" style={{ fontSize: '3rem', color: '#28a745', marginBottom: '20px' }}></i>
                                <h3 style={{ color: '#495057', marginBottom: '10px' }}>All Resources Optimized</h3>
                                <p style={{ color: '#6c757d' }}>No low-utilization instances detected (CPU &lt; {LOW_UTILIZATION_THRESHOLD}%).</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto', position: 'relative', minHeight: '150px' }}>
                                {isManualRefreshing && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'rgba(255, 255, 255, 0.7)',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        zIndex: 10,
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: '#dc3545' }}></i>
                                            <span style={{ fontWeight: 600, color: '#dc3545' }}>Checking Metrics...</span>
                                        </div>
                                    </div>
                                )}
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.9rem',
                                    opacity: isManualRefreshing ? 0.5 : 1,
                                    transition: 'opacity 0.2s'
                                }}>
                                    <thead>
                                        <tr style={{
                                            background: '#f8f9fa',
                                            borderBottom: '2px solid #dee2e6'
                                        }}>
                                            <th style={{ padding: '12px', textAlign: 'left' }}>Instance</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Type</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Current CPU</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Avg Usage</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Max Usage</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Email Alerts</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Last Email</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {instances.filter(inst => inst.cpuAvg < LOW_UTILIZATION_THRESHOLD && inst.state === 'running').map((instance) => {
                                            const isSaving = saving[instance.id];

                                            return (
                                                <tr
                                                    key={instance.id}
                                                    style={{
                                                        borderBottom: '1px solid #dee2e6',
                                                        background: '#fff3cd'
                                                    }}
                                                >
                                                    <td style={{ padding: '12px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                                {instance.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                                                                {instance.id}
                                                            </div>
                                                            <span style={{
                                                                fontSize: '0.75rem',
                                                                background: '#dc3545',
                                                                color: 'white',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                display: 'inline-block',
                                                                marginTop: '4px'
                                                            }}>
                                                                Low Utilization
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <span style={{
                                                            background: '#e9ecef',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {instance.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <div style={{
                                                            fontWeight: 600,
                                                            color: '#dc3545',
                                                            fontSize: '1.1rem'
                                                        }}>
                                                            {instance.cpuAvg.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <div style={{ color: '#6c757d' }}>
                                                            {instance.cpuAvg.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <div style={{ color: '#6c757d' }}>
                                                            {instance.cpuMax.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={emailSettings[instance.id]?.emailEnabled !== false}
                                                                onChange={() => handleInstanceEmailToggle(instance.id)}
                                                                style={{ opacity: 0, width: 0, height: 0 }}
                                                            />
                                                            <span className="slider round" style={{
                                                                position: 'absolute',
                                                                cursor: 'pointer',
                                                                top: 0,
                                                                left: 0,
                                                                right: 0,
                                                                bottom: 0,
                                                                backgroundColor: emailSettings[instance.id]?.emailEnabled !== false ? '#28a745' : '#ccc',
                                                                transition: '.4s',
                                                                borderRadius: '20px'
                                                            }}>
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    content: "",
                                                                    height: '16px',
                                                                    width: '16px',
                                                                    left: emailSettings[instance.id]?.emailEnabled !== false ? '22px' : '2px',
                                                                    bottom: '2px',
                                                                    backgroundColor: 'white',
                                                                    transition: '.4s',
                                                                    borderRadius: '50%'
                                                                }}></span>
                                                            </span>
                                                        </label>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {lastEmailSent[instance.id] ? (
                                                            <div style={{ fontSize: '0.8rem' }}>
                                                                <div style={{ color: '#155724', fontWeight: 600 }}>
                                                                    <i className="fa-solid fa-check"></i> Sent
                                                                </div>
                                                                <div style={{ color: '#6c757d', fontSize: '0.75rem' }}>
                                                                    {new Date(lastEmailSent[instance.id]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#6c757d', fontSize: '0.8rem' }}>-</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleStopInstance(instance.id, `Production Mode: Low CPU ${instance.cpuAvg.toFixed(2)}%`)}
                                                            disabled={isSaving}
                                                            style={{
                                                                padding: '8px 16px',
                                                                background: '#dc3545',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {isSaving ? (
                                                                <i className="fa-solid fa-spinner fa-spin"></i>
                                                            ) : (
                                                                <>
                                                                    <i className="fa-solid fa-stop"></i> Stop Instance
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}


                    </div>
                )}
            </div>
        </div>
    );
}

export default ResourceManagement;
