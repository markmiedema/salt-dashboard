import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentsService } from '../../services/documentsService';
import { ProjectService } from '../../services/projectService';
import { MilestonesService, Milestone } from '../../services/milestonesService';

export interface DocumentUploadProps {
  clientId: string;
  projectId?: string;
  milestoneId?: string;
  onUploaded?: () => void;
}

interface UploadProgress {
  file: File;
  percent: number; // 0-100
  done: boolean;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  clientId,
  projectId,
  milestoneId,
  onUploaded
}) => {
  const [progressList, setProgressList] = useState<UploadProgress[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | undefined>(projectId);
  const [selectedMilestone, setSelectedMilestone] = useState<string | undefined>(milestoneId);

  // Fetch projects when client changes
  useEffect(() => {
    if (!clientId) return;
    ProjectService.getAll({ clientId }).then((p) => {
      setProjects(p.map(({ id, name }) => ({ id, name })));
    });
  }, [clientId]);

  // Fetch milestones when project changes
  useEffect(() => {
    if (!selectedProject) return;
    MilestonesService.getAll({ projectId: selectedProject }).then(setMilestones);
  }, [selectedProject]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        if (file.size > 200 * 1024 * 1024) {
          alert(`${file.name} exceeds 200MB limit`);
          continue;
        }

        const progress: UploadProgress = { file, percent: 0, done: false };
        setProgressList((p) => [...p, progress]);

        try {
          // Create metadata record
          const doc = await DocumentsService.create({
            client_id: clientId,
            project_id: selectedProject ?? null,
            milestone_id: selectedMilestone ?? null,
            title: file.name,
            description: null,
            created_by: null
          });

          const storagePath = `${clientId}/${doc.id}/${file.name}`;
          const uploadUrl = await DocumentsService.getSignedUploadUrl(storagePath, 300);

          await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': file.type
            }
          });

          await DocumentsService.addVersion(doc.id, storagePath, file.type, file.size);

          setProgressList((prev) =>
            prev.map((p) => (p.file === file ? { ...p, percent: 100, done: true } : p))
          );
        } catch (err) {
          console.error(err);
          alert(`Upload failed: ${(err as Error).message}`);
          setProgressList((prev) => prev.filter((p) => p.file !== file));
        }
      }
      onUploaded?.();
    },
    [clientId, selectedProject, selectedMilestone, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="space-y-4">
      {/* Tagging UI */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Project</label>
          <select
            value={selectedProject ?? ''}
            onChange={(e) => {
              const val = e.target.value || undefined;
              setSelectedProject(val);
              setSelectedMilestone(undefined);
            }}
            className="border rounded w-full px-2 py-1 text-sm"
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Milestone</label>
          <select
            value={selectedMilestone ?? ''}
            onChange={(e) => setSelectedMilestone(e.target.value || undefined)}
            className="border rounded w-full px-2 py-1 text-sm"
            disabled={!selectedProject}
          >
            <option value="">None</option>
            {milestones.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded p-6 text-center cursor-pointer \
        ${isDragActive ? 'bg-blue-50 border-blue-400' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <p>Drag & drop files here, or click to select files (max 200MB each)</p>
        )}
      </div>

      {progressList.length > 0 && (
        <div className="mt-4 space-y-2">
          {progressList.map((p) => (
            <div key={p.file.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{p.file.name}</span>
                <span>{p.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded">
                <div className="bg-blue-600 h-2 rounded" style={{ width: `${p.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
