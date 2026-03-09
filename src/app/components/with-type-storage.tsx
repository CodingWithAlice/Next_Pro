'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const TOKEN_KEY = 'j-user-id';

const withTypeStorage = (WrappedComponent: React.ComponentType) => {
    const EnhancedComponent = () => {
        const searchParams = useSearchParams();
        const router = useRouter();
        const pathname = usePathname();
        const tokenFromUrl = searchParams.get('j-user-id') ?? searchParams.get('type');

        useEffect(() => {
            if (tokenFromUrl) {
                localStorage.setItem(TOKEN_KEY, tokenFromUrl);
                localStorage.setItem('type', tokenFromUrl);
                const nextUrl = new URL(pathname, window.location.origin);
                router.replace(nextUrl.pathname, { scroll: false });
            }
        }, [tokenFromUrl, pathname, router]);

        return <WrappedComponent />;
    };

    return EnhancedComponent;
};

export default withTypeStorage;