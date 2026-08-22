'use client';
import './app.css';
import { useEffect, useState } from 'react';
import Api, { TedRecordDTO } from '@/service/api';
import type { CollapseProps } from 'antd';
import { Collapse, message, Tag, Spin, FloatButton, Modal, Form, Input } from 'antd';
import { CheckSquareTwoTone, CopyOutlined, PlusOutlined } from '@ant-design/icons';
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
    const [loading, setLoading] = useState(true);
    const [tedList, setTedList] = useState<TedDTO[]>([]);
    const [lastTedId, setLastTedId] = useState();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

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

    // 获取并更新数据
    const fetchAndUpdateData = () => {
        return Api.getTedList().then(({ tedList, recentTedRecord }) => {
            setTedList(tedList || []);
            setLastTedId(recentTedRecord?.tedId);
        });
    }

    // 初始化查询接口（带loading）
    const init = () => {
        setLoading(true);
        fetchAndUpdateData().finally(() => {
            setLoading(false);
        });
    }

    // 静默刷新数据（不带loading）
    const refreshData = () => {
        fetchAndUpdateData();
    }

    const openAddModal = () => {
        form.resetFields();
        setAddModalOpen(true);
    }

    const handleAddCancel = () => {
        form.resetFields();
        setAddModalOpen(false);
    }

    const handleAddOk = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const res = await Api.postTedApi({ title: values.title.trim() });
            messageApi.success(res?.message || '添加成功');
            form.resetFields();
            setAddModalOpen(false);
            refreshData();
        } catch (error) {
            if (error && typeof error === 'object' && 'errorFields' in error) return;
            messageApi.error((error as Error)?.message || '添加失败');
        } finally {
            setSubmitting(false);
        }
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
            <TedNewRecord id={id} fresh={refreshData} />
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

    useEffect(() => {
        init();
    }, [])

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

    return <div className='ted'>
        {contextHolder}
        {tedList.map(it => (<Collapse
            className='item'
            key={it.id}
            items={getItems(it)}
        />))}
        <FloatButton
            icon={<PlusOutlined />}
            type="primary"
            tooltip="添加 TED"
            onClick={openAddModal}
        />
        <Modal
            title="添加 TED"
            open={addModalOpen}
            onOk={handleAddOk}
            onCancel={handleAddCancel}
            confirmLoading={submitting}
            destroyOnClose
            okText="添加"
            cancelText="取消"
        >
            <Form form={form} layout="vertical" preserve={false}>
                <Form.Item
                    name="title"
                    label="标题"
                    rules={[{ required: true, whitespace: true, message: '请输入 TED 标题' }]}
                >
                    <Input placeholder="输入 TED 标题" maxLength={200} allowClear />
                </Form.Item>
            </Form>
        </Modal>
    </div>
}