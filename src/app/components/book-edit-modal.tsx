'use client';
import { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import Api from '@/service/api';
import BookImageInput from './book-image-input';

const { TextArea } = Input;
const { Option } = Select;

const colorMap = {
    '电影': 'cyan',
    '阅读': 'gold',
    '话剧': 'magenta',
    '综艺': 'orange',
    '电视剧': 'purple',
    '音乐剧': 'green'
}

interface BooksDTO {
    id: number;
    title: string;
    record: string;
    recent: string;
    lastTime?: string;
    tag: '电影' | '阅读' | '话剧' | string;
    imageUrl?: string;
    blogUrl?: string;
}

interface BookEditModalProps {
    open: boolean;
    record: BooksDTO | null;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function BookEditModal({ open, record, onCancel, onSuccess }: BookEditModalProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        if (open && record) {
            form.setFieldsValue({
                title: record.title,
                tag: record.tag,
                recent: record.recent ? dayjs(record.recent) : dayjs(),
                record: record.record,
                imageUrl: record.imageUrl,
                blogUrl: record.blogUrl,
            });
        }
    }, [open, record, form]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            
            const updateData = {
                id: record!.id,
                title: values.title,
                tag: values.tag,
                recent: values.recent.format('YYYY-MM-DD'),
                record: values.record,
                imageUrl: values.imageUrl || null,
                blogUrl: values.blogUrl || null,
            };

            await Api.updateReadApi(updateData);
            messageApi.success('更新成功');
            form.resetFields();
            onSuccess();
        } catch (error: any) {
            if (error.errorFields) {
                // 表单验证错误
                return;
            }
            messageApi.error(error.message || '更新失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <>
            {contextHolder}
            <Modal
                title="编辑记录"
                open={open}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading || imageUploading}
                okText="保存"
                cancelText="取消"
                width={600}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="类型"
                        name="tag"
                        rules={[{ required: true, message: '请选择类型' }]}
                    >
                        <Select>
                            {Object.keys(colorMap).map(it => (
                                <Option key={it} value={it}>{it}</Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="作品名称"
                        name="title"
                        rules={[{ required: true, message: '请输入作品名称' }]}
                    >
                        <Input placeholder="请输入作品名称" />
                    </Form.Item>

                    <Form.Item
                        label="体验时间"
                        name="recent"
                        rules={[{ required: true, message: '请选择日期' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="体验感受"
                        name="record"
                        rules={[{ required: true, message: '请填写感受' }]}
                    >
                        <TextArea rows={4} placeholder="详细记录您的观剧体验..." />
                    </Form.Item>

                    <Form.Item
                        label="博客链接"
                        name="blogUrl"
                    >
                        <Input placeholder="选填" />
                    </Form.Item>

                    <Form.Item
                        label="图片"
                        name="imageUrl"
                    >
                        <BookImageInput
                            title={form.getFieldValue('title')}
                            value={form.getFieldValue('imageUrl')}
                            onChange={(url) => form.setFieldValue('imageUrl', url)}
                            onUploadingChange={setImageUploading}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}

