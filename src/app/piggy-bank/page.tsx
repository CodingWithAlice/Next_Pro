'use client';

import { useEffect, useState } from 'react';
import { Button, Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Api from '@/service/api';
import './app.css';

interface Jar {
  id: number;
  name: string;
  balance: string | number;
  monthlyRepayment?: string | number | null;
  targetAmount?: string | number | null;
  status: string;
}

interface AllocationItem {
  jarId: number;
  jarName: string;
  amount: number;
  proportion: number;
  monthlyRepayment?: number;
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

  const activeJars = jars.filter((j) => j.status === 'active');

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
    Modal.confirm({
      title: '放弃罐子',
      content: '放弃后该罐子内的资金将进入待分配池，确定吗？',
      onOk: () =>
        Api.abandonPiggyBankJarApi(id)
          .then(() => {
            messageApi.success('已放弃');
            loadData();
          })
          .catch((e: { message?: string }) => messageApi.error(e.message || '操作失败')),
    });
  };

  const onGetSuggestion = () => {
    const amount = allocateForm.getFieldValue('amount');
    if (!amount || amount <= 0) {
      messageApi.warning('请输入金额');
      return;
    }
    setSalaryInput(amount);
    Api.getPiggyBankAllocateSuggestionApi(amount)
      .then((res: { suggestion?: AllocationItem[]; message?: string }) => {
        if (res.suggestion?.length) {
          setSuggestedAllocations(res.suggestion);
          setAllocateModalOpen(true);
        } else {
          messageApi.info(res.message || '暂无建议');
        }
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '获取失败'));
  };

  const onConfirmAllocate = () => {
    const allocations = suggestedAllocations.map((a) => ({ jarId: a.jarId, amount: a.amount }));
    Api.confirmPiggyBankAllocateApi(salaryInput, allocations)
      .then(() => {
        messageApi.success('分配成功');
        setAllocateModalOpen(false);
        allocateForm.resetFields();
        loadData();
      })
      .catch((e: { message?: string }) => messageApi.error(e.message || '分配失败'));
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
    Api.putPiggyBankToPoolApi(amount)
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
          </section>
          <section className="piggy-top-item">
            <h2>工资 / 金额输入</h2>
            <Form form={allocateForm} layout="vertical" className="salary-form">
              <Form.Item name="amount" rules={[{ required: true, message: '请输入金额' }]}>
                <InputNumber placeholder="金额" min={0.01} step={1} precision={2} style={{ width: '100%' }} />
              </Form.Item>
              <div className="salary-actions">
                <Button type="primary" size="small" onClick={onGetSuggestion}>
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
              activeJars.map((j) => {
                const balance = parseFloat(String(j.balance)) || 0
                const target = j.targetAmount != null ? parseFloat(String(j.targetAmount)) : 0
                const fillPercent = target > 0 ? Math.min(100, (balance / target) * 100) : 0
                return (
                  <div key={j.id} className="jar-vessel">
                    <div className="jar-header">
                      <span className="jar-name">{j.name}</span>
                    </div>
                    <div className="jar-body">
                      <div
                        className="jar-fill"
                        style={{ height: `${fillPercent}%` }}
                        title={`${balance.toFixed(0)} / ${target > 0 ? target.toFixed(0) : '-'}`}
                      />
                    </div>
                    <div className="jar-footer">
                      <span className="jar-balance">¥{balance.toFixed(2)}</span>
                      {target > 0 && <span className="jar-target">/ ¥{target.toFixed(0)}</span>}
                      {j.monthlyRepayment != null && parseFloat(String(j.monthlyRepayment)) > 0 && (
                        <div className="jar-monthly">月还 ¥{parseFloat(String(j.monthlyRepayment)).toFixed(0)}</div>
                      )}
                      <Button type="text" size="small" onClick={() => onAbandon(j.id)} className="jar-abandon-btn" icon={<CloseCircleOutlined />} title="放弃罐子" />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

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
              <span className="jar-name">{a.jarName}</span>
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
        <p className="allocate-sum">
          合计：¥
          {suggestedAllocations.reduce((s, a) => s + a.amount, 0).toFixed(2)}
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
    </div>
  );
}
