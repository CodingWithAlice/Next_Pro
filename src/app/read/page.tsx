'use client';
import { transTextArea, transTimeStringToType } from '@/components/tool';
import './app.css';
import { useEffect, useState } from 'react';
import { Button, message, Space } from 'antd';
import { AntDesignOutlined } from '@ant-design/icons';
import Api from '@/service/api';

interface ChapterProps {
    sort: number;
    firstTimeTopic: string;
    secondTimeTopic: string;
    changes: string;
}

export default function ReadPage() {
    const [readData, setReadData] = useState<{ [key: string]: string | number }>({});
    const [chapterData, setChapterData] = useState<{ [key: string]: string | number }[]>([]);
    const [messageApi, contextHolder] = message.useMessage();

    const handleChange = (v: { [key: string]: string }, options?: { type: 'chapterData', sort: number | string }) => {
        if (!options) {
            setReadData({ ...readData, ...v });
            return;
        }
        // 根据 options.sort 找到对应的章节数据，然后更新
        setChapterData(chapterData.map((it) => {
            if (+it.sort === +options.sort) {
                return { ...it, ...v };
            }
            return it;
        }));
    }

    const handleTrans = (it: { key: string, desc?: string }, source?: { [key: string]: string | number }, options?: { type: 'chapterData', sort: string | number }) => {
        if (!source) return;
        return transTextArea({ ...it, source, onChange: (v) => handleChange(v, options), cols: 56 });
    }

    const handleAddTopic = () => {
        setChapterData([...chapterData, {
            sort: chapterData.length + 1,
            firstTimeTopic: '',
            secondTimeTopic: '',
            changes: '',
            chapterId: readData.id,
        }]);
    }

    const handleSave = () => {
        Api.postReadApi({ readData, chapterData }).then(e => {
            messageApi.success(e.data.message);
        });
    }

    useEffect(() => {
        Api.getReadApi().then(({ booksData }) => {
            setReadData(booksData);
            setChapterData(booksData.books_topic_records.sort((a: ChapterProps, b: ChapterProps) => a.sort - b.sort));
        })
    }, []);

    return <div className='read'>
        {contextHolder}
        <nav className="layer">
            <ul className='li-wrap'>
                {[
                    { key: 'title', desc: '书名' },
                    { key: 'firstTime', desc: '首次阅读时间' },
                    { key: 'secondTime', desc: '重读时间' },
                    { key: 'plans', desc: '行动计划' },
                    { key: 'blogUrl', desc: '博客链接' },
                ].map(it => handleTrans(it, readData))}
                {chapterData.map((chapter) => {
                    return <div key={chapter.sort}>
                        <p className='chapter-title'>Chapter{chapter.sort} 【聚焦差异】：</p>
                        {[
                            { key: 'firstTimeTopic', desc: '第一次阅读 核心观点' },
                            { key: 'secondTimeTopic', desc: '第二次阅读 核心观点' },
                            { key: 'changes', desc: '新感悟' },
                        ].map(it => handleTrans(it, chapter, {
                            type: 'chapterData',
                            sort: chapter.sort,
                        }))}
                    </div>
                })}
                <Space className='btn-group'>
                    <Button onClick={handleAddTopic}>添加一项</Button>
                    <Button onClick={handleSave} type='primary' icon={<AntDesignOutlined />}>
                        保存
                    </Button>
                </Space>
            </ul>
        </nav>

        <section className="front layer">
            <h1 className='books'>{readData.title}</h1>
            <h2>首次阅读{readData.firstTime && transTimeStringToType(readData.firstTime, '：YYYY年MM月')}<br />
                重读时间{readData.secondTime && transTimeStringToType(readData.secondTime, '：YYYY年MM月')}<br />
                行动计划：<div className='plans-text'>{readData.plans}</div>
            </h2>
        </section>
    </div>
}