'use client';
import { transTextArea, transTimeStringToType } from '@/components/tool';
import './app.css';
import { useState } from 'react';
import { Button } from 'antd';
import { AntDesignOutlined } from '@ant-design/icons';

export default function ReadPage() {
    const [readData, setReadData] = useState<{ title?: string, firstTime?: string, secondTime?: string, plans?: string }>({
        title: '《有效阅读》',
        firstTime: '2018-08-01',
        secondTime: '2025-01-01',
        plans: '【如何调整行动计划】长期计划，形成个人原则',
    });
    const [chapterData, setChapterData] = useState([
        {
            sort: '1',
            firstTimeTopic: '第一次阅读重点',
            secondTimeTopic: '第二次阅读重点',
            changes: '变化/聚焦差异',
        },
        {
            sort: '2',
            firstTimeTopic: '第一次阅读重点',
            secondTimeTopic: '第二次阅读重点',
            changes: '变化/聚焦差异',
        },
        {
            sort: '3',
            firstTimeTopic: '第一次阅读重点',
            secondTimeTopic: '第二次阅读重点',
            changes: '变化/聚焦差异',
        },
        {
            sort: '4',
            firstTimeTopic: '第一次阅读重点',
            secondTimeTopic: '第二次阅读重点',
            changes: '变化/聚焦差异',
        },
    ]);

    const handleChange = (v: { [key: string]: string }, options?: { type: 'chapterData', sort: string }) => {
        if (!options) {
            setReadData({ ...readData, ...v });
            return;
        }
        // 根据 options.sort 找到对应的章节数据，然后更新
        setChapterData(chapterData.map((it) => {
            if (+it.sort === parseInt(options.sort)) {
                return { ...it, ...v };
            }
            return it;
        }));
    }

    const handleTrans = (it: { key: string, desc?: string }, source?: { [key: string]: string }, options?: { type: 'chapterData', sort: string }) => {
        if (!source) return;
        return transTextArea({ ...it, source, onChange: (v) => handleChange(v, options) });
    }

    const handleSave = () => {
        console.log(readData, chapterData);
    }

    return <div className='read'>
        <nav className="layer">
            <ul className='li-wrap'>
                {[
                    { key: 'title', desc: '书名' },
                    { key: 'firstTime', desc: '首次阅读时间' },
                    { key: 'secondTime', desc: '重读时间' },
                ].map(it => handleTrans(it, readData))}
                {chapterData.map((chapter) => {
                    return <div key={chapter.sort}>
                        <p className='chapter-title'>Chapter{chapter.sort}：</p>
                        {[
                            { key: 'firstTimeTopic', desc: '第一次阅读重点' },
                            { key: 'secondTimeTopic', desc: '第二次阅读重点' },
                            { key: 'changes', desc: '变化/聚焦差异' },
                        ].map(it => handleTrans(it, chapter, {
                            type: 'chapterData',
                            sort: chapter.sort,
                        }))}
                    </div>
                })}
                <Button onClick={handleSave} icon={<AntDesignOutlined />}>
                    保存
                </Button>
            </ul>
        </nav>

        <section className="front layer">
            <h1 className='books'>{readData.title}</h1>
            <br />
            <h2>首次阅读{readData.firstTime && transTimeStringToType(readData.firstTime, '：YYYY年MM月')}<br />
                重读时间{readData.secondTime && transTimeStringToType(readData.secondTime, '：YYYY年MM月')}<br />
                行动计划：{readData.plans}
            </h2>
        </section>
    </div>
}