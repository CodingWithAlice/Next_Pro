'use client';
import { useRef, useEffect, useState } from 'react';
import { Image } from 'antd';

interface RecordItemContentProps {
    imageUrl?: string;
    title: string;
    blogUrl?: string;
    record: string;
}

export default function RecordItemContent({ imageUrl, title, blogUrl, record }: RecordItemContentProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [imageMaxHeight, setImageMaxHeight] = useState(240);

    useEffect(() => {
        if (!textRef.current) return;

        // 计算文字内容的长度（字符数）
        const textContent = (blogUrl || '') + (record || '');
        const textLength = textContent.length;
        
        // 文字长度和对应图片高度的映射关系
        // 按顺序检查：文字少 → 文字中等 → 文字多
        const heightMap = [
            { maxLength: 200, height: 60 },  // 文字少（<200字）：图片高度较小（160px）
            { maxLength: 500, height: 100 },  // 文字中等（200-500字）：图片高度中等（240px）
            { maxLength: Infinity, height: 240 }  // 文字多（>500字）：图片高度较大（500px）
        ];
        
        // 遍历映射关系，找到匹配的高度
        let calculatedHeight = 240; // 默认高度
        for (const { maxLength, height } of heightMap) {
            if (textLength < maxLength) {
                calculatedHeight = height;
                break;
            }
        }

        // 也可以在桌面端增加一些高度
        if (window.innerWidth >= 769) {
            calculatedHeight = calculatedHeight + 50;
        }

        setImageMaxHeight(calculatedHeight);
    }, [blogUrl, record]);

    return (
        <div className='record-content-wrapper'>
            {imageUrl && (
                <div 
                    className='record-image-wrapper'
                    style={{ height: `${imageMaxHeight}px` }}
                >
                    <Image
                        src={imageUrl}
                        alt={title}
                        preview={{
                            mask: '预览'
                        }}
                    />
                </div>
            )}
            <div className='record-text-wrapper' ref={textRef}>
                {blogUrl}
                {blogUrl && <br />}
                {record}
            </div>
        </div>
    );
}

