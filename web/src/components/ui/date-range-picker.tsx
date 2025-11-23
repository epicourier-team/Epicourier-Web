import { CalendarDays, Play } from "lucide-react";

type DateRange = {
  start: string;
  end: string;
};

type Props = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply?: () => void;
};

export default function DateRangePicker({ value, onChange, onApply }: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-none border-2 border-black bg-white px-3 py-2 shadow-[6px_6px_0_0_#000]">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-indigo-700" />
        <label className="text-xs font-bold uppercase text-gray-700" htmlFor="date-range-start">
          Start
        </label>
        <input
          id="date-range-start"
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className="brutalism-input h-10 rounded-none border-2 border-black px-2 text-sm font-semibold"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold uppercase text-gray-700" htmlFor="date-range-end">
          End
        </label>
        <input
          id="date-range-end"
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className="brutalism-input h-10 rounded-none border-2 border-black px-2 text-sm font-semibold"
        />
      </div>
      <button
        type="button"
        onClick={onApply}
        className="brutalism-button inline-flex items-center gap-2 rounded-none px-3 py-2 text-sm font-bold uppercase"
        data-testid="apply-range"
      >
        <Play className="size-4" /> Apply
      </button>
    </div>
  );
}
