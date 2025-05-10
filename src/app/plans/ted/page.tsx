'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

interface TedDTO {
    id: number;
    title: string;
    times: number;
    answer?: string;
}

export default function TedPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [tedList, setTedList] = useState<TedDTO[]>([]);

    const onChange = (key: string | string[]) => {
        console.log(key);
    };

    // 复制功能
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            messageApi.success('复制成功');
        } catch {
            messageApi.error('复制失败');
        }
    };

    // 复制按钮
    const genExtra = (text: string) => {
        return <CopyOutlined onClick={(e) => { e.stopPropagation(); copy(text) }} />
    }

    // 根据每道题生成折叠配置
    const getItems = (it: TedDTO) => {
        const { title, answer, id } = it;
        const items: CollapseProps['items'] = [
            {
                key: `title${id}`,
                label: `${id}、${title}`,
                children: answer,
                extra: genExtra(title)
            },
        ];
        return items
    }

    useEffect(() => {
        Api.getTedList().then(({ tedList }) => {
            setTedList(tedList || [])
        })
    }, [])

    return <div className='ted'>
        {contextHolder}
        {tedList.map(it => (<Collapse
            className='item'
            key={it.id}
            onChange={onChange}
            items={getItems(it)}
        />))}
    </div>
}