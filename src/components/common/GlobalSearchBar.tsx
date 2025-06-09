import React, { useEffect, useState } from 'react';
import {
  EngagementSearchService,
  EngagementSearchResult
} from '../../services/engagementSearchService';
import { FixedSizeList as List } from 'react-window';

export interface GlobalSearchBarProps {
  clientId?: string; // optional restrict to client
  onSelect: (result: EngagementSearchResult) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ clientId, onSelect }) => {
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

  const handleSelect = (res: EngagementSearchResult) => {
    onSelect(res);
    setKeyword('');
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Global search..."
        className="w-full border rounded px-3 py-1 text-sm"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setShowDropdown(true);
        }}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        onFocus={() => keyword && setShowDropdown(true)}
      />
      {showDropdown && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-hidden">
          <List
            height={240}
            width={'100%'}
            itemCount={results.length}
            itemSize={40}
            itemData={results}
          >
            {({ index, style, data }) => {
              const item = data[index];
              return (
                <div
                  style={style}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelect(item)}
                >
                  <span className="font-medium mr-2">{item.title}</span>
                  <span className="text-gray-500">({item.type})</span>
                </div>
              );
            }}
          </List>
        </div>
      )}
    </div>
  );
};

export default GlobalSearchBar;
