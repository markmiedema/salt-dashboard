import React, { useEffect, useState } from 'react';
import { MilestonesService, Milestone, MilestoneStatus } from '../../services/milestonesService';
import { useUserRole } from '../../hooks/useUserRole';

export interface MilestoneListProps {
  projectId: string;
}

const statusOptions: MilestoneStatus[] = ['not_started', 'in_progress', 'complete'];

export const MilestoneList: React.FC<MilestoneListProps> = ({ projectId }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const role = useUserRole();

  const fetchData = () => {
    setLoading(true);
    MilestonesService.getAll({ projectId })
      .then(setMilestones)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleStatusChange = async (id: string, newStatus: MilestoneStatus) => {
    try {
      await MilestonesService.updateStatus(id, newStatus);
      fetchData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  if (loading) return <p className="p-4 text-sm text-gray-500">Loading milestones...</p>;
  if (milestones.length === 0) return <p className="p-4 text-sm text-gray-500">No milestones.</p>;

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left py-2 px-3">Name</th>
          <th className="text-left py-2 px-3">Target Date</th>
          <th className="text-left py-2 px-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {milestones.map((m) => (
          <tr key={m.id} className="border-b hover:bg-gray-50">
            <td className="py-2 px-3">{m.name}</td>
            <td className="py-2 px-3">{m.target_date ?? '-'}</td>
            <td className="py-2 px-3">
              <select
                value={m.status}
                onChange={(e) => handleStatusChange(m.id, e.target.value as MilestoneStatus)}
                className="border rounded px-2 py-1 disabled:opacity-50"
                disabled={role === 'viewer'}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MilestoneList;
