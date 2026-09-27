'use client';
import { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

export type PlanSportType = 'running' | 'resistance';

export interface PlanItemInput {
    runType: string;
    distance?: number;
    target: number;
    targetHeartRate?: string | null;
}

export interface PlanFormValues {
    sportType: PlanSportType;
    planName: string;
    startDate: string;
    endDate?: string | null;
    items: PlanItemInput[];
}

interface PlanModalProps {
    open: boolean;
    sportType: PlanSportType;
    onCancel: () => void;
    onSave: (values: PlanFormValues) => void;
}

const RUN_TYPE_OPTIONS = [
    { value: '匀速跑', label: '匀速跑' },
    { value: '变速跑', label: '变速跑' },
    { value: '长跑', label: '长跑' },
];

export default function PlanModal({ open, sportType, onCancel, onSave }: PlanModalProps) {
    const [form] = Form.useForm();
    const isRunning = sportType === 'running';

    useEffect(() => {
        if (!open) return;
        form.resetFields();
        form.setFieldsValue({
            startDate: dayjs(),
            items: isRunning ? [{ runType: '匀速跑' }] : undefined,
        });
    }, [open, form, isRunning]);

    const handleOk = async () => {
        const values = await form.validateFields();
        const startDate = (values.startDate as Dayjs).format('YYYY-MM-DD');
        const endDate = values.endDate ? (values.endDate as Dayjs).format('YYYY-MM-DD') : null;
        const items: PlanItemInput[] = isRunning
            ? (values.items as PlanItemInput[]).map((item) => ({
                runType: item.runType,
                distance: Number(item.distance),
                target: Number(item.target),
                targetHeartRate: item.targetHeartRate?.trim() || null,
            }))
            : (['上肢', '下肢'] as const)
                .filter((part) => Number(values[part]) > 0)
                .map((part) => ({
                    runType: part,
                    target: Number(values[part]),
                }));
        if (!isRunning && items.length === 0) {
            form.setFields([
                { name: '上肢', errors: ['上肢和下肢至少填一个目标容量'] },
            ]);
            throw new Error('上肢和下肢至少填一个目标容量');
        }
        await onSave({
            sportType,
            planName: String(values.planName).trim(),
            startDate,
            endDate,
            items,
        });
    };

    return (
        <Modal
            title={isRunning ? '添加跑步计划' : '添加抗阻计划'}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            okText="保存"
            cancelText="取消"
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="计划名称"
                    name="planName"
                    rules={[{ required: true, message: '请输入计划名称' }]}
                >
                    <Input placeholder={isRunning ? '如：跑步计划4' : '如：2026Q4 力训'} maxLength={50} />
                </Form.Item>
                <Form.Item
                    label="开始日期"
                    name="startDate"
                    rules={[{ required: true, message: '请选择开始日期' }]}
                >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item label="结束日期" name="endDate">
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" placeholder="选填，不填则一直累计" />
                </Form.Item>
                {isRunning ? (
                    <Form.List
                        name="items"
                        rules={[
                            {
                                validator: async (_, items) => {
                                    if (!items || items.length < 1) {
                                        return Promise.reject(new Error('至少添加一项'));
                                    }
                                },
                            },
                        ]}
                    >
                        {(fields, { add, remove }, { errors }) => (
                            <>
                                {fields.map((field) => (
                                    <div key={field.key} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                        <Form.Item
                                            name={[field.name, 'runType']}
                                            rules={[{ required: true, message: '类型' }]}
                                            style={{ width: 110 }}
                                        >
                                            <Select options={RUN_TYPE_OPTIONS} />
                                        </Form.Item>
                                        <Form.Item
                                            name={[field.name, 'distance']}
                                            rules={[{ required: true, message: '距离' }]}
                                            style={{ width: 100 }}
                                        >
                                            <InputNumber min={0.1} max={999.99} step={0.5} placeholder="km" style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item
                                            name={[field.name, 'target']}
                                            rules={[{ required: true, message: '次数' }]}
                                            style={{ width: 100 }}
                                        >
                                            <InputNumber min={1} precision={0} placeholder="次数" style={{ width: '100%' }} />
                                        </Form.Item>
                                        <Form.Item name={[field.name, 'targetHeartRate']} style={{ flex: 1 }}>
                                            <Input placeholder="心率，选填" />
                                        </Form.Item>
                                        {fields.length > 1 && (
                                            <MinusCircleOutlined
                                                onClick={() => remove(field.name)}
                                                style={{ marginTop: 8 }}
                                            />
                                        )}
                                    </div>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add({ runType: '匀速跑' })} block icon={<PlusOutlined />}>
                                        添加一项
                                    </Button>
                                    <Form.ErrorList errors={errors} />
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                ) : (
                    <>
                        <Form.Item label="上肢目标（kg）" name="上肢">
                            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="这一季上肢容量" />
                        </Form.Item>
                        <Form.Item label="下肢目标（kg）" name="下肢">
                            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="这一季下肢容量" />
                        </Form.Item>
                    </>
                )}
            </Form>
        </Modal>
    );
}
