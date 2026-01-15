'use client';
import './app.css';
import { Tabs, Spin } from 'antd';
import type { TabsProps } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import TedPage from './ted/page';
import ReadPage from './read/page';
import SportPage from './sport/page';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export type TabTypes = 'ted' | 'sport' | 'book' | 'home'

function PlanPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    // 初始化时就从 URL 读取，避免闪烁
    const initialTab = (() => {
        const tabParam = searchParams.get('tab') as TabTypes;
        if (tabParam && ['ted', 'sport', 'book'].includes(tabParam)) {
            return tabParam;
        }
        return 'ted';
    })();
    
    const [tab, setTab] = useState<TabTypes>(initialTab);

    // 从 URL 参数读取 tab
    useEffect(() => {
        const tabParam = searchParams.get('tab') as TabTypes;
        if (tabParam && ['ted', 'sport', 'book'].includes(tabParam)) {
            if (tabParam !== tab) {
                setTab(tabParam);
            }
        } else {
            // 如果没有 URL 参数，默认使用 ted，并更新 URL
            if (tab !== 'ted') {
                router.replace('/plans?tab=ted');
            }
        }
    }, [searchParams, router, tab]);

    const onChange = (key: string) => {
        const newTab = key as TabTypes;
        
        // 如果选择的是返回主页 tab，直接跳转到主页
        if (newTab === 'home') {
            router.push('/');
            return;
        }
        
        setTab(newTab);
        // 更新 URL 参数
        router.push(`/plans?tab=${newTab}`);
    };

    const items: TabsProps['items'] = [
        {
            key: 'ted',
            label: '🎧 TED',
            children: <TedPage />,
        },
        {
            key: 'sport',
            label: '🏃 健身',
            children: <SportPage />,
        },
        {
            key: 'book',
            label: '📖 书/电影',
            children: <ReadPage />,
        },
        {
            key: 'home',
            label: (
                <span>
                    <ArrowLeftOutlined /> 返回
                </span>
            ),
            children: null, // 这个 tab 不会显示内容，点击后直接跳转
        },
    ];

    return <Tabs activeKey={tab} centered items={items} onChange={onChange} />
}

export default function PlanPage() {
    return (
        <Suspense fallback={
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px' 
            }}>
                <Spin size="large" />
            </div>
        }>
            <PlanPageContent />
        </Suspense>
    );
}