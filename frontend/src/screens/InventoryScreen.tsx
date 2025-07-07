import React, { useState, useEffect } from 'react';
import InventoryRow from '../components/InventoryRow';
import { useInventory } from '../hooks/useInventory';
import { useNavigate } from 'react-router-dom';
import { useIngestionErrors, deleteIngestionError, correctIngestionError } from '../hooks/useIngestionError';
import { useAllIngestions } from '../hooks/useIngestion';

type Row = {
  id: number;
  quantity: number;
  sku: string;
  description: string;
  store: string;
  isNew?: boolean;
};

const InventoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { rows: swrRows, loading, error: inventoryError, addInventory, updateInventory, deleteInventory } = useInventory();
  const [rows, setRows] = useState<Row[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Error row editing states
  const [editingErrorId, setEditingErrorId] = useState<number | null>(null);
  const [editingErrorRow, setEditingErrorRow] = useState<Row | null>(null);

  const { ingestions } = useAllIngestions();
  const latestIngestionId = ingestions.length > 0 ? ingestions[ingestions.length - 1].id : undefined;
  const { errors: errorRows } = useIngestionErrors(latestIngestionId);

  useEffect(() => {
    if (swrRows) {
      setRows(swrRows);
    }
  }, [swrRows]);

  const startEdit = (idx: number) => {
    if (!rows) return;
    setEditIdx(idx);
    setEditRow({ ...rows[idx] });
    setError(null);
  };

  const cancelEdit = () => {
    if (editIdx === null || !editRow) {
      setEditIdx(null);
      setEditRow(null);
      setError(null);
      return;
    }
    if (editRow.isNew) {
      setRows(rows.filter((_, i) => i !== editIdx));
    }
    setEditIdx(null);
    setEditRow(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (editIdx === null || !editRow) return;
    if (editRow.quantity < 0) {
      setError('Quantity cannot be negative');
      return;
    }
    try {
      if (editRow.isNew) {
        const newRow = await addInventory({
          quantity: editRow.quantity,
          sku: editRow.sku,
          description: editRow.description,
          store: editRow.store,
          last_upload: new Date().toISOString(),
          ingestion_id: 9999,
        });
        if (newRow) {
          const updatedRows = [...rows];
          updatedRows[editIdx] = newRow;
          setRows(updatedRows);
          setEditIdx(null);
          setEditRow(null);
          setError(null);
        }
      } else {
        await updateInventory(editRow.id, {
          quantity: editRow.quantity,
          description: editRow.description,
        });
        const updatedRows = [...rows];
        updatedRows[editIdx] = editRow;
        setRows(updatedRows);
        setEditIdx(null);
        setEditRow(null);
        setError(null);
      }
    } catch (e) {
      setError('Failed to save changes');
    }
  };

  const deleteRow = async (idx: number) => {
    if (!rows) return;
    try {
      await deleteInventory(rows[idx].id);
      const updatedRows = rows.filter((_, i) => i !== idx);
      setRows(updatedRows);
      if (editIdx === idx) {
        setEditIdx(null);
        setEditRow(null);
        setError(null);
      }
    } catch (e) {
      setError('Failed to delete row');
    }
  };

  const handleEditChange = (field: keyof Row, value: string) => {
    if (!editRow) return;
    setEditRow({ ...editRow, [field]: field === 'quantity' ? Number(value) : value });
  };

  const addNewRow = async () => {
    const newLocalRow: Row = {
      id: Date.now(),
      quantity: 0,
      sku: '',
      description: '',
      store: '',
      isNew: true,
    };
    setRows([...rows, newLocalRow]);
    setEditIdx(rows.length);
    setEditRow(newLocalRow);
    setError(null);
  };

  if (loading) {
    return <div className="min-h-screen flex flex-col items-center bg-gray-50">Loading...</div>;
  }

  if (inventoryError) {
    return <div className="min-h-screen flex flex-col items-center bg-gray-50">Error: {inventoryError.message || 'Failed to load inventory'}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex w-full justify-center relative mt-10 mb-14">
          <button
            className="absolute left-0 min-w-[120px] px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold">Inventory Excel View</h1>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 font-semibold">Quantity</th>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 font-semibold">SKU</th>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 font-semibold">Description</th>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 font-semibold">Store</th>
                <th className="border border-gray-300 bg-gray-100 px-4 py-2 font-semibold">Edit</th>
              </tr>
            </thead>
            <tbody>
              {rows && rows.map((row, i) => (
                <InventoryRow
                  key={row.id}
                  row={editIdx === i && editRow ? editRow : row}
                  error={editIdx === i ? error ?? undefined : undefined}
                  onEdit={() => startEdit(i)}
                  onRowClick={() => startEdit(i)}
                  onSave={saveEdit}
                  onDelete={() => deleteRow(i)}
                  onChange={handleEditChange}
                  isEditing={editIdx === i}
                  onCancel={cancelEdit}
                />
              ))}
              {errorRows && errorRows.map(errorRow => {
                const isEditing = editingErrorId === errorRow.id;
                const rowData = isEditing && editingErrorRow
                  ? editingErrorRow
                  : { id: errorRow.id, ...errorRow.raw_data };
                return (
                  <InventoryRow
                    key={`error-${errorRow.id}`}
                    row={rowData}
                    isErrorRow={true}
                    isEditing={isEditing}
                    error={errorRow.error_msg}
                    onEdit={() => {
                      setEditingErrorId(errorRow.id);
                      setEditingErrorRow({ id: errorRow.id, ...errorRow.raw_data });
                    }}
                    onChange={(field, value) => {
                      if (!editingErrorRow) return;
                      setEditingErrorRow({
                        ...editingErrorRow,
                        [field]: field === 'quantity' ? Number(value) : value
                      });
                    }}
                    onSave={async () => {
                      if (!editingErrorRow) return;
                      await correctIngestionError(errorRow.id, { raw_data: editingErrorRow });
                      setEditingErrorId(null);
                      setEditingErrorRow(null);
                    }}
                    onCancel={() => {
                      setEditingErrorId(null);
                      setEditingErrorRow(null);
                    }}
                    onDelete={async () => { await deleteIngestionError(errorRow.id); }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {editIdx === null && (
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mx-auto block"
            onClick={addNewRow}
          >
            + Add New Row
          </button>
        )}
      </div>
    </div>
  );
};

export default InventoryScreen;