const TABS = [
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'ast', label: 'AST' },
  { id: 'cfg', label: 'Control Flow Graph' },
  { id: 'mermaid', label: 'Mermaid Code' },
  { id: 'explanation', label: 'Explanation' },
];

export default function NavigationTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex flex-wrap gap-3 p-3 shrink-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-5 py-2.5 rounded-xl text-sm cursor-pointer transition-colors duration-200 ${
            activeTab === tab.id
              ? 'bg-[#188077] text-white font-semibold'
              : 'bg-[#E8EEF2] text-[#3A4D5C] font-medium hover:bg-[#D6DEE4]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
