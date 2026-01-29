import React from 'react';

const Skeleton = ({ type = 'text', width, height, count = 1, style }) => {
    const renderSkeleton = (key) => {
        const styles = {
            width,
            height,
            ...style
        };

        let className = 'skeleton';
        if (type === 'text') className += ' skeleton-text';
        if (type === 'title') className += ' skeleton-title';
        if (type === 'rect') className += ' skeleton-rect';
        if (type === 'circle') className += ' skeleton-circle';
        if (type === 'card') className += ' skeleton-card';

        return <div key={key} className={className} style={styles}></div>;
    };

    if (count === 1) {
        return renderSkeleton(0);
    }

    return (
        <>
            {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
        </>
    );
};

export const SkeletonTable = ({ rows = 5, columns = 5 }) => {
    return (
        <div style={{ width: '100%' }}>
            {/* Header */}
            <div className="skeleton-table-row" style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={`head-${i}`} className="skeleton-cell" style={{ height: '30px' }}></div>
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={`row-${r}`} className="skeleton-table-row">
                    {Array.from({ length: columns }).map((_, c) => (
                        <div key={`cell-${r}-${c}`} className="skeleton-cell"></div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton skeleton-title" style={{ width: '60%' }}></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-rect" style={{ height: '100px', marginTop: 'auto' }}></div>
        </div>
    );
}

export default Skeleton;
