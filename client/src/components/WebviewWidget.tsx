import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface WebviewWidgetProps {
  url: string;
  script?: string;
  selector?: string;
  attr?: string;
  refreshSec?: number;
  onData: (data: unknown) => void;
  onError: (message: string) => void;
}

export default function WebviewWidget({
  url,
  script,
  selector,
  attr,
  refreshSec = 300,
  onData,
  onError,
}: WebviewWidgetProps) {
  const webviewRef = useRef<any>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    const hasElectron = !!(window as any).electron || !!(window as any).process?.versions?.electron;
    setIsElectron(hasElectron);
  }, []);

  const builtScript = useMemo(() => {
    if (script?.trim()) {
      return script.trim();
    }
    if (selector?.trim()) {
      const safeSelector = selector.replace(/"/g, '\\"');
      if (attr?.trim()) {
        const safeAttr = attr.replace(/"/g, '\\"');
        return `(() => { const el = document.querySelector("${safeSelector}"); return el ? el.getAttribute("${safeAttr}") : null; })();`;
      }
      return `(() => { const el = document.querySelector("${safeSelector}"); return el ? el.textContent : null; })();`;
    }
    return '';
  }, [script, selector, attr]);

  useEffect(() => {
    if (!isElectron) return;
    const webview = webviewRef.current;
    if (!webview || !builtScript) return;

    const runScript = async () => {
      try {
        const result = await webview.executeJavaScript(builtScript, true);
        onData(result);
      } catch (error: any) {
        onError(error?.message || '脚本执行失败');
      }
    };

    const handleLoad = () => {
      runScript();
    };

    webview.addEventListener('did-finish-load', handleLoad);
    const timer = window.setInterval(runScript, Math.max(30, refreshSec) * 1000);

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad);
      window.clearInterval(timer);
    };
  }, [builtScript, isElectron, onData, onError, refreshSec]);

  if (!isElectron) {
    return (
      <div className="h-full flex flex-col gap-2">
        <div className="text-xs text-amber-600 inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          浏览器模式不支持脚本注入，仅展示页面
        </div>
        <iframe
          title="webview"
          src={url}
          className="w-full flex-1 rounded-md border border-slate-200"
        />
      </div>
    );
  }

  return (
    <webview
      ref={webviewRef}
      src={url}
      className="w-full h-full rounded-md border border-slate-200"
      allowpopups
      webpreferences="contextIsolation=yes"
    />
  );
}
