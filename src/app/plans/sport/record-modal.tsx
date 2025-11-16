'use client';
import { useState } from 'react';
import { Modal, Input, InputNumber, Select } from 'antd';

// 运动类型
type SportType = 'running' | 'resistance' | 'hiking' | 'course';

interface RecordModalProps {
    open: boolean;
    type: SportType;
    onCancel: () => void;
    onSave: (values: any) => void;
}

export default function RecordModal({ open, type, onCancel, onSave }: RecordModalProps) {
    const [formValues, setFormValues] = useState<any>({});

    const getModalTitle = () => {
        const titles = {
            running: '跑步记录',
            resistance: '抗阻记录',
            hiking: '徒步记录',
            course: '课程记录'
        };
        return titles[type];
    };

    const renderForm = () => {
        switch (type) {
            case 'running':
                return (
                    <div className="form-item">
                        <label>距离（km）：</label>
                        <InputNumber
                            min={0}
                            step={0.1}
                            value={formValues.distance}
                            onChange={(value) => setFormValues({ ...formValues, distance: value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                );
            case 'resistance':
                return (
                    <div className="form-item">
                        <label>次数：</label>
                        <InputNumber
                            min={0}
                            value={formValues.times}
                            onChange={(value) => setFormValues({ ...formValues, times: value })}
                            style={{ width: '100%' }}
                        />
                    </div>
                );
            case 'hiking':
                return (
                    <div className="form-item">
                        <label>地点/路线：</label>
                        <Input
                            value={formValues.location}
                            onChange={(e) => setFormValues({ ...formValues, location: e.target.value })}
                            placeholder="如：香山"
                        />
                    </div>
                );
            case 'course':
                return (
                    <div className="form-item">
                        <label>课程类型：</label>
                        <Select
                            value={formValues.courseName}
                            onChange={(value) => setFormValues({ ...formValues, courseName: value })}
                            placeholder="选择课程"
                            style={{ width: '100%' }}
                            options={[
                                { value: '踏板课', label: '踏板课' },
                                { value: '乒乓球', label: '乒乓球' },
                                { value: '瑜伽课', label: '瑜伽课' },
                                { value: '蹦床课', label: '蹦床课' },
                                { value: '杠铃课', label: '杠铃课' },
                                { value: 'switch舞力全开', label: 'switch舞力全开' },
                            ]}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const handleOk = () => {
        if (!formValues.distance && !formValues.times && !formValues.location && !formValues.courseName) {
            return;
        }
        onSave(formValues);
        setFormValues({}); // 重置表单
    };

    return (
        <Modal
            title={getModalTitle()}
            open={open}
            onOk={handleOk}
            onCancel={() => {
                setFormValues({});
                onCancel();
            }}
            okText="保存"
            cancelText="取消"
        >
            {renderForm()}
        </Modal>
    );
}

