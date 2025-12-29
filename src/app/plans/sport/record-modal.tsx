'use client';
import { useEffect } from 'react';
import { Modal, Input, InputNumber, Select, Form, DatePicker, AutoComplete } from 'antd';
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

// 表单字段类型
type FormFieldType = 'number' | 'text' | 'select' | 'autocomplete';

interface FormFieldConfig {
    name: string;
    label: string;
    type: FormFieldType;
    required?: boolean;
    placeholder?: string;
    options?: { value: string; label: string }[];
    step?: number;
    min?: number;
}

// 运动类型配置
const SPORT_TYPE_CONFIG: Record<SportType, {
    title: string;
    defaultCategory: string;
    fields: FormFieldConfig[];
}> = {
    running: {
        title: '跑步记录',
        defaultCategory: '匀速跑',
        fields: [
            {
                name: 'category',
                label: '跑步类型',
                type: 'select',
                required: true,
                placeholder: '选择跑步类型',
                options: [
                    { value: '匀速跑', label: '匀速跑' },
                    { value: '变速跑', label: '变速跑' },
                    { value: '长跑', label: '长跑' },
                ],
            },
            { name: 'value', label: '距离（km）', type: 'number', required: true, placeholder: '请输入跑步距离', step: 0.1, min: 0 },
            { name: 'duration', label: '运动时长（分钟）', type: 'number', placeholder: '选填', min: 0 },
            { name: 'notes', label: '备注', type: 'text', placeholder: '选填' },
        ],
    },
    resistance: {
        title: '抗阻记录',
        defaultCategory: '',
        fields: [
            { name: 'value', label: '重量（kg）', type: 'number', required: true, placeholder: '请输入重量', step: 0.1, min: 0 },
            { name: 'category', label: '运动分类', type: 'text', required: true, placeholder: '如：深蹲、卧推、硬拉等' },
            { name: 'duration', label: '运动时长（分钟）', type: 'number', placeholder: '选填', min: 0 },
            { name: 'notes', label: '备注', type: 'text', placeholder: '选填' },
        ],
    },
    hiking: {
        title: '徒步记录',
        defaultCategory: '徒步',
        fields: [
            { name: 'value', label: '距离（km）', type: 'number', required: true, placeholder: '请输入徒步距离', step: 0.1, min: 0 },
            { name: 'subInfo', label: '地点/路线', type: 'text', placeholder: '如：香山、奥森等' },
            { name: 'duration', label: '运动时长（分钟）', type: 'number', placeholder: '选填', min: 0 },
            { name: 'notes', label: '备注', type: 'text', placeholder: '选填' },
        ],
    },
    class: {
        title: '课程记录',
        defaultCategory: '',
        fields: [
            { name: 'value', label: '课程时长（分钟）', type: 'number', required: true, placeholder: '请输入课程时长', min: 0 },
            {
                name: 'category',
                label: '课程类型',
                type: 'autocomplete',
                required: true,
                placeholder: '选择或输入课程名称',
                options: [
                    { value: '踏板课', label: '踏板课' },
                    { value: '乒乓球', label: '乒乓球' },
                    { value: '瑜伽课', label: '瑜伽课' },
                    { value: '蹦床课', label: '蹦床课' },
                    { value: '杠铃课', label: '杠铃课' },
                    { value: '跳舞', label: '跳舞' },
                    { value: '舞力全开', label: '舞力全开' },
                    { value: '搏击课', label: '搏击课' },
                    { value: '尊巴', label: '尊巴' },
                    { value: '肚皮舞', label: '肚皮舞' },
                    { value: '舞蹈课', label: '舞蹈课' },
                    { value: '跳操', label: '跳操' },
                    { value: '有氧操', label: '有氧操' },
                    { value: '爬坡', label: '爬坡' },
                    { value: '爬楼', label: '爬楼' },
                    { value: '其他有氧', label: '其他有氧' },
                ],
            },
            { name: 'notes', label: '备注', type: 'text', placeholder: '选填' },
        ],
    },
};

export default function RecordModal({ open, type, date, onCancel, onSave }: RecordModalProps) {
    const [form] = Form.useForm();
    const config = SPORT_TYPE_CONFIG[type];

    // 当弹窗打开时，设置表单初始值（包括日期和默认分类）
    useEffect(() => {
        if (open) {
            const initialValues: any = {
                date: date || dayjs(),
            };
            // 如果是跑步类型，设置默认的跑步类型
            if (type === 'running' && config.defaultCategory) {
                initialValues.category = config.defaultCategory;
            }
            form.setFieldsValue(initialValues);
        }
    }, [open, date, form, type, config.defaultCategory]);

    // 渲染表单字段
    const renderFormField = (field: FormFieldConfig) => {
        const rules = field.required ? [{ required: true, message: `请输入${field.label}` }] : [];

        switch (field.type) {
            case 'number':
                return (
                    <Form.Item
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        rules={rules}
                    >
                        <InputNumber
                            min={field.min}
                            step={field.step}
                            style={{ width: '100%' }}
                            placeholder={field.placeholder}
                        />
                    </Form.Item>
                );
            case 'text':
                const isTextArea = field.name === 'notes';
                return (
                    <Form.Item
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        rules={rules}
                    >
                        {isTextArea ? (
                            <Input.TextArea
                                rows={3}
                                placeholder={field.placeholder}
                            />
                        ) : (
                            <Input placeholder={field.placeholder} />
                        )}
                    </Form.Item>
                );
            case 'select':
                return (
                    <Form.Item
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        rules={rules}
                    >
                        <Select
                            placeholder={field.placeholder}
                            options={field.options}
                        />
                    </Form.Item>
                );
            case 'autocomplete':
                return (
                    <Form.Item
                        key={field.name}
                        label={field.label}
                        name={field.name}
                        rules={rules}
                    >
                        <AutoComplete
                            placeholder={field.placeholder}
                            options={field.options}
                            allowClear
                            filterOption={(inputValue, option) =>
                                option?.value?.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                            }
                        />
                    </Form.Item>
                );
            default:
                return null;
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const recordData = {
                type,
                date: values.date ? values.date.format('YYYY-MM-DD') : (date ? date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')),
                value: values.value,
                category: values.category || config.defaultCategory,
                subInfo: values.subInfo || null,
                duration: values.duration || null,
                notes: values.notes || null,
            };
            onSave(recordData);
            form.resetFields();
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title={config.title}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="保存"
            cancelText="取消"
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="运动日期"
                    name="date"
                    rules={[{ required: true, message: '请选择运动日期' }]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        placeholder="请选择日期"
                    />
                </Form.Item>
                {config.fields.map(field => renderFormField(field))}
            </Form>
        </Modal>
    );
}

