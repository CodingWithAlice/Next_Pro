'use client';
import './app.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import Api from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, Tag, Typography, Spin, Button, Modal, FloatButton, Switch, Image } from 'antd';
import { ShareAltOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import BooksAdd from '@/components/books-add';
import ShareImageButton from '@/components/share-image-button';
import BookEditModal from '@/components/book-edit-modal';
import RecordItemContent from '@/components/record-item-content';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const PAGE_SIZE = 20;

interface BooksDTO {
    id: number;
    title: string;
    record: string;
    recent: string;
    lastTime: string;
    blogUrl: string;
    tag: '电影' | '阅读' | '话剧' | string;
    imageUrl?: string;
}

const colorMap = {
    '电影': 'cyan',
    '阅读': 'gold',
    '话剧': 'magenta',
    '综艺': 'orange',
    '电视剧': 'purple',
    '音乐剧': 'green',
    '广播剧': 'blue'
}

// 每个类别对应的色系（同一色系的不同深浅颜色）
const categoryColorSchemes: Record<string, string[]> = {
    '电影': ['cyan', 'geekblue', 'blue'], // 蓝色系
    '阅读': ['gold', 'orange', 'volcano'], // 橙黄色系
    '话剧': ['magenta', 'purple', 'geekblue'], // 紫色系
    '综艺': ['orange', 'volcano', 'gold'], // 橙红色系
    '电视剧': ['purple', 'magenta', 'geekblue'], // 紫色系
    '音乐剧': ['green', 'lime', 'cyan'], // 绿色系
    '广播剧': ['blue', 'geekblue', 'cyan'], // 蓝色系
}

export default function ReadPage() {
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [booksList, setBooksList] = useState<BooksDTO[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [yearShareModalOpen, setYearShareModalOpen] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(dayjs().year());
    const [showAllData, setShowAllData] = useState(false);
    // 每个类别的展开状态
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
    // 编辑模态框状态
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<BooksDTO | null>(null);
    // 年度分享用全量数据（按需加载，不阻塞主列表）
    const [shareBooksList, setShareBooksList] = useState<BooksDTO[]>([]);
    const [shareLoading, setShareLoading] = useState(false);

    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const loadingMoreRef = useRef(false);
    const hasMoreRef = useRef(true);
    const pageRef = useRef(1);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // 处理编辑
    const handleEdit = (record: BooksDTO, e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止Collapse展开/收起
        setEditingRecord(record);
        setEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setEditModalOpen(false);
        setEditingRecord(null);
        refreshData(); // 静默刷新列表
    };

    const handleEditCancel = () => {
        setEditModalOpen(false);
        setEditingRecord(null);
    };

    // 根据每道题生成折叠配置
    const getItems = (it: BooksDTO) => {
        const { id, title, record, recent, lastTime, blogUrl, tag, imageUrl } = it;
        const label = <div className="collapse-label-wrapper">
            {imageUrl && (
                <Image
                    src={imageUrl}
                    alt={title}
                    width={40}
                    height={60}
                    className="collapse-label-image"
                    preview={false}
                    loading="lazy"
                />
            )}
            <div className="collapse-label-content">
                <Tag color={colorMap[tag as keyof typeof colorMap] || 'volcano'} className="collapse-label-tag">{tag}</Tag>
                <span className="book-title">{title}</span>
                <Typography.Text type="secondary" className="collapse-label-date">
                    {dayjs(recent).format('YYYY/MM')}
                    {lastTime && '、'}
                    {lastTime && dayjs(lastTime).format('YYYY/MM')}
                </Typography.Text>
            </div>
        </div>;
        
        const extra = (
            <EditOutlined 
                onClick={(e) => handleEdit(it, e)} 
                className="collapse-extra-icon"
            />
        );

        const items: CollapseProps['items'] = [
            {
                key: id,
                label,
                extra,
                children: <div className='record'>
                    <RecordItemContent
                        imageUrl={imageUrl}
                        title={title}
                        blogUrl={blogUrl}
                        record={record}
                    />
                </div>,
            },
        ];
        return items
    }

    const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
        const res = await Api.getReadApi({ page: pageNum, pageSize: PAGE_SIZE });
        const nextList: BooksDTO[] = res.booksData || [];
        setBooksList((prev) => (replace ? nextList : [...prev, ...nextList]));
        setPage(pageNum);
        setHasMore(Boolean(res.hasMore));
        return res;
    }, []);

    // 初始化查询接口（带loading）
    const init = useCallback(() => {
        setLoading(true);
        setHasMore(true);
        loadingMoreRef.current = false;
        fetchPage(1, true)
            .catch(() => {
                setBooksList([]);
                setHasMore(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [fetchPage]);

    // 静默刷新数据（不带loading）：重置到第一页
    const refreshData = useCallback(() => {
        setHasMore(true);
        loadingMoreRef.current = false;
        fetchPage(1, true).catch(() => {
            setBooksList([]);
            setHasMore(false);
        });
    }, [fetchPage]);

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !hasMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
        try {
            await fetchPage(pageRef.current + 1, false);
        } catch {
            // 保持当前列表，允许再次触发加载
        } finally {
            loadingMoreRef.current = false;
            setLoadingMore(false);
        }
    }, [fetchPage]);

    useEffect(() => {
        init();
    }, [init]);

    // 滚动触底加载下一页
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    loadMore();
                }
            },
            { root: null, rootMargin: '200px', threshold: 0 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [loading, loadMore]);

    // 打开年度分享时再拉全量（主列表保持分页）
    const openYearShareModal = async () => {
        setYearShareModalOpen(true);
        setShareLoading(true);
        try {
            const { booksData } = await Api.getReadApi();
            const sortedData: BooksDTO[] = [...(booksData || [])];
            sortedData.sort((a, b) => (dayjs(a.recent).isBefore(b.recent) ? 1 : -1));
            setShareBooksList(sortedData);
        } catch {
            setShareBooksList([]);
        } finally {
            setShareLoading(false);
        }
    };

    // 计算统计数据（支持年份模式和全部数据模式）
    const getYearStatistics = () => {
        const statistics: Record<string, { count: number; items: BooksDTO[] }> = {
            '电影': { count: 0, items: [] },
            '阅读': { count: 0, items: [] },
            '电视剧': { count: 0, items: [] },
            '音乐剧': { count: 0, items: [] },
            '广播剧': { count: 0, items: [] },
            // '话剧': { count: 0, items: [] },
            // '综艺': { count: 0, items: [] },
        };

        shareBooksList.forEach(book => {
            const recentDate = book.recent;
            let shouldInclude = false;
            
            if (showAllData) {
                // 全部数据模式：包含所有数据
                shouldInclude = true;
            } else {
                // 年份模式：只包含选中年份的数据
                const recentDateObj = dayjs(recentDate);
                const yearStart = dayjs(`${selectedYear}-01-01`);
                const yearEnd = dayjs(`${selectedYear}-12-31`);
                shouldInclude = recentDateObj.isSameOrAfter(yearStart, 'day') && recentDateObj.isSameOrBefore(yearEnd, 'day');
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
                    <div className="modal-title-wrapper">
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
                {shareLoading ? (
                    <div className="share-loading-container">
                        <Spin />
                    </div>
                ) : (
                <div className="year-record-share-container">
                    <div className="year-record-title">
                        {titleText}
                    </div>
                    <div className="year-record-content">
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
                                    <div className="year-record-category-header">
                                        <div>
                                            <Tag color={colorMap[tag as keyof typeof colorMap] || 'geekblue'} className="year-record-category-tag">
                                                {tag}
                                            </Tag>
                                            <span className="year-record-category-count">共计 {data.count}{tag === '阅读' ? '本' : '部'}</span>
                                        </div>
                                        {shouldShowSwitch && (
                                            <div className="year-record-switch-container">
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
                                    <div className="year-record-items-container">
                                        {displayItems.map((item, index) => (
                                            <div key={item.id} className="year-record-item-wrapper">
                                                {item.imageUrl && (
                                                    <Image
                                                        src={item.imageUrl}
                                                        alt={item.title}
                                                        width={16}
                                                        height={24}
                                                        className="year-record-item-image"
                                                        preview={false}
                                                        loading="lazy"
                                                    />
                                                )}
                                                <Tag
                                                    color={colorScheme[index % colorScheme.length]}
                                                    className="year-record-item-tag"
                                                >
                                                    {item.title}
                                                </Tag>
                                            </div>
                                        ))}
                                        {shouldShowSwitch && !isExpanded && data.items.length > 10 && (
                                            <span className="year-record-more-items">
                                                ...还有 {data.items.length - 10} 项
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                )}
            </Modal>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Spin size="large" />
            </div>
        );
    }

    return <div className='read'>
        <BooksAdd fresh={refreshData} />
        {booksList.map(it => (<Collapse
            className='item'
            key={it.id}
            items={getItems(it)}
            destroyInactivePanel
        />))}
        <div ref={sentinelRef} className="list-sentinel">
            {loadingMore && <Spin size="small" />}
            {!hasMore && booksList.length > 0 && (
                <span className="list-end-tip">已经到底啦</span>
            )}
        </div>
        <FloatButton
            icon={<ShareAltOutlined />}
            type="primary"
            tooltip="年度记录"
            onClick={openYearShareModal}
        />
        {renderYearShareModal()}
        <BookEditModal
            open={editModalOpen}
            record={editingRecord}
            onCancel={handleEditCancel}
            onSuccess={handleEditSuccess}
        />
    </div>
}
