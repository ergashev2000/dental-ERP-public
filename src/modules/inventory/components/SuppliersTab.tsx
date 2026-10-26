import { App, Button, Form, Input, Modal, Table } from 'antd';
import { Pencil, Plus } from '@/shared/icons';
import { useEffect, useState } from 'react';
import { Can, EmptyState, PhoneInput, PhoneText, phoneRules } from '@/shared/components/ui';
import { usePermission } from '@/shared/hooks/usePermission';
import { errorMessage } from '@/shared/lib/mock/mockRequest';
import { useSaveSupplier, useSuppliers } from '../hooks/useInventory';
import type { Supplier, SupplierInput } from '../types';

export const SuppliersTab = () => {
  const { data = [], isLoading } = useSuppliers();
  const save = useSaveSupplier();
  const canManage = usePermission('inventory.manage');
  const { message } = App.useApp();
  const [editing, setEditing] = useState<Supplier | null | undefined>(undefined);
  const [form] = Form.useForm<SupplierInput>();

  useEffect(() => {
    if (editing !== undefined) form.setFieldsValue(editing ?? { name: '', phone: '' });
  }, [editing, form]);

  return (
    <>
      <Can perm="inventory.manage">
        <div className="mb-4 flex justify-end">
          <Button icon={<Plus size={18} strokeWidth={1.5} />} onClick={() => setEditing(null)}>
            Yetkazib beruvchi qo‘shish
          </Button>
        </div>
      </Can>
      <Table
        rowKey="id"
        size="middle"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        scroll={{ x: 560 }}
        locale={{ emptyText: <EmptyState title="Yetkazib beruvchilar yo‘q" description="Birinchi yetkazib beruvchini qo‘shing — kirim qilishda tanlanadi" action={<Can perm="inventory.manage"><Button onClick={() => setEditing(null)}>Yetkazib beruvchi qo‘shish</Button></Can>} /> }}
        columns={[
          { title: 'Nomi', dataIndex: 'name', render: (v: string) => <span className="font-medium">{v}</span> },
          { title: 'Telefon', dataIndex: 'phone', render: (v: string) => <PhoneText phone={v} /> },
          { title: 'Kontakt shaxs', dataIndex: 'contact' },
          { title: 'Izoh', dataIndex: 'note', responsive: ['md'], render: (v?: string) => <span className="block max-w-72 truncate text-muted" title={v}>{v ?? '—'}</span> },
          ...(canManage
            ? [{ key: 'a', width: 56, render: (_: unknown, r: Supplier) => <Button type="text" shape="circle" aria-label="Tahrirlash" icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => setEditing(r)} /> }]
            : []),
        ]}
      />
      <Modal
        open={editing !== undefined}
        onCancel={() => setEditing(undefined)}
        title={editing ? 'Yetkazib beruvchini tahrirlash' : 'Yangi yetkazib beruvchi'}
        okText="Saqlash"
        cancelText="Bekor qilish"
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          className="mt-4"
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
          <Form.Item name="name" label="Nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telefon" rules={phoneRules()}>
            <PhoneInput />
          </Form.Item>
          <Form.Item name="contact" label="Kontakt shaxs">
            <Input />
          </Form.Item>
          <Form.Item name="note" label="Izoh">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
