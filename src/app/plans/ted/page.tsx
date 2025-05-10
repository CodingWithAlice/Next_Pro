'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api, { TedRecordDTO } from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { TabTypes } from '../page';
import TedNewRecord from '@/components/ted-new-record';
import dayjs from 'dayjs';

interface TedDTO {
    id: number;
    title: string;
    times: number;
    ted_records?: TedRecordDTO[];
}



export default function TedPage({ tab }: { tab: TabTypes }) {
    const [messageApi, contextHolder] = message.useMessage();
    const [tedList, setTedList] = useState<TedDTO[]>([]);

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

    // 展示历史感想和输入框
    const getChildren = (id: number, arr?: TedRecordDTO[]) => {
        return <>
            {
                arr && arr?.length > 0 && arr.map((it: TedRecordDTO) => (<div key={it.id}>{dayjs(it.date).format('YYYYMMDD')} - {it.record}</div>))
            }
            <TedNewRecord id={id} fresh={init} />
        </>
    }

    // 根据每道题生成折叠配置
    const getItems = (it: TedDTO) => {
        const { title, ted_records, id } = it;
        const items: CollapseProps['items'] = [
            {
                key: id,
                label: `${id}、${title}`,
                children: getChildren(id, ted_records),
                extra: genExtra(title)
            },
        ];
        return items
    }

    // 初始化查询接口
    const init = () => {
        Api.getTedList().then(({ tedList }) => {
            setTedList(tedList || [])
        })
    }

    useEffect(() => {
        if (tab !== 'ted') { return }
        init();
    }, [tab])

    return <div className='ted'>
        {contextHolder}
        {tedList.map(it => (<Collapse
            className='item'
            key={it.id}
            items={getItems(it)}
        />))}
    </div>
}