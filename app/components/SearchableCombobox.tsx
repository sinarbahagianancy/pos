import React, { useState, useMemo, useRef, useEffect, useId } from "react";

/**
 * A single option in a `<SearchableCombobox />`. The optional `group`
 * field puts the item under a header in the dropdown; pass the same
 * string on multiple items to group them. Items without a `group` are
 * rendered without a header.
 */
export interface SearchableComboboxItem {
  id: string;
  label: string;
  group?: string;
}

interface SearchableComboboxProps {
  items: SearchableComboboxItem[];
  /** The id of the currently selected item. Pass `""` for "nothing selected". */
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  panelClassName?: string;
  disabled?: boolean;
  /** HTML form `required` attribute. When true, the input is marked
   *  required only if no value is selected, so empty + non-empty both
   *  validate correctly. */
  required?: boolean;
}

/**
 * Single-select searchable combobox implementing the W3C ARIA
 * combobox pattern. See https://www.w3.org/WAI/ARIA/apg/patterns/combobox/.
 *
 * Features:
 *   - text input with type-to-filter (substring, case-insensitive)
 *   - optional group headers (driven by the `group` field on items)
 *   - full keyboard nav: ArrowUp/Down, Home/End, Enter, Escape
 *   - aria-expanded / aria-controls / aria-activedescendant / aria-selected
 *   - click-outside and Escape to close
 *   - disabled state
 *
 * The component is controlled: the caller owns `value` and is notified
 * of changes via `onChange`. The internal search text is reset on
 * focus and on selection; it is NOT cleared on close, so the next
 * focus starts with the same UX as a fresh open.
 */
const SearchableCombobox: React.FC<SearchableComboboxProps> = ({
  items,
  value,
  onChange,
  placeholder = "Pilih...",
  emptyMessage = "Tidak ada hasil",
  className = "",
  panelClassName = "",
  disabled = false,
  required = false,
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listboxId = `searchable-combobox-listbox-${generatedId}`;
  const optionId = (id: string) => `searchable-combobox-option-${generatedId}-${id}`;

  // Filter items by search (substring, case-insensitive).
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter((it) => it.label.toLowerCase().includes(q));
  }, [items, search]);

  // Currently selected item (for displaying the value when not focused).
  // Search against the FULL items list, not filteredItems, so a stale
  // value still shows the right label even if the user has typed a
  // search that excludes it.
  const selectedItem = useMemo(() => items.find((it) => it.id === value), [items, value]);

  // Close on click outside.
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Reset activeIndex when the filter changes or the dropdown opens.
  useEffect(() => {
    setActiveIndex(-1);
  }, [search, isOpen]);

  const handleSelect = (id: string) => {
    onChange(id);
    setSearch("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredItems.length > 0) {
          setActiveIndex((i) => (i < 0 ? 0 : Math.min(i + 1, filteredItems.length - 1)));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredItems.length > 0) {
          setActiveIndex((i) => (i < 0 ? filteredItems.length - 1 : Math.max(i - 1, 0)));
        }
        break;
      case "Enter":
        e.preventDefault();
        if (isOpen && activeIndex >= 0 && activeIndex < filteredItems.length) {
          handleSelect(filteredItems[activeIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        if (isOpen) {
          setIsOpen(false);
          setActiveIndex(-1);
        } else if (search) {
          setSearch("");
        }
        break;
      case "Home":
        if (isOpen && filteredItems.length > 0) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (isOpen && filteredItems.length > 0) {
          e.preventDefault();
          setActiveIndex(filteredItems.length - 1);
        }
        break;
    }
  };

  const activeOptionId =
    activeIndex >= 0 && activeIndex < filteredItems.length
      ? optionId(filteredItems[activeIndex].id)
      : undefined;

  // Display value: search text when open, selected label when closed.
  const displayValue = isOpen ? search : (selectedItem?.label ?? "");

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-autocomplete="list"
        disabled={disabled}
        required={required && !value}
        className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          isOpen ? "border-indigo-500" : "border-slate-200"
        }`}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!isOpen) setIsOpen(true);
        }}
        onFocus={() => {
          if (disabled) return;
          setSearch("");
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {/* Chevron */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg
          className={`w-4 h-4 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto ${panelClassName}`}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, flatIdx) => {
              const isFirstInGroup =
                flatIdx === 0 || filteredItems[flatIdx - 1].group !== item.group;
              const isActive = flatIdx === activeIndex;
              const isSelected = value === item.id;
              return (
                <React.Fragment key={item.id}>
                  {isFirstInGroup && item.group && (
                    <div className="px-3 pt-2 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.group}
                    </div>
                  )}
                  <div
                    id={optionId(item.id)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !disabled && handleSelect(item.id)}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      isActive || isSelected
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-900 hover:bg-slate-50"
                    } ${isSelected ? "font-black" : "font-bold"}`}
                  >
                    {item.label}
                  </div>
                </React.Fragment>
              );
            })
          ) : (
            <div className="px-3 py-3 text-sm text-slate-400 italic">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableCombobox;
