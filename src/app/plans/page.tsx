'use client';
import './app.css';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import TedPage from './ted/page';
import ReadPage from './read/page';
import { useState } from 'react';

export type TabTypes = 'ted' | 'sport' | 'book'

export default function PlanPage() {
    const [tab, setTab] = useState<TabTypes>('ted')

    const onChange = (key: string) => {
        setTab(key as TabTypes);
    };
    const items: TabsProps['items'] = [
        {
            key: 'ted',
            label: '🎧 TED',
            children: <TedPage />,
        },
        {
            key: 'sport',
            label: '🏃 跑步',
            children: 'Content of Tab Pane 2',
        },
        {
            key: 'book',
            label: '📖 书/电影',
            children: <ReadPage />,
        },
    ];
    return <Tabs activeKey={tab} centered items={items} onChange={onChange} />

}