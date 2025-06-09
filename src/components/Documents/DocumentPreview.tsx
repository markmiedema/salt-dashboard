import React, { useEffect, useState } from 'react';
import { DocumentsService, DocumentVersion } from '../../services/documentsService';

export interface DocumentPreviewProps {
  documentId: string;
  onClose: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ documentId, onClose }) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [selected, setSelected] = useState<DocumentVersion | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    DocumentsService.listVersions(documentId)
      .then((vers) => {
        setVersions(vers);
        if (vers.length > 0) {
          selectVersion(vers[0]);
        }
      })
      .catch(console.error);
  }, [documentId]);

  const selectVersion = async (version: DocumentVersion) => {
    setSelected(version);
    const url = await DocumentsService.getSignedDownloadUrl(version.storage_path, 300);
    setPreviewUrl(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50">
      <div className="bg-white w-full max-w-3xl h-[80vh] mt-8 rounded shadow-lg overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">Document Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Version list */}
          <div className="w-48 border-r overflow-y-auto">
            {versions.map((v) => (
              <div
                key={v.id}
                className={`px-3 py-2 text-sm cursor-pointer border-b hover:bg-gray-100 ${
                  selected?.id === v.id ? 'bg-gray-100 font-medium' : ''
                }`}
                onClick={() => selectVersion(v)}
              >
                v{v.version_number}
              </div>
            ))}
          </div>
          {/* Preview Pane */}
          <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
            {previewUrl ? (
              <iframe title="preview" src={previewUrl} className="w-full h-full" />
            ) : (
              <p className="text-sm text-gray-500">Loading preview...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
