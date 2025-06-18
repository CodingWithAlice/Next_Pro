'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

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
    const [booksList, setBooksList] = useState<BooksDTO[]>([]);

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
                children: <div>
                    {blogUrl}
                    {record}
                </div>,
            },
        ];
        return items
    }

    // 初始化查询接口
    const init = () => {
        Api.getReadApi().then(({ booksData }) => {
            const sortedData = booksData;
            sortedData.sort((a: BooksDTO, b: BooksDTO) => {
                const isBefore = dayjs(a.recent).isBefore(b.recent)
                return isBefore ? 1 : -1
            });            
            setBooksList(sortedData || []);
        });
    }

    useEffect(() => {
        init();
    }, [])

    return <div className='read'>
        {booksList.map(it => (<Collapse
            className='item'
            key={it.id}
            items={getItems(it)}
        />))}
    </div>
}