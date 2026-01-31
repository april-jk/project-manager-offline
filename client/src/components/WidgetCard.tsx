import { Widget } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GripVertical, Settings, Trash2 } from 'lucide-react';

export default function WidgetCard({
  widget,
  onEdit,
  onDelete,
  children,
}: {
  widget: Widget;
  onEdit: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full flex flex-col border border-slate-200 bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span className="widget-drag-handle cursor-move text-slate-400">
            <GripVertical className="w-4 h-4" />
          </span>
          {widget.name}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-hidden">{children}</div>
    </Card>
  );
}
