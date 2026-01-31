import { Responsive, WidthProvider, Layouts } from 'react-grid-layout';
import { Widget } from '@/lib/storage';
import WidgetCard from '@/components/WidgetCard';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
  widgets: Widget[];
  layouts: Layouts;
  onLayoutChange: (layouts: Layouts) => void;
  onEdit: (widget: Widget) => void;
  onDelete: (widgetId: string) => void;
  renderContent: (widget: Widget) => React.ReactNode;
}

export default function WidgetGrid({
  widgets,
  layouts,
  onLayoutChange,
  onEdit,
  onDelete,
  renderContent,
}: WidgetGridProps) {
  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={60}
      margin={[12, 12]}
      onLayoutChange={(_: any, nextLayouts: Layouts) => onLayoutChange(nextLayouts)}
      draggableHandle=".widget-drag-handle"
    >
      {widgets.map((widget) => (
        <div key={widget.id} className="overflow-hidden">
          <WidgetCard
            widget={widget}
            onEdit={() => onEdit(widget)}
            onDelete={() => onDelete(widget.id)}
          >
            {renderContent(widget)}
          </WidgetCard>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}
