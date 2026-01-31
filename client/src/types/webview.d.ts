declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<any>,
      any
    > & {
      src?: string;
      preload?: string;
      allowpopups?: string;
      webpreferences?: string;
    };
  }
}
