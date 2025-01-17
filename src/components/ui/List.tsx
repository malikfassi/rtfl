import React from 'react';

interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  selectedId?: string;
  onSelect?: (item: T) => void;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function List<T>({
  items,
  renderItem,
  selectedId,
  onSelect,
  keyExtractor,
  className = ''
}: ListProps<T>) {
  return (
    <ul className={`font-mono divide-y divide-foreground/10 ${className}`}>
      {items.map((item, index) => {
        const id = keyExtractor(item);
        const isSelected = selectedId === id;
        
        return (
          <li
            key={id}
            onClick={() => onSelect?.(item)}
            className={`
              group flex cursor-pointer items-center gap-2 px-4 py-2
              hover:bg-input-bg
              ${isSelected ? 'bg-input-bg' : ''}
            `}
          >
            <span className="text-muted group-hover:text-foreground">
              {isSelected ? '>' : ' '}
            </span>
            {renderItem(item, index)}
          </li>
        );
      })}
    </ul>
  );
} 