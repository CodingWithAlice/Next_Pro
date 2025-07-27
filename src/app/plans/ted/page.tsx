'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api, { TedRecordDTO } from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, message, Tag } from 'antd';
import { CheckSquareTwoTone, CopyOutlined } from '@ant-design/icons';
import TedNewRecord from '@/components/ted-new-record';
import dayjs from 'dayjs';
import * as clipboard from "clipboard-polyfill";

const colors = ["magenta", "red", "volcano", "orange", "gold", "lime", "green", "cyan", "blue", "purple"];

interface TedDTO {
    id: number;
    title: string;
    times: number;
    ted_records?: TedRecordDTO[];
}

export default function TedPage() {
    const [messageApi, contextHolder] = message.useMessage();
    const [tedList, setTedList] = useState<TedDTO[]>([]);
    const [lastTedId, setLastTedId] = useState();

    // 复制功能
    const copy = async (text: string) => {
        clipboard.writeText(text).then(
            () => messageApi.success('复制成功'),
            () => messageApi.error('复制失败')
        );
    };

    // 复制按钮
    const genExtra = (id: number, text: string) => {
        return <>
            {id === lastTedId && <CheckSquareTwoTone />} &nbsp;
            <CopyOutlined onClick={(e) => { e.stopPropagation(); copy(`${id}、${text}`) }} /></>
    }

    // 展示历史感想和输入框
    const getChildren = (id: number, arr?: TedRecordDTO[]) => {
        return <>
            {
                arr && arr?.length > 0 && arr.map((it: TedRecordDTO, index: number) => (<div key={it.id} >
                    <Tag color={colors[index % 10]}>{dayjs(it.date).format('YYYY/MM/DD')}</Tag>
                    <div className='ted-record'>{it.record}</div>
                </div>))
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
                extra: genExtra(id, title)
            },
        ];
        return items
    }

    // 初始化查询接口
    const init = () => {
        Api.getTedList().then(({ tedList, recentTedRecord }) => {
            setTedList(tedList || []);
            setLastTedId(recentTedRecord?.tedId)
        });
    }

    useEffect(() => {
        init();
    }, [])

    return <div className='ted'>
        {contextHolder}
        {tedList.map(it => (<Collapse
            className='item'
            key={it.id}
            items={getItems(it)}
        />))}
    </div>
}