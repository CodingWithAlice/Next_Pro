'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const withTypeStorage = (WrappedComponent: React.ComponentType) => {
    const EnhancedComponent = (props: {[key: string]: string | number }) => {
        const searchParams = useSearchParams();
        const type = searchParams.get('type');

        useEffect(() => {
            if (type) {
                localStorage.setItem('type', type);
            }
        }, [type]);

        return <WrappedComponent {...props} />;
    };

    return EnhancedComponent;
};

export default withTypeStorage;