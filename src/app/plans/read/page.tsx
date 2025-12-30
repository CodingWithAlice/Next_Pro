'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, Tag, Typography, Spin, Button, Modal, FloatButton } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import BooksAdd from '@/components/books-add';

interface BooksDTO {
    id: number;
    title: string;
    record: string;
    recent: string;
    lastTime: string;
    blogUrl: string;
    tag: '电影' | '阅读' | '话剧';
}

const colorMap = {
    '电影': 'cyan',
    '阅读': 'gold',
    '话剧': 'magenta',
}

export default function ReadPage() {
    const [loading, setLoading] = useState(true);
    const [booksList, setBooksList] = useState<BooksDTO[]>([]);
    const [yearShareModalOpen, setYearShareModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());

    // 根据每道题生成折叠配置
    const getItems = (it: BooksDTO) => {
        const { id, title, record, recent, lastTime, blogUrl, tag } = it;
        const label = <div>
            <Tag color={colorMap[tag] || 'volcano'}>{tag}</Tag>
            {title}
            <Typography.Text type="secondary">
                {dayjs(recent).format('YYYY/MM/DD')}
                {lastTime && '、'}
                {lastTime && dayjs(lastTime).format('YYYY/MM/DD')}
            </Typography.Text>
        </div>;
        const items: CollapseProps['items'] = [
            {
                key: id,
                label,
                children: <div className='record'>
                    {blogUrl}
                    {blogUrl && <br />}
                    {record}
                </div>,
            },
        ];
        return items
    }

    // 初始化查询接口
    const init = () => {
        setLoading(true);
        Api.getReadApi().then(({ booksData }) => {
            const sortedData = booksData;
            sortedData.sort((a: BooksDTO, b: BooksDTO) => {
                const isBefore = dayjs(a.recent).isBefore(b.recent)
                return isBefore ? 1 : -1
            });            
            setBooksList(sortedData || []);
        }).finally(() => {
            setLoading(false);
        });
    }

    useEffect(() => {
        init();
    }, [])

    // 计算年度统计数据
    const getYearStatistics = () => {
        const yearStart = `${selectedYear}-01-01`;
        const yearEnd = `${selectedYear}-12-31`;
        
        const statistics: Record<string, { count: number; items: BooksDTO[] }> = {
            '电影': { count: 0, items: [] },
            '阅读': { count: 0, items: [] },
            '话剧': { count: 0, items: [] },
        };

        booksList.forEach(book => {
            const recentDate = book.recent;
            if (recentDate >= yearStart && recentDate <= yearEnd) {
                const tag = book.tag;
                if (statistics[tag]) {
                    statistics[tag].count++;
                    statistics[tag].items.push(book);
                }
            }
        });

        return statistics;
    };

    // 渲染年度分享弹窗
    const renderYearShareModal = () => {
        const statistics = getYearStatistics();
        const tagColors = ['cyan', 'gold', 'magenta', 'blue', 'green', 'orange', 'purple', 'red', 'volcano', 'geekblue'];

        return (
            <Modal
                title={`${selectedYear}年度记录`}
                open={yearShareModalOpen}
                onCancel={() => setYearShareModalOpen(false)}
                footer={[
                    <Button key="prev" onClick={() => setSelectedYear(selectedYear - 1)}>
                        上一年
                    </Button>,
                    <Button key="next" onClick={() => setSelectedYear(selectedYear + 1)}>
                        下一年
                    </Button>,
                    <Button key="close" type="primary" onClick={() => setYearShareModalOpen(false)}>
                        关闭
                    </Button>,
                ]}
                width={600}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {Object.entries(statistics).map(([tag, data]) => {
                        if (data.count === 0) return null;
                        
                        return (
                            <div key={tag}>
                                <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>
                                    <Tag color={colorMap[tag as keyof typeof colorMap]} style={{ fontSize: '14px', padding: '4px 12px' }}>
                                        {tag}
                                    </Tag>
                                    <span style={{ marginLeft: '8px' }}>共计 {data.count}{tag === '阅读' ? '本' : '部'}</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {data.items.map((item, index) => (
                                        <Tag
                                            key={item.id}
                                            color={tagColors[index % tagColors.length]}
                                            style={{ fontSize: '13px', padding: '4px 10px', margin: 0 }}
                                        >
                                            {item.title}
                                        </Tag>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal>
        );
    };

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px' 
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return <div className='read'>
        <BooksAdd fresh={init} />
        {booksList.map(it => (<Collapse
            className='item'
            key={it.id}
            items={getItems(it)}
        />))}
        <FloatButton
            icon={<ShareAltOutlined />}
            type="primary"
            tooltip="年度记录"
            onClick={() => setYearShareModalOpen(true)}
        />
        {renderYearShareModal()}
    </div>
}