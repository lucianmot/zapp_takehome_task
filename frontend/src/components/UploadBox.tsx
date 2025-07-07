import React, { useRef } from 'react';
import Papa from 'papaparse';

type UploadBoxProps = {
  onUpload: (rows: any[]) => void;
};

const UploadBox: React.FC<UploadBoxProps> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onUpload(results.data);
      }
    });
  };

  return (
    <div
      className="border-2 border-dashed border-blue-300 rounded-lg p-24 w-[600px] min-h-[200px] bg-white text-gray-600 text-center flex flex-col items-center justify-center cursor-pointer transition hover:bg-blue-50"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        type="file"
        accept=".csv"
        className="hidden"
        ref={inputRef}
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />
      <p className="text-lg mb-2">Drag and drop your inventory CSV here, or click to select</p>
      <span className="text-gray-400 text-sm">Accepted format: .csv</span>
    </div>
  );
};

export default UploadBox;