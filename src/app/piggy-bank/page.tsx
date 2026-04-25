'use client';

import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { CloseCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import Api from '@/service/api';
import PiggyJarImageInput from '@/components/piggy-jar-image-input';
import './app.css';

interface Jar {
  id: number;
  name: string;
  balance: string | number;
  monthlyRepayment?: string | number | null;
  targetAmount?: string | number | null;
  status: string;
  imageUrls?: string | string[] | null;
}

interface AllocationItem {
  jarId: number;
  jarName: string;
  amount: number;
  proportion: number;
  monthlyRepayment?: number;
}

// config.env 的 NEXT_PUBLIC_PIGGY_BANK_ALLOCATE_MAX_RATIO，不存在时默认 35%
const PIGGY_ALLOCATE_MAX_RATIO = Math.min(1, Math.max(0, parseFloat(process.env.NEXT_PUBLIC_PIGGY_BANK_ALLOCATE_MAX_RATIO ?? '0.35') || 0.35));
const PIGGY_ALLOCATE_MAX_PCT = Math.round(PIGGY_ALLOCATE_MAX_RATIO * 100);

function formatAllocatePctDisplay(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export default function PiggyBankPage() {
  const [jars, setJars] = useState<Jar[]>([]);
  const [poolBalance, setPoolBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [jarForm] = Form.useForm();
  const [allocateForm] = Form.useForm();
  const [poolAllocateForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const [jarModalOpen, setJarModalOpen] = useState(false);
  const [allocateModalOpen, setAllocateModalOpen] = useState(false);
  const [poolAllocateModalOpen, setPoolAllocateModalOpen] = useState(false);
  const [suggestedAllocations, setSuggestedAllocations] = useState<AllocationItem[]>([]);
  const [salaryInput, setSalaryInput] = useState(0);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [recordsModalOpen, setRecordsModalOpen] = useState(false);
  const [allocateRecords, setAllocateRecords] = useState<
    { id: number; amount: string | number; remark?: string | null; createdAt?: string; created_at?: string }[]
  >([]);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);
  const [abandonJarId, setAbandonJarId] = useState<number | null>(null);
  const [actualConsumptionModalOpen, setActualConsumptionModalOpen] = useState(false);
  const [actualConsumptionJar, setActualConsumptionJar] = useState<Jar | null>(null);
  const [actualConsumptionForm] = Form.useForm();

  const [jarImageModalOpen, setJarImageModalOpen] = useState(false);
  const [jarImageEditing, setJarImageEditing] = useState<Jar | null>(null);
  const [jarImageUploading, setJarImageUploading] = useState(false);

  const normalizeImageUrls = (raw: Jar['imageUrls']): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    const s = String(raw).trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return [];
    }
  };

  const loadData = () => {
    setLoading(true);
    Api.getPiggyBankApi()
      .then((res: { jars?: Jar[]; poolBalance?: number }) => {
        setJars(res.jars || []);
        setPoolBalance(res.poolBalance ?? 0);
      })
      .catch((e: { message?: string }) => {
        messageApi.error(e.message || '加载失败');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (jarImageModalOpen) return;
    if (!jarImageUploading) return;
    setJarImageUploading(false);
  }, [jarImageModalOpen, jarImageUploading]);

  const activeJars = jars.filter((j) => j.status === 'active');
  const displayJars = jars.filter((j) => j.status !== 'abandoned'); // 展示中 + 已满额关闭的罐子

  const sortedDisplayJars = [...displayJars].sort((a, b) => {
    const ac = a.status === 'completed' ? 1 : 0;
    const bc = b.status === 'completed' ? 1 : 0;
    if (ac !== bc) return ac - bc;
    return a.id - b.id;
  });

  const onAddJar = (values: {
    name: string;
    monthlyRepayment?: number;
    targetAmount?: number;
    mode?: string;
    monthlyRepaymentAmount?: number;
    planMonths?: number;
    totalAdvance?: number;
  }) => {
    const data: Record<string, unknown> = { name: values.name };
    if (values.mode === 'advance') {
      if (values.monthlyRepaymentAmount != null) {
        data.monthlyRepaymentAmount = values.monthlyRepaymentAmount;
      } else if (values.planMonths && values.totalAdvance) {
        data.planMonths = values.planMonths;
        data.totalAdvance = values.totalAdvance;
      }
    } else {
      if (values.monthlyRepayment != null) data.monthlyRepayment = values.monthlyRepayment;
      if (values.targetAmount != null) data.targetAmount = values.targetAmount;
    }
    Api.postPiggyBankJarApi(data as Parameters<typeof Api.postPiggyBankJarApi>[0])
      .then(() => {
        messageApi.success('添加成功');
        jarForm.resetFields();
        setJarModalOpen(false);
        loadData();
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '添加失败'));
  };

  const onAbandon = (id: number) => {
    setAbandonJarId(id);
    setAbandonModalOpen(true);
  };

  const onConfirmAbandon = () => {
    if (abandonJarId == null) return;
    Api.abandonPiggyBankJarApi(abandonJarId)
      .then(() => {
        messageApi.success('已放弃');
        setAbandonModalOpen(false);
        setAbandonJarId(null);
        loadData();
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '操作失败'));
  };

  const onOpenActualConsumption = (jar: Jar) => {
    setActualConsumptionJar(jar);
    const targetRaw = jar.targetAmount != null ? parseFloat(String(jar.targetAmount)) : 0;
    const monthly = jar.monthlyRepayment != null ? parseFloat(String(jar.monthlyRepayment)) : 0;
    const target = targetRaw > 0 ? targetRaw : monthly > 0 ? monthly * 12 : 0;
    actualConsumptionForm.setFieldsValue({ actualConsumption: target > 0 ? target : undefined });
    setActualConsumptionModalOpen(true);
  };

  const onConfirmActualConsumption = () => {
    if (!actualConsumptionJar) return;
    actualConsumptionForm.validateFields().then((values: { actualConsumption: number }) => {
      Api.putPiggyBankJarApi(actualConsumptionJar.id, { actualConsumption: values.actualConsumption })
        .then(() => {
          messageApi.success('已按真实消费调整');
          setActualConsumptionModalOpen(false);
          setActualConsumptionJar(null);
          actualConsumptionForm.resetFields();
          loadData();
        })
        .catch((e: { message?: string }) => messageApi.error(e.message || '调整失败'));
    });
  };

  const onGetSuggestion = () => {
    const amount = allocateForm.getFieldValue('amount');
    if (!amount || amount <= 0) {
      messageApi.warning('请输入金额');
      return;
    }
    setSalaryInput(amount);
    setSuggestionLoading(true);
    Api.getPiggyBankAllocateSuggestionApi(amount)
      .then((res: { suggestion?: AllocationItem[]; message?: string }) => {
        if (res.suggestion?.length) {
          setSuggestedAllocations(res.suggestion);
          setAllocateModalOpen(true);
        } else {
          messageApi.info(res.message || '暂无建议');
        }
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '获取失败'))
      .finally(() => setSuggestionLoading(false));
  };

  const onConfirmAllocate = () => {
    const totalAmount = suggestedAllocations.reduce((s, a) => s + a.amount, 0);
    if (totalAmount > salaryInput * PIGGY_ALLOCATE_MAX_RATIO) {
      messageApi.warning(`金额超过了薪资的 ${PIGGY_ALLOCATE_MAX_PCT}%`);
      return Promise.reject();
    }
    const allocations = suggestedAllocations.map((a) => ({ jarId: a.jarId, amount: a.amount }));
    const remark = allocateForm.getFieldValue('remark');
    return Api.confirmPiggyBankAllocateApi(salaryInput, allocations, remark)
      .then(() => {
        messageApi.success('分配成功');
        setAllocateModalOpen(false);
        allocateForm.resetFields();
        loadData();
      })
      .catch((e: { message?: string }) => {
        messageApi.error(e.message || '分配失败');
        throw e;
      });
  };

  const onUpdateAllocation = (index: number, field: 'amount' | 'proportion', value: number) => {
    const next = [...suggestedAllocations];
    if (field === 'amount') {
      next[index] = { ...next[index], amount: value, proportion: salaryInput > 0 ? (value / salaryInput) * 100 : 0 };
    } else {
      next[index] = { ...next[index], proportion: value, amount: (salaryInput * value) / 100 };
    }
    setSuggestedAllocations(next);
  };

  const onToPool = () => {
    const amount = allocateForm.getFieldValue('amount');
    if (!amount || amount <= 0) {
      messageApi.warning('请输入金额');
      return;
    }
    const remark = allocateForm.getFieldValue('remark');
    Api.putPiggyBankToPoolApi(amount, remark)
      .then(() => {
        messageApi.success('已放入待分配池');
        allocateForm.resetFields();
        loadData();
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '操作失败'));
  };

  const onPoolAllocate = (values: Record<string, number>) => {
    const allocations = activeJars
      .filter((j) => values[`jar_${j.id}`] != null && values[`jar_${j.id}`] > 0)
      .map((j) => ({ jarId: j.id, amount: values[`jar_${j.id}`] }));
    if (allocations.length === 0) {
      messageApi.warning('请至少分配一个罐子');
      return;
    }
    Api.allocateFromPoolApi(allocations)
      .then(() => {
        messageApi.success('分配成功');
        poolAllocateForm.resetFields();
        setPoolAllocateModalOpen(false);
        loadData();
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '分配失败'));
  };

  const allocateConfirmTotal = suggestedAllocations.reduce((s, a) => s + a.amount, 0);
  const allocateConfirmInputPct = salaryInput > 0 ? (allocateConfirmTotal / salaryInput) * 100 : 0;
  const allocateConfirmOverPct = allocateConfirmInputPct > PIGGY_ALLOCATE_MAX_RATIO * 100 + 1e-6;

  return (
    <div className="outer piggy-bank-page">
      {contextHolder}
      <div className="piggy-bank-wrap">
        <h1 className="piggy-bank-title">
          <Link href="/" className="home-link-title">
            零钱罐子
          </Link>
        </h1>

        <div className="piggy-top">
          <section className="piggy-top-item">
            <h2>待分配池</h2>
            <div className="pool-balance">¥{poolBalance.toFixed(2)}</div>
            <div className="salary-actions">
              <Button
                type="default"
                size="small"
                onClick={() => {
                  poolAllocateForm.resetFields();
                  setPoolAllocateModalOpen(true);
                }}
                disabled={poolBalance <= 0 || activeJars.length === 0}
              >
                从池中分配
              </Button>
              <Button
                type="default"
                size="small"
                icon={<HistoryOutlined />}
                onClick={() => {
                  setRecordsModalOpen(true);
                  Api.getPiggyBankAllocateRecordsApi()
                    .then((res: { records?: { id: number; amount: string | number; remark?: string | null; createdAt?: string }[] }) => {
                      setAllocateRecords(res.records || []);
                    })
                    .catch((e: { message?: string }) => messageApi.error(e.message || '加载失败'));
                }}
              >
                分配记录
              </Button>
            </div>
          </section>
          <section className="piggy-top-item">
            <h2>工资 / 金额输入</h2>
            <Form form={allocateForm} layout="vertical" className="salary-form">
              <Form.Item name="amount" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber placeholder="金额" min={0.01} step={1} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="remark" label="备注">
                <Input placeholder="如：2月工资、年终奖" maxLength={200} showCount />
              </Form.Item>
              <div className="salary-actions">
                <Button type="primary" size="small" onClick={onGetSuggestion} loading={suggestionLoading}>
                  生成分配建议
                </Button>
                <Button size="small" onClick={onToPool}>
                  先放入待分配池
                </Button>
              </div>
            </Form>
          </section>
        </div>

        <section className="piggy-bottom">
          <div className="piggy-bottom-header">
            <h2>梦想罐子</h2>
            <Button type="primary" size="small" onClick={() => setJarModalOpen(true)}>
              添加梦想
            </Button>
          </div>
          <div className="jar-list">
            {loading ? (
              <div className="loading-tip">加载中...</div>
            ) : (
              sortedDisplayJars.map((j) => {
                const balance = parseFloat(String(j.balance)) || 0
                const targetRaw = j.targetAmount != null ? parseFloat(String(j.targetAmount)) : 0
                const monthly = j.monthlyRepayment != null ? parseFloat(String(j.monthlyRepayment)) : 0
                const target = targetRaw > 0 ? targetRaw : monthly > 0 ? monthly * 12 : 0
                const fillPercent = target > 0 ? Math.min(100, (balance / target) * 100) : 0
                const images = normalizeImageUrls(j.imageUrls);
                return (
                  <div key={j.id} className={`jar-vessel ${j.status === 'completed' ? 'jar-completed' : ''}`}>
                    <div className="jar-header">
                      <span className="jar-name">{j.name}</span>
                      {j.status === 'completed' && <span className="jar-status-badge">已完成</span>}
                    </div>
                    <div
                      className="jar-body jar-body-clickable"
                      onClick={() => onOpenActualConsumption(j)}
                      title={`${balance.toFixed(0)} / ${target > 0 ? target.toFixed(0) : '-'}，点击按真实消费调整`}
                    >
                      <div
                        className="jar-fill"
                        style={{ height: `${fillPercent}%` }}
                      />
                    </div>
                    <div className="jar-footer">
                      <div className="jar-amount-row">
                        <span className="jar-balance">¥{balance.toFixed(2)}</span>
                        {target > 0 && <span className="jar-target">/ ¥{target.toFixed(0)}</span>}
                      </div>
                      <div className="jar-footer-bottom">
                        {j.monthlyRepayment != null && parseFloat(String(j.monthlyRepayment)) > 0 && (
                          <span className="jar-monthly">月还 ¥{parseFloat(String(j.monthlyRepayment)).toFixed(0)}</span>
                        )}
                        <Button
                          type="text"
                          size="small"
                          onClick={() => {
                            setJarImageEditing(j);
                            setJarImageModalOpen(true);
                          }}
                          className="jar-album-btn"
                          title="梦想相册"
                        >
                          相册{images.length ? `（${images.length}）` : ''}
                        </Button>
                        <Button type="text" size="small" onClick={() => onAbandon(j.id)} className="jar-abandon-btn" icon={<CloseCircleOutlined />} title="放弃罐子" />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      <Modal
        title={jarImageEditing ? `梦想相册：${jarImageEditing.name}` : '梦想相册'}
        open={jarImageModalOpen}
        onCancel={() => {
          setJarImageModalOpen(false);
          setJarImageEditing(null);
        }}
        footer={null}
        width={640}
        centered
      >
        {jarImageEditing ? (
          <PiggyJarImageInput
            jarId={jarImageEditing.id}
            jarName={jarImageEditing.name}
            value={normalizeImageUrls(jarImageEditing.imageUrls)}
            disabled={jarImageEditing.status === 'completed'}
            onUploadingChange={setJarImageUploading}
            onChange={(next) => {
              // 本地同步，避免重新 loadData 才能看到计数变化
              setJars((prev) =>
                prev.map((it) => (it.id === jarImageEditing.id ? { ...it, imageUrls: next } : it))
              );
              setJarImageEditing((prev) => (prev ? { ...prev, imageUrls: next } : prev));
            }}
          />
        ) : null}
        {jarImageEditing?.status === 'completed' ? (
          <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
            已完成的罐子相册仅支持查看，不支持继续上传。
          </div>
        ) : null}
      </Modal>

      <Modal
        title="添加梦想罐子"
        open={jarModalOpen}
        onCancel={() => setJarModalOpen(false)}
        footer={null}
      >
        <Form form={jarForm} onFinish={onAddJar} layout="vertical">
          <Form.Item name="name" rules={[{ required: true, message: '请输入罐子名称' }]} label="名称">
            <Input placeholder="如：旅行基金、月还款" />
          </Form.Item>
          <Form.Item name="mode" initialValue="normal" label="类型">
            <Select
              options={[
                { value: 'normal', label: '普通罐子' },
                { value: 'advance', label: '预支/还款罐子' },
              ]}
              onChange={() => {
                jarForm.setFieldsValue({
                  monthlyRepayment: undefined,
                  monthlyRepaymentAmount: undefined,
                  planMonths: undefined,
                  totalAdvance: undefined,
                });
              }}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.mode !== c.mode}>
            {({ getFieldValue }) =>
              getFieldValue('mode') === 'advance' ? (
                <>
                  <Form.Item name="monthlyRepaymentAmount" label="月还款额">
                    <InputNumber placeholder="月还款额" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <div style={{ marginBottom: 8 }}>或</div>
                  <Form.Item name="totalAdvance" label="预支总额">
                    <InputNumber placeholder="预支总额" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="planMonths" label="计划还款月数">
                    <InputNumber placeholder="月数" min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item name="monthlyRepayment" label="月还款目标（可选）">
                    <InputNumber placeholder="有则优先满足" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="targetAmount" label="目标金额（可选）">
                    <InputNumber placeholder="目标" min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </>
              )
            }
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配确认"
        open={allocateModalOpen}
        onOk={onConfirmAllocate}
        onCancel={() => setAllocateModalOpen(false)}
        okText="确认分配"
      >
        <p>输入金额：¥{salaryInput.toFixed(2)}</p>
        <p>可在确认前修改比例与金额：</p>
        <div className="allocate-list">
          {suggestedAllocations.map((a, i) => (
            <div key={a.jarId} className="allocate-row">
              <span className="jar-name">
                {a.jarName}
                {a.monthlyRepayment != null && a.monthlyRepayment > 0 && (
                  <span className="allocate-monthly-tip"> 月还 ¥{a.monthlyRepayment.toFixed(0)}</span>
                )}
              </span>
              <InputNumber
                size="small"
                value={a.amount}
                min={0}
                step={0.01}
                precision={2}
                onChange={(v) => onUpdateAllocation(i, 'amount', typeof v === 'number' ? v : 0)}
                style={{ width: 100 }}
              />
              <InputNumber
                size="small"
                value={a.proportion}
                min={0}
                max={100}
                step={0.5}
                addonAfter="%"
                onChange={(v) => onUpdateAllocation(i, 'proportion', typeof v === 'number' ? v : 0)}
                style={{ width: 90 }}
              />
            </div>
          ))}
        </div>
        <p className="allocate-sum">合计：¥{allocateConfirmTotal.toFixed(2)}</p>
        <p className={`allocate-pct-hint${allocateConfirmOverPct ? ' allocate-pct-over' : ''}`}>
          占输入金额比例：{formatAllocatePctDisplay(allocateConfirmInputPct)}% / {PIGGY_ALLOCATE_MAX_PCT}%
          {allocateConfirmOverPct ? '（超过上限，无法确认）' : ''}
        </p>
      </Modal>

      <Modal
        title="从待分配池分配"
        open={poolAllocateModalOpen}
        onCancel={() => setPoolAllocateModalOpen(false)}
        footer={null}
      >
        <Form form={poolAllocateForm} onFinish={onPoolAllocate} layout="vertical">
          <p>待分配池：¥{poolBalance.toFixed(2)}</p>
          {activeJars.map((j) => (
            <Form.Item key={j.id} name={`jar_${j.id}`} label={j.name}>
              <InputNumber min={0} max={poolBalance} step={0.01} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit">
              确认分配
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配记录"
        open={recordsModalOpen}
        onCancel={() => setRecordsModalOpen(false)}
        footer={null}
      >
        <div className="allocate-records-list">
          {allocateRecords.length === 0 ? (
            <div className="loading-tip">暂无记录</div>
          ) : (
            allocateRecords.map((r) => (
              <div key={r.id} className="allocate-record-item">
                <span className="allocate-record-amount">¥{parseFloat(String(r.amount)).toFixed(2)}</span>
                {r.remark && <span className="allocate-record-remark">{r.remark}</span>}
                <span className="allocate-record-time">
                  {r.createdAt || r.created_at
                    ? dayjs(r.createdAt || r.created_at).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        title="放弃罐子"
        open={abandonModalOpen}
        onOk={onConfirmAbandon}
        onCancel={() => {
          setAbandonModalOpen(false);
          setAbandonJarId(null);
        }}
        okText="确定"
        cancelText="取消"
      >
        <p>放弃后该罐子内的资金将进入待分配池，确定吗？</p>
      </Modal>

      <Modal
        title={actualConsumptionJar ? `按真实消费调整：${actualConsumptionJar.name}` : '按真实消费调整'}
        open={actualConsumptionModalOpen}
        onOk={onConfirmActualConsumption}
        onCancel={() => {
          setActualConsumptionModalOpen(false);
          setActualConsumptionJar(null);
          actualConsumptionForm.resetFields();
        }}
        okText="确定"
        cancelText="取消"
      >
        <p style={{ marginBottom: 8 }}>罐子创建早于消费时，还款结束前可在此填入真实消费金额以调整罐子目标。多出的已分配金额将退回待分配池；若真实消费大于原目标，罐子将保持/重新开启以继续还款。</p>
        <Form form={actualConsumptionForm} layout="vertical">
          <Form.Item name="actualConsumption" label="真实消费金额（元）" rules={[{ required: true, message: '请输入金额' }, { type: 'number', min: 0, message: '须为非负数' }]}>
            <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} placeholder="与真实消费一致" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
