import React, { useEffect, useMemo, useState } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  EngagementSearchService,
  EngagementSearchResult,
  EngagementType
} from '../../services/engagementSearchService';

export interface TimelineFeedProps {
  clientId: string;
  projectId?: string;
}

const typeStyles: Record<EngagementType, string> = {
  interaction: 'bg-blue-500',
  milestone: 'bg-green-500',
  document: 'bg-indigo-500'
};

const Row = ({ index, style, data }: ListChildComponentProps<EngagementSearchResult[]>) => {
  const item = data[index];
  return (
    <div style={style} className="px-4 py-2 border-b border-gray-200 flex items-start gap-2">
      <div className={`w-2 h-2 rounded-full mt-2 ${typeStyles[item.type]}`} />
      <div>
        <p className="text-sm font-medium">
          {item.title}
          <span className="ml-2 text-xs text-gray-500">({item.type})</span>
        </p>
        <p className="text-xs text-gray-400">{new Date(item.event_date).toLocaleString()}</p>
      </div>
    </div>
  );
};

export const TimelineFeed: React.FC<TimelineFeedProps> = ({ clientId, projectId }) => {
  const [items, setItems] = useState<EngagementSearchResult[]>([]);

  const [keyword, setKeyword] = useState('');
  const [fromDate, setFromDate] = useState<string | undefined>();
  const [toDate, setToDate] = useState<string | undefined>();
  const [categoryFilters, setCategoryFilters] = useState<Record<EngagementType, boolean>>({
    interaction: true,
    milestone: true,
    document: true
  });

  const fetchData = () => {
    const categories = (Object.keys(categoryFilters) as EngagementType[]).filter(
      (c) => categoryFilters[c]
    );

    EngagementSearchService.search({
      clientId,
      projectId,
      keyword: keyword || undefined,
      from: fromDate,
      to: toDate,
      categories
    })
      .then(setItems)
      .catch(console.error);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, projectId]);

  // Refetch when filters change with debounce
  useEffect(() => {
    const id = setTimeout(fetchData, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, fromDate, toDate, categoryFilters]);

  const itemData = useMemo(() => items, [items]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Filter Controls */}
      <div className="p-4 border-b border-gray-200 space-y-2">
        <input
          type="text"
          placeholder="Search keywords..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <div className="flex gap-4 flex-wrap text-sm">
          {(['interaction', 'milestone', 'document'] as EngagementType[]).map((type) => (
            <label key={type} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={categoryFilters[type]}
                onChange={(e) =>
                  setCategoryFilters({ ...categoryFilters, [type]: e.target.checked })
                }
              />
              {type}
            </label>
          ))}
        </div>
        <div className="flex gap-2 text-sm">
          <input
            type="date"
            value={fromDate ?? ''}
            onChange={(e) => setFromDate(e.target.value || undefined)}
            className="border rounded px-1"
          />
          <span>to</span>
          <input
            type="date"
            value={toDate ?? ''}
            onChange={(e) => setToDate(e.target.value || undefined)}
            className="border rounded px-1"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              width={width}
              itemCount={itemData.length}
              itemSize={60}
              itemData={itemData}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

export default TimelineFeed;
