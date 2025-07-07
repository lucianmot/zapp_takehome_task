import React from 'react';

const allowedStores = ['KEN', 'BAT', 'HOM'] as const;

type Row = {
  id: number;
  quantity: number;
  sku: string;
  description: string;
  store: string;
};

type InventoryRowProps = {
  row: Row;
  error?: string;
  onEdit?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onChange?: (field: keyof Row, value: string) => void;
  onCancel?: () => void;
  onRowClick?: () => void;
  isErrorRow?: boolean;
};

const InventoryRow: React.FC<InventoryRowProps> = ({
  row,
  error,
  onEdit,
  onSave,
  onDelete,
  isEditing,
  onChange,
  onCancel,
  onRowClick,
  isErrorRow,
}) => {
  const handleRowClick = () => {
    if (!isEditing && onRowClick) {
      onRowClick();
    }
  };
  return (
    <>
      <tr
        className={`bg-white even:bg-gray-50${!isEditing ? ' cursor-pointer' : ''}${isErrorRow ? ' border border-red-500 bg-red-100' : ''}`}
        onClick={handleRowClick}
      >
        <td className="border border-gray-300 px-4 py-2">
          {isEditing ? (
            <input
              type="number"
              value={row.quantity}
              onChange={e => onChange?.('quantity', e.target.value)}
              className="w-20 border rounded px-1 py-0.5"
            />
          ) : (
            row.quantity
          )}
        </td>
        <td className="border border-gray-300 px-4 py-2">
          {isEditing ? (
            <input
              type="text"
              value={row.sku}
              onChange={e => onChange?.('sku', e.target.value)}
              className="w-28 border rounded px-1 py-0.5"
            />
          ) : (
            row.sku
          )}
        </td>
        <td className="border border-gray-300 px-4 py-2">
          {isEditing ? (
            <input
              type="text"
              value={row.description}
              onChange={e => onChange?.('description', e.target.value)}
              className="w-32 border rounded px-1 py-0.5"
            />
          ) : (
            row.description || <span className="text-gray-400 italic">—</span>
          )}
        </td>
        <td className="border border-gray-300 px-4 py-2">
          {isEditing ? (
            <select
              className="w-20 border rounded px-1 py-0.5"
              value={row.store}
              onChange={e => onChange?.('store', e.target.value)}
            >
              <option value="" disabled>Select store</option>
              {allowedStores.map((store) => (
                <option key={store} value={store}>
                  {store}
                </option>
              ))}
            </select>
          ) : (
            row.store
          )}
        </td>
        <td className="border border-gray-300 px-4 py-2 text-center">
          {isEditing ? (
            <>
              <button
                className="bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded mr-2"
                onClick={onSave}
              >
                Save
              </button>
              <button
                className="bg-gray-400 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded"
                onClick={onCancel}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded mr-2"
                onClick={e => { e.stopPropagation(); onEdit?.(); }}
              >
                Edit
              </button>
              <button
                className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded"
                onClick={onDelete}
              >
                Delete
              </button>
            </>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className="border border-t-0 border-gray-300 px-4 py-1 text-red-600 bg-red-50">
            {error}
          </td>
        </tr>
      )}
    </>
  );
};

export default InventoryRow;