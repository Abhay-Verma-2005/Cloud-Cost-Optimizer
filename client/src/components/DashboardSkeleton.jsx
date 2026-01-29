import React from 'react';
import Skeleton, { SkeletonCard } from './Skeleton';

const DashboardSkeleton = () => {
    return (
        <div style={{ padding: '20px 0' }}>
            {/* Header / Cost Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Savings Opportunities */}
                    <div className="section-card" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
                        <Skeleton type="title" width="40%" />
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <Skeleton type="text" width="60%" />
                                <Skeleton type="text" width="20%" />
                            </div>
                            <Skeleton type="rect" height="150px" />
                        </div>
                    </div>

                    {/* Resource Breakdown */}
                    <div className="section-card" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
                        <Skeleton type="title" width="30%" />
                        <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
                            <Skeleton type="circle" />
                            <div style={{ flex: 1 }}>
                                <Skeleton type="text" />
                                <Skeleton type="text" width="80%" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - AI Advice Placeholder */}
                <div className="section-card" style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <Skeleton type="circle" style={{ width: '40px', height: '40px' }} />
                        <Skeleton type="title" width="50%" style={{ marginBottom: 0 }} />
                    </div>
                    <Skeleton type="text" />
                    <Skeleton type="text" />
                    <Skeleton type="text" width="90%" />
                    <Skeleton type="text" width="95%" />
                    <br />
                    <Skeleton type="text" width="85%" />
                    <Skeleton type="text" />
                    <Skeleton type="text" width="80%" />
                </div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
