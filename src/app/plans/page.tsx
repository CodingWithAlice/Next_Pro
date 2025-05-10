'use client';
import './app.css';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import TedPage from './ted/page';


export default function PlanPage() {
    const onChange = (key: string) => {
        console.log(key);
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
            children: 'Content of Tab Pane 3',
        },
    ];
    return <Tabs defaultActiveKey="1" centered items={items} onChange={onChange} />
    
}