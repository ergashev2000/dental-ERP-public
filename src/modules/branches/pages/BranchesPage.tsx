import { App, Button, Drawer, Form, Input, InputNumber, Switch, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Pencil, Plus } from '@/shared/icons';
import { useState } from 'react';
import { MoneyText, PageHeader, Panel, PhoneInput, PhoneText, phoneRules, StatusTag } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useBranches, useSaveBranch } from '../hooks/useBranches';
import type { Branch, BranchInput } from '../types';

/** Sozlamalar → Filiallar: ro'yxat va solishtirish (faqat Egasi) */
export const BranchesPage = () => {
  const { data = [], isLoading } = useBranches();
  const save = useSaveBranch();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [form] = Form.useForm<BranchInput>();
  const [editing, setEditing] = useState<Branch | null | undefined>(undefined);

  const open = (b: Branch | null) => {
    setEditing(b);
    form.setFieldsValue(b ?? { name: '', address: '', phone: '', chairs: 2, isActive: true });
  };

  const columns: ColumnsType<Branch> = [
    {
      title: 'Filial',
      dataIndex: 'name',
      render: (v: string, r) => (
        <div className="leading-tight">
          <div className="font-medium">{v}</div>
          <div className="max-w-64 truncate text-xs text-muted" title={r.address}>
            {r.address}
          </div>
        </div>
      ),
    },
    { title: 'Telefon', dataIndex: 'phone', responsive: ['lg'], render: (v: string) => <PhoneText phone={v} /> },
    { title: 'Kreslo', dataIndex: 'chairs', align: 'right', responsive: ['md'] },
    { title: 'Tushum (oy)', key: 'rev', align: 'right', render: (_, r) => <MoneyText value={r.stats.revenue} /> },
    { title: 'Qabullar', key: 'ap', align: 'right', responsive: ['md'], render: (_, r) => <span className="tabular-nums">{r.stats.appointments}</span> },
    {
      title: 'Kelmay qolish',
      key: 'ns',
      align: 'right',
      responsive: ['lg'],
      render: (_, r) => <StatusTag tone={r.stats.noShowRate > 8 ? 'warning' : 'success'}>{r.stats.noShowRate.toFixed(1)}%</StatusTag>,
    },
    { title: 'Yangi bemorlar', key: 'np', align: 'right', responsive: ['xl'], render: (_, r) => <span className="tabular-nums">{r.stats.newPatients}</span> },
    { title: 'Holat', dataIndex: 'isActive', render: (v: boolean) => <StatusTag tone={v ? 'success' : 'neutral'}>{v ? 'Faol' : 'Yopiq'}</StatusTag> },
    { key: 'a', width: 56, render: (_, r) => <Button type="text" aria-label="Tahrirlash" icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => open(r)} /> },
  ];

  return (
    <>
      <PageHeader
        title="Filiallar"
        description="Klinika tarmog‘idagi filiallar va ularning oy boshidan ko‘rsatkichlari"
        breadcrumb={[{ label: 'Bosh sahifa', to: ROUTES.dashboard }, { label: 'Sozlamalar' }, { label: 'Filiallar' }]}
        actions={
          <Button type="primary" icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => open(null)}>
            Filial qo‘shish
          </Button>
        }
      />
      <Panel className="flex-1" bodyClassName="p-3 md:p-4">
        <Table rowKey="id" size="middle" loading={isLoading} columns={columns} dataSource={data} pagination={false} scroll={{ x: 640 }} />
      </Panel>

      <Drawer
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
        width={isMobile ? '100%' : 440}
        title={editing ? 'Filialni tahrirlash' : 'Yangi filial'}
        destroyOnHidden
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditing(undefined)}>Bekor qilish</Button>
            <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
              Saqlash
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={(input) =>
            save.mutate(
              { id: editing?.id, input },
              {
                onSuccess: () => {
                  message.success('Saqlandi');
                  setEditing(undefined);
                },
                onError: (e) => message.error(errorMessage(e)),
              },
            )
          }
        >
          <Form.Item name="name" label="Nomi" rules={[{ required: true, message: 'Filial nomini kiriting' }]}>
            <Input placeholder="Masalan, Chilonzor filiali" />
          </Form.Item>
          <Form.Item name="address" label="Manzil">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telefon" rules={phoneRules()}>
            <PhoneInput />
          </Form.Item>
          <Form.Item name="chairs" label="Kreslolar soni">
            <InputNumber min={1} max={30} className="w-full" />
          </Form.Item>
          <Form.Item name="isActive" label="Faol" valuePropName="checked" className="mb-0">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};
