import { useState, useEffect, useRef } from "react";

const MultiSelect = ({ value, onChange, placeholder, availableGroups }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = event => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggle = group => {
        const newValue = value.includes(group)
            ? value.filter(g => g !== group)
            : [...value, group];
        onChange(newValue);
    };

    const handleRemoveTag = (group, e) => {
        e.stopPropagation();
        onChange(value.filter(g => g !== group));
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="min-h-[42px] w-full border border-gray-300 rounded-md px-3 py-2 bg-white cursor-pointer flex flex-wrap gap-2 items-center"
            >
                {value.length > 0 ? (
                    value.map(group => (
                        <span
                            key={group}
                            className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
                        >
                            {group}
                            <button
                                type="button"
                                onClick={e => handleRemoveTag(group, e)}
                                className="text-gray-600 hover:text-gray-800 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-gray-400 text-sm">
                        {placeholder || "Select groups..."}
                    </span>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {availableGroups.map(group => (
                        <label
                            key={group}
                            className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={value.includes(group)}
                                onChange={() => handleToggle(group)}
                                className="mr-2 w-4 h-4"
                            />
                            <span className="text-sm">{group}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelect;
