'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, Tag, Typography, Spin, Button, Modal, FloatButton, Switch } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import BooksAdd from '@/components/books-add';
import ShareImageButton from '@/components/share-image-button';

interface BooksDTO {
    id: number;
    title: string;
    record: string;
    recent: string;
    lastTime: string;
    blogUrl: string;
    tag: '电影' | '阅读' | '话剧' | string;
}

const colorMap = {
    '电影': 'cyan',
    '阅读': 'gold',
    '话剧': 'magenta',
    '综艺': 'orange',
    '电视剧': 'purple',
    '音乐剧': 'green'
}

// 每个类别对应的色系（同一色系的不同深浅颜色）
const categoryColorSchemes: Record<string, string[]> = {
    '电影': ['cyan', 'geekblue', 'blue'], // 蓝色系
    '阅读': ['gold', 'orange', 'volcano'], // 橙黄色系
    '话剧': ['magenta', 'purple', 'geekblue'], // 紫色系
    '综艺': ['orange', 'volcano', 'gold'], // 橙红色系
    '电视剧': ['purple', 'magenta', 'geekblue'], // 紫色系
    '音乐剧': ['green', 'lime', 'cyan'], // 绿色系
}

export default function ReadPage() {
    const [loading, setLoading] = useState(true);
    const [booksList, setBooksList] = useState<BooksDTO[]>([]);
    const [yearShareModalOpen, setYearShareModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
    const [showAllData, setShowAllData] = useState(false);
    // 每个类别的展开状态
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

    // 根据每道题生成折叠配置
    const getItems = (it: BooksDTO) => {
        const { id, title, record, recent, lastTime, blogUrl, tag } = it;
        const label = <div>
            <Tag color={colorMap[tag as keyof typeof colorMap] || 'volcano'}>{tag}</Tag>
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

    // 计算统计数据（支持年份模式和全部数据模式）
    const getYearStatistics = () => {
        const statistics: Record<string, { count: number; items: BooksDTO[] }> = {
            '电影': { count: 0, items: [] },
            '阅读': { count: 0, items: [] },
            '电视剧': { count: 0, items: [] },
            '音乐剧': { count: 0, items: [] },
            // '话剧': { count: 0, items: [] },
            // '综艺': { count: 0, items: [] },
        };

        booksList.forEach(book => {
            const recentDate = book.recent;
            let shouldInclude = false;
            
            if (showAllData) {
                // 全部数据模式：包含所有数据
                shouldInclude = true;
            } else {
                // 年份模式：只包含选中年份的数据
                const yearStart = `${selectedYear}-01-01`;
                const yearEnd = `${selectedYear}-12-31`;
                shouldInclude = recentDate >= yearStart && recentDate <= yearEnd;
            }
            
            if (shouldInclude) {
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
        const titleText = showAllData ? '全部记录' : `${selectedYear}年度记录`;
        const fileName = showAllData ? '全部记录' : `${selectedYear}年度记录`;

        return (
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: 'calc(100% - 24px)' }}>
                        <span>{titleText}</span>
                        <ShareImageButton
                            targetElement=".year-record-share-container"
                            fileName={fileName}
                            size="small"
                            type="link"
                            style={{ padding: 0 }}
                        />
                    </div>
                }
                open={yearShareModalOpen}
                onCancel={() => {
                    setYearShareModalOpen(false);
                    setShowAllData(false); // 关闭时重置为年份模式
                    setExpandedCategories({}); // 关闭时重置展开状态
                }}
                footer={[
                    <Button 
                        key="toggle" 
                        onClick={() => setShowAllData(!showAllData)}
                    >
                        {showAllData ? '切换到年份' : '查看全部'}
                    </Button>,
                    !showAllData && (
                        <Button key="prev" onClick={() => setSelectedYear(selectedYear - 1)}>
                            上一年
                        </Button>
                    ),
                    !showAllData && (
                        <Button key="next" onClick={() => setSelectedYear(selectedYear + 1)}>
                            下一年
                        </Button>
                    ),
                    <Button key="close" type="primary" onClick={() => {
                        setYearShareModalOpen(false);
                        setShowAllData(false); // 关闭时重置为年份模式
                        setExpandedCategories({}); // 关闭时重置展开状态
                    }}>
                        关闭
                    </Button>,
                ].filter(Boolean)}
                width={600}
            >
                <div className="year-record-share-container" style={{ padding: '20px', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>
                        {titleText}
                    </div>
                    <div className="year-record-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {Object.entries(statistics).map(([tag, data]) => {
                            if (data.count === 0) return null;
                            
                            // 获取当前类别对应的色系，如果没有则使用默认色系
                            const colorScheme = categoryColorSchemes[tag] || ['geekblue', 'blue', 'cyan'];
                            
                            // 判断是否需要展开功能（数据超过10条时显示开关）
                            const shouldShowSwitch = data.items.length > 10;
                            const isExpanded = expandedCategories[tag] || false;
                            const displayItems = shouldShowSwitch && !isExpanded 
                                ? data.items.slice(0, 10) 
                                : data.items;
                            
                            return (
                                <div key={tag}>
                                    <div style={{ 
                                        marginBottom: '12px', 
                                        fontSize: '16px', 
                                        fontWeight: 600,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <Tag color={colorMap[tag as keyof typeof colorMap] || 'geekblue'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                                                {tag}
                                            </Tag>
                                            <span style={{ marginLeft: '8px' }}>共计 {data.count}{tag === '阅读' ? '本' : '部'}</span>
                                        </div>
                                        {shouldShowSwitch && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <span>展开全部</span>
                                                <Switch
                                                    size="small"
                                                    checked={isExpanded}
                                                    onChange={(checked) => {
                                                        setExpandedCategories(prev => ({
                                                            ...prev,
                                                            [tag]: checked
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {displayItems.map((item, index) => (
                                            <Tag
                                                key={item.id}
                                                color={colorScheme[index % colorScheme.length]}
                                                style={{ fontSize: '13px', padding: '4px 10px', margin: 0 }}
                                            >
                                                {item.title}
                                            </Tag>
                                        ))}
                                        {shouldShowSwitch && !isExpanded && data.items.length > 10 && (
                                            <span style={{ fontSize: '13px', color: '#999', alignSelf: 'center' }}>
                                                ...还有 {data.items.length - 10} 项
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
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