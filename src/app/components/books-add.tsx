import { useState } from 'react';
import { Card, Button, Input, DatePicker, Select, Space, Form, message, Tag } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
const { TextArea } = Input;
const { Option } = Select;
import Api from '@/service/api';
import dayjs from 'dayjs';

const colorMap = {
    '电影': 'blue',
    '话剧': 'purple',
    '综艺': 'orange',
    '电视剧': 'red',
    '音乐剧': 'green'
}
interface BooksDTO {
    title: string;
    record: string;
    recent: string;
    tag: keyof typeof colorMap;
}

export default function BooksAdd({ fresh }: { fresh: () => void }) {
    const [form] = Form.useForm();
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [booksData, setBooksData] = useState<BooksDTO>({
        tag: '电影',
        title: '',
        recent: dayjs().format('YYYY-MM-DD'),
        record: ''
    });
    const [messageApi, contextHolder] = message.useMessage();

    const handleChange = (newData: Partial<BooksDTO>) => {
        if (newData?.recent) {
            newData.recent = dayjs(newData.recent).format('YYYY-MM-DD');
        }
        setBooksData(({
            ...booksData,
            ...newData
        }));

    }

    const handleSave = async () => {
        Api.postReadApi({ ...booksData }).then((e) => {
            messageApi.success(e?.data?.message || e?.message);
            setEditing(false);
            fresh();
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }

    return <div className='books-add'>
        {contextHolder}
        <Card
            className='card'
            title={
                <Space>
                    {editing ? (
                        <Select
                            style={{ width: 120 }}
                            value={booksData.tag}
                            onChange={val => handleChange({ tag: val })}>
                            {Object.keys(colorMap).map(it => (<Option key={it} value={it}>{it}</Option>))}
                        </Select>
                    ) : (
                        <Tag color={colorMap[booksData.tag]}>{booksData.tag}</Tag>
                    )}

                    {editing ? (
                        <Input placeholder="作品名称" style={{ width: 200 }} value={booksData.title} onChange={e => handleChange({ title: e.target.value })} />
                    ) : (
                        <span>{booksData.title || '未命名作品'}</span>
                    )}
                </Space>
            }
            extra={
                <Space>
                    {!editing && (
                        <Button
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => setEditing(true)}
                        />
                    )}
                    {editing && (
                        <>
                            <Button
                                type="primary"
                                icon={<SaveOutlined />}
                                size="small"
                                onClick={handleSave}
                            />
                            <Button
                                icon={<CloseOutlined />}
                                size="small"
                                onClick={() => setEditing(false)}
                            />
                        </>
                    )}
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? '收起' : '展开'}
                    </Button>
                </Space>
            }
        >
            <Form form={form} initialValues={{
                ...booksData,
                recent: dayjs(booksData.recent)
            }} onValuesChange={handleChange} layout="vertical">
                {expanded && (
                    <>
                        <Form.Item
                            label="体验时间"
                            name="recent"
                            rules={[{ required: true, message: '请选择日期' }]}
                        >
                            {editing ? (
                                <DatePicker style={{ width: '100%' }} />
                            ) : (
                                <div>{dayjs(booksData.recent).format('YYYY/MM/DD')}</div>
                            )}
                        </Form.Item>

                        <Form.Item
                            label="体验感受"
                            name="record"
                            rules={[{ required: true, message: '请填写感受' }]}
                        >
                            {editing ? (
                                <TextArea rows={4} placeholder="详细记录您的观剧体验..." />
                            ) : (
                                <div style={{ whiteSpace: 'pre-line' }}>
                                    {booksData.record || '暂无记录'}
                                </div>
                            )}
                        </Form.Item>
                    </>
                )}
            </Form>
        </Card>

    </div>
}