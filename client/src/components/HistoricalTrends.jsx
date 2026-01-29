import { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency, formatDate } from '../utils/helpers';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

function HistoricalTrends({ history }) {
    const [chartData, setChartData] = useState(null);
    const [stats, setStats] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]);

    useEffect(() => {
        const fetchActivityLogs = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/activity-logs?limit=50', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setActivityLogs(data.logs);
                }
            } catch (error) {
                console.error('Failed to fetch activity logs:', error);
            }
        };

        fetchActivityLogs();
    }, []);

    useEffect(() => {
        if (history && history.length > 0) {
            processHistoricalData(history);
        }
    }, [history]);

    const processHistoricalData = (data) => {
        // Sort by timestamp (oldest first)
        const sortedData = [...data].sort((a, b) =>
            new Date(a.timestamp || a.analyzedAt) - new Date(b.timestamp || b.analyzedAt)
        );

        // Extract data for charts
        const labels = sortedData.map(item =>
            formatDate(item.timestamp || item.analyzedAt)
        );

        const costs = sortedData.map(item => item.totalMonthlyCost || 0);
        const savings = sortedData.map(item => item.savingsOpportunities || 0);
        const instances = sortedData.map(item => item.totalInstances || 0);
        const underutilizedEC2 = sortedData.map(item => item.underutilizedEC2?.length || 0);
        const underutilizedEBS = sortedData.map(item => item.underutilizedEBS?.length || 0);

        // Calculate statistics
        const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
        const maxCost = Math.max(...costs);
        const minCost = Math.min(...costs);
        const totalSavings = savings.reduce((a, b) => a + b, 0);
        const avgSavings = totalSavings / savings.length;
        const latestCost = costs[costs.length - 1];
        const previousCost = costs.length > 1 ? costs[costs.length - 2] : latestCost;
        const costTrend = ((latestCost - previousCost) / previousCost * 100).toFixed(1);

        setStats({
            avgCost,
            maxCost,
            minCost,
            totalSavings,
            avgSavings,
            latestCost,
            costTrend,
            dataPoints: sortedData.length
        });

        setChartData({
            labels,
            costTrendData: {
                labels,
                datasets: [
                    {
                        label: 'Monthly Cost',
                        data: costs,
                        borderColor: 'rgb(255, 153, 0)',
                        backgroundColor: 'rgba(255, 153, 0, 0.1)',
                        tension: 0.4,
                        fill: true,
                    },
                    {
                        label: 'Potential Savings',
                        data: savings,
                        borderColor: 'rgb(39, 174, 96)',
                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                        tension: 0.4,
                        fill: true,
                    }
                ]
            },
            resourceTrendData: {
                labels,
                datasets: [
                    {
                        label: 'Total Instances',
                        data: instances,
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    },
                    {
                        label: 'Underutilized EC2',
                        data: underutilizedEC2,
                        backgroundColor: 'rgba(243, 156, 18, 0.7)',
                    },
                    {
                        label: 'Underutilized EBS',
                        data: underutilizedEBS,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    }
                ]
            },
            savingsDistribution: {
                labels: ['EC2 Savings', 'EBS Savings', 'Other Opportunities'],
                datasets: [{
                    data: [
                        sortedData[sortedData.length - 1]?.underutilizedEC2?.reduce((sum, i) => sum + (i.estimatedSavings || 35), 0) || 0,
                        sortedData[sortedData.length - 1]?.underutilizedEBS?.reduce((sum, v) => sum + (v.estimatedSavings || 15), 0) || 0,
                        (sortedData[sortedData.length - 1]?.savingsOpportunities || 0) * 0.2
                    ],
                    backgroundColor: [
                        'rgba(255, 153, 0, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(39, 174, 96, 0.8)',
                    ],
                    borderColor: [
                        'rgb(255, 153, 0)',
                        'rgb(52, 152, 219)',
                        'rgb(39, 174, 96)',
                    ],
                    borderWidth: 2,
                }]
            }
        });
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: 'Poppins',
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    family: 'Poppins',
                    size: 14
                },
                bodyFont: {
                    family: 'Poppins',
                    size: 12
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: {
                        family: 'Poppins'
                    }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        family: 'Poppins'
                    }
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        family: 'Poppins',
                        size: 12
                    },
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                callbacks: {
                    label: function (context) {
                        return context.label + ': ' + formatCurrency(context.parsed);
                    }
                }
            }
        }
    };

    if (!history || history.length === 0) {
        return (
            <div id="historicalTrendsContent" style={{ display: 'block' }}>
                <div className="section-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <i className="fa-solid fa-chart-line" style={{ fontSize: '3rem', color: '#FF9900', marginBottom: '20px' }}></i>
                    <h2 style={{ marginBottom: '15px' }}>No Historical Data</h2>
                    <p style={{ color: '#666' }}>
                        Run multiple analyses over time to see cost trends and patterns
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div id="historicalTrendsContent" style={{ display: 'block' }}>
            {/* Statistics Overview */}
            {stats && (
                <div className="section-card" style={{ marginBottom: '24px' }}>
                    <div className="section-header">
                        <h2><i className="fa-solid fa-chart-bar"></i> Cost Statistics</h2>
                    </div>
                    <div className="metrics-grid">
                        <div className="metric-box primary">
                            <div className="metric-label">Average Cost</div>
                            <div className="metric-value">{formatCurrency(stats.avgCost)}</div>
                            <div className="metric-change">Across {stats.dataPoints} analyses</div>
                        </div>
                        <div className="metric-box success">
                            <div className="metric-label">Total Savings Identified</div>
                            <div className="metric-value">{formatCurrency(stats.totalSavings)}</div>
                            <div className="metric-change">Average: {formatCurrency(stats.avgSavings)}/month</div>
                        </div>
                        <div className="metric-box warning">
                            <div className="metric-label">Cost Trend</div>
                            <div className="metric-value">
                                {stats.costTrend > 0 ? '+' : ''}{stats.costTrend}%
                            </div>
                            <div className="metric-change">
                                {stats.costTrend > 0 ? '📈 Increasing' : stats.costTrend < 0 ? '📉 Decreasing' : '➡️ Stable'}
                            </div>
                        </div>
                        <div className="metric-box info">
                            <div className="metric-label">Peak Cost</div>
                            <div className="metric-value">{formatCurrency(stats.maxCost)}</div>
                            <div className="metric-change">Lowest: {formatCurrency(stats.minCost)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cost Trend Chart */}
            {chartData && (
                <div className="section-card" style={{ marginBottom: '24px' }}>
                    <div className="section-header">
                        <h2><i className="fa-solid fa-chart-line"></i> Cost Trends Over Time</h2>
                    </div>
                    <div style={{ height: '350px', padding: '20px' }}>
                        <Line data={chartData.costTrendData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Resource Utilization Chart */}
            {chartData && (
                <div className="section-card" style={{ marginBottom: '24px' }}>
                    <div className="section-header">
                        <h2><i className="fa-solid fa-server"></i> Resource Utilization Trends</h2>
                    </div>
                    <div style={{ height: '350px', padding: '20px' }}>
                        <Bar data={chartData.resourceTrendData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* Savings Distribution */}
            {chartData && (
                <div className="section-card">
                    <div className="section-header">
                        <h2><i className="fa-solid fa-chart-pie"></i> Savings Opportunities Distribution</h2>
                    </div>
                    <div style={{
                        height: '350px',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                        <div style={{ maxWidth: '400px', width: '100%', height: '100%' }}>
                            <Doughnut data={chartData.savingsDistribution} options={doughnutOptions} />
                        </div>
                    </div>
                </div>
            )}

            {/* Work Performance History (Audit Logs) */}
            <div className="section-card" style={{ marginTop: '24px' }}>
                <div className="section-header">
                    <h2><i className="fa-solid fa-clock-rotate-left"></i> Work Performance History</h2>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.9rem'
                    }}>
                        <thead>
                            <tr style={{
                                background: '#f8f9fa',
                                borderBottom: '2px solid #dee2e6'
                            }}>
                                <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Time</th>
                                <th style={{ padding: '12px', textAlign: 'left', width: '25%' }}>Action</th>
                                <th style={{ padding: '12px', textAlign: 'left' }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activityLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                                        No recent activity recorded.
                                    </td>
                                </tr>
                            ) : (
                                activityLogs.map((log, index) => (
                                    <tr key={index} style={{
                                        borderBottom: '1px solid #dee2e6',
                                        transition: 'background 0.2s'
                                    }}
                                        onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '12px', color: '#6c757d', fontSize: '0.85rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: 600 }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {/* Icon based on action type */}
                                                {log.action.toLowerCase().includes('stop') && <i className="fa-solid fa-stop-circle" style={{ color: '#dc3545' }}></i>}
                                                {log.action.toLowerCase().includes('email') && <i className="fa-solid fa-envelope" style={{ color: '#ffc107' }}></i>}
                                                {log.action.toLowerCase().includes('limit') && <i className="fa-solid fa-sliders" style={{ color: '#0d6efd' }}></i>}
                                                {log.action.toLowerCase().includes('production') && <i className="fa-solid fa-industry" style={{ color: '#198754' }}></i>}
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px', color: '#495057' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default HistoricalTrends;
