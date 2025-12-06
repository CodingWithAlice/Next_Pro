'use client';
import { useState } from 'react';
import { Modal, Input, InputNumber, Select, Form } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

// 运动类型
type SportType = 'running' | 'resistance' | 'hiking' | 'class';

interface RecordModalProps {
    open: boolean;
    type: SportType;
    date?: Dayjs;
    onCancel: () => void;
    onSave: (values: any) => void;
}

export default function RecordModal({ open, type, date, onCancel, onSave }: RecordModalProps) {
    const [form] = Form.useForm();
    const [formValues, setFormValues] = useState<any>({});

    const getModalTitle = () => {
        const titles = {
            running: '跑步记录',
            resistance: '抗阻记录',
            hiking: '徒步记录',
            class: '课程记录'
        };
        return titles[type];
    };

    const renderForm = () => {
        switch (type) {
            case 'running':
                return (
                    <>
                        <Form.Item
                            label="距离（km）"
                            name="value"
                            rules={[{ required: true, message: '请输入距离' }]}
                        >
                            <InputNumber
                                min={0}
                                step={0.1}
                                style={{ width: '100%' }}
                                placeholder="请输入跑步距离"
                            />
                        </Form.Item>
                        <Form.Item
                            label="运动时长（分钟）"
                            name="duration"
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="选填"
                            />
                        </Form.Item>
                        <Form.Item
                            label="备注"
                            name="notes"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="选填"
                            />
                        </Form.Item>
                    </>
                );
            case 'resistance':
                return (
                    <>
                        <Form.Item
                            label="重量（kg）"
                            name="value"
                            rules={[{ required: true, message: '请输入重量' }]}
                        >
                            <InputNumber
                                min={0}
                                step={0.1}
                                style={{ width: '100%' }}
                                placeholder="请输入重量"
                            />
                        </Form.Item>
                        <Form.Item
                            label="运动分类"
                            name="category"
                            rules={[{ required: true, message: '请输入运动分类' }]}
                        >
                            <Input
                                placeholder="如：深蹲、卧推、硬拉等"
                            />
                        </Form.Item>
                        <Form.Item
                            label="运动时长（分钟）"
                            name="duration"
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="选填"
                            />
                        </Form.Item>
                        <Form.Item
                            label="备注"
                            name="notes"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="选填"
                            />
                        </Form.Item>
                    </>
                );
            case 'hiking':
                return (
                    <>
                        <Form.Item
                            label="距离（km）"
                            name="value"
                            rules={[{ required: true, message: '请输入距离' }]}
                        >
                            <InputNumber
                                min={0}
                                step={0.1}
                                style={{ width: '100%' }}
                                placeholder="请输入徒步距离"
                            />
                        </Form.Item>
                        <Form.Item
                            label="地点/路线"
                            name="subInfo"
                        >
                            <Input
                                placeholder="如：香山、奥森等"
                            />
                        </Form.Item>
                        <Form.Item
                            label="运动时长（分钟）"
                            name="duration"
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="选填"
                            />
                        </Form.Item>
                        <Form.Item
                            label="备注"
                            name="notes"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="选填"
                            />
                        </Form.Item>
                    </>
                );
            case 'class':
                return (
                    <>
                        <Form.Item
                            label="课程时长（分钟）"
                            name="value"
                            rules={[{ required: true, message: '请输入课程时长' }]}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="请输入课程时长"
                            />
                        </Form.Item>
                        <Form.Item
                            label="课程类型"
                            name="category"
                            rules={[{ required: true, message: '请选择课程类型' }]}
                        >
                            <Select
                                placeholder="选择课程"
                                options={[
                                    { value: '踏板课', label: '踏板课' },
                                    { value: '乒乓球', label: '乒乓球' },
                                    { value: '瑜伽课', label: '瑜伽课' },
                                    { value: '蹦床课', label: '蹦床课' },
                                    { value: '杠铃课', label: '杠铃课' },
                                    { value: 'switch舞力全开', label: 'switch舞力全开' },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            label="备注"
                            name="notes"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="选填"
                            />
                        </Form.Item>
                    </>
                );
            default:
                return null;
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            // 设置默认值
            const recordData = {
                type: type ?? 'class', // course 映射到 class
                date: date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                value: values.value,
                category: values.category || (type === 'running' ? '跑步' : type === 'hiking' ? '徒步' : ''),
                subInfo: values.subInfo || null,
                duration: values.duration || null,
                notes: values.notes || null,
            };
            onSave(recordData);
            form.resetFields();
            setFormValues({});
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setFormValues({});
        onCancel();
    };

    return (
        <Modal
            title={getModalTitle()}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="保存"
            cancelText="取消"
        >
            <Form form={form} layout="vertical">
                {renderForm()}
            </Form>
        </Modal>
    );
}

