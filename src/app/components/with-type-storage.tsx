'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const TOKEN_KEY = 'j-user-id';

const withTypeStorage = (WrappedComponent: React.ComponentType) => {
    const EnhancedComponent = () => {
        const searchParams = useSearchParams();
        const tokenFromUrl = searchParams.get('j-user-id') ?? searchParams.get('type');

        useEffect(() => {
            if (tokenFromUrl) {
                localStorage.setItem(TOKEN_KEY, tokenFromUrl);
                localStorage.setItem('type', tokenFromUrl);
            }
        }, [tokenFromUrl]);

        return <WrappedComponent />;
    };

    return EnhancedComponent;
};

export default withTypeStorage;