import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EngagementSearchService,
  EngagementSearchResult
} from '../../services/engagementSearchService';
import { FixedSizeList as List } from 'react-window';
import { getClientProjectUrl } from '../../utils/navigation';

export interface GlobalSearchBarProps {
  clientId?: string; // optional restrict to client
  onSelect?: (result: EngagementSearchResult) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ clientId, onSelect }) => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<EngagementSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (keyword.trim() === '') {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      EngagementSearchService.search({ clientId, keyword })
        .then((res) => setResults(res.slice(0, 20)))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(id);
  }, [keyword, clientId]);

  const handleSelect = (result: EngagementSearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else {
      // Navigate to appropriate page based on result type
      if (result.type === 'interaction' || result.type === 'milestone' || result.type === 'document') {
        if (result.project_id) {
          // Navigate to project page
          navigate(getClientProjectUrl(result.client_id, result.project_id));
        } else {
          // Navigate to client page
          navigate(`/clients/${result.client_id}`);
        }
      }
    }
    
    setKeyword('');
    setResults([]);
    setShowDropdown(false);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'interaction':
        return '💬';
      case 'milestone':
        return '🎯';
      case 'document':
        return '📄';
      default:
        return '📋';
    }
  };

  const getResultDescription = (result: EngagementSearchResult) => {
    const date = new Date(result.event_date).toLocaleDateString();
    return `${getResultIcon(result.type)} ${result.type} • ${date}`;
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search interactions, milestones, documents..."
        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => keyword && setShowDropdown(true)}
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <List
            height={Math.min(results.length * 60, 320)}
            width={'100%'}
            itemCount={results.length}
            itemSize={60}
            itemData={results}
          >
            {({ index, style, data }) => {
              const item = data[index];
              return (
                <div
                  style={style}
                  className="px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSelect(item)}
                >
                  <div className="font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-gray-500 text-xs mt-1">{getResultDescription(item)}</div>
                </div>
              );
            }}
          </List>
        </div>
      )}
      {showDropdown && keyword && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-sm text-gray-500 text-center">
            No results found for "{keyword}"
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;