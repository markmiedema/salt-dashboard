import React, { useState } from 'react';
import Modal from 'react-modal';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { InteractionsService, Interaction } from '../../services/interactionsService';
import { documentCreateSchema } from '../../validators/engagementSchemas';
import { DocumentsService } from '../../services/documentsService';
import { useUserRole } from '../../hooks/useUserRole';

Modal.setAppElement('#root'); // adjust if root id different

export interface InteractionFormProps {
  clientId: string;
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (interaction: Interaction) => void;
}

export const InteractionForm: React.FC<InteractionFormProps> = ({
  clientId,
  projectId,
  isOpen,
  onClose,
  onCreated
}) => {
  const [type, setType] = useState<'call' | 'email' | 'meeting' | 'note'>('note');
  const [summary, setSummary] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const occurredAt = new Date().toISOString();
  const role = useUserRole();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create interaction first
      const interaction = await InteractionsService.create({
        client_id: clientId,
        project_id: projectId ?? null,
        type,
        occurred_at: occurredAt,
        participants: null,
        summary,
        follow_up: followUp || null,
        created_by: null
      } as any);

      // Upload attachments as documents linked to interaction (project & client)
      for (const file of files) {
        const doc = await DocumentsService.create({
          client_id: clientId,
          project_id: projectId ?? null,
          milestone_id: null,
          title: file.name,
          description: `Attachment for interaction ${interaction.id}`,
          created_by: null
        });

        const storagePath = `${clientId}/${doc.id}/${file.name}`;
        const uploadUrl = await DocumentsService.getSignedUploadUrl(storagePath);
        await fetch(uploadUrl, { method: 'PUT', body: file });
        await DocumentsService.addVersion(doc.id, storagePath, file.type, file.size);
      }

      onCreated?.(interaction);
      // reset
      setSummary('');
      setFollowUp('');
      setFiles([]);
      onClose();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Log Interaction"
      className="bg-white p-6 rounded shadow-lg max-w-lg mx-auto mt-20 outline-none"
      overlayClassName="fixed inset-0 bg-black/50 flex items-start justify-center z-50"
    >
      <h2 className="text-lg font-semibold mb-4">Log Interaction</h2>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="border rounded px-2 py-1 w-full"
        >
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
          <option value="note">Note</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Summary / Notes</label>
        <ReactQuill theme="snow" value={summary} onChange={setSummary} />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Follow Up (optional)</label>
        <textarea
          className="border rounded w-full px-2 py-1 text-sm"
          rows={2}
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Attachments</label>
        <input type="file" multiple onChange={handleFileChange} />
      </div>

      <div className="flex justify-end gap-2">
        <button className="px-3 py-1 text-sm rounded border" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button
          className="px-4 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-60"
          onClick={handleSubmit}
          disabled={loading || summary.trim() === '' || role === 'viewer'}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </Modal>
  );
};

export default InteractionForm;
