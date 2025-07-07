import React from 'react';
import { useNavigate } from 'react-router-dom';
import UploadBox from '../components/UploadBox';
import { useStartIngestion } from '../hooks/useIngestion';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { startIngestion } = useStartIngestion();

  const handleUpload = async (rows: any[]) => {
    try {
      const mappedRows = rows.map(row => ({
        ...row,
        quantity: Number(row.quantity) || 0,
        sku: typeof row.sku === 'string' && row.sku ? row.sku : `UK-CSV-${Date.now()}`,
        description: typeof row.description === 'string' ? row.description : '',
        store: ['KEN', 'BAT', 'HOM'].includes(row.store) ? row.store : 'KEN',
        last_upload: new Date(),
        ingestion_id: 9999,
      }));
      await startIngestion(mappedRows);
      navigate('/inventory');
    } catch (error: any) {
      alert(error.message);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50">
      <h1 className="text-4xl font-bold mt-20 mb-8 text-center">JustZapp Inventory App</h1>
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 mb-8"
          onClick={() => navigate('/inventory')}
        >
          Show Inventory
        </button>
        <UploadBox onUpload={handleUpload} />
    </div>
  );
};

export default HomeScreen;