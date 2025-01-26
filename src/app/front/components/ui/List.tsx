import React from 'react';
import { cn } from '@/app/front/lib/utils';

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
    <ul className={cn(
      "font-mono divide-y divide-primary-muted/10",
      className
    )}>
      {items.map((item, index) => {
        const id = keyExtractor(item);
        const isSelected = selectedId === id;
        
        return (
          <li
            key={id}
            onClick={() => onSelect?.(item)}
            className={cn(
              "group flex cursor-pointer items-center gap-2 px-4 py-2",
              "hover:bg-primary-muted/5",
              isSelected && "bg-primary-muted/10"
            )}
          >
            <span className={cn(
              "text-primary-muted",
              "group-hover:text-primary-dark",
              isSelected && "text-primary-dark"
            )}>
              {isSelected ? '>' : ' '}
            </span>
            {renderItem(item, index)}
          </li>
        );
      })}
    </ul>
  );
} 