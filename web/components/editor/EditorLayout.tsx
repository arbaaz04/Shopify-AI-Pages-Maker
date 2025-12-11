import { Box } from "@shopify/polaris";
import { ReactNode } from "react";

interface EditorLayoutProps {
  header: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * EditorLayout provides the grid-based structure for the AI Content Editor
 * - Sticky header at top
 * - Fixed sidebar on left (hidden on mobile)
 * - Scrollable content area
 */
export function EditorLayout({ header, sidebar, children }: EditorLayoutProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "240px 1fr",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Sticky Header - Full Width */}
      <div
        style={{
          gridColumn: "1 / -1",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: "var(--p-color-bg)",
          borderBottom: "1px solid var(--p-color-border)",
        }}
      >
        {header}
      </div>

      {/* Sidebar - Hidden on mobile */}
      <aside
        style={{
          gridRow: "2",
          gridColumn: "1",
          borderRight: "1px solid var(--p-color-border)",
          backgroundColor: "var(--p-color-bg-surface)",
          position: "sticky",
          top: "0",
          height: "fit-content",
          maxHeight: "calc(100vh - 60px)",
          overflowY: "auto",
        }}
        className="editor-sidebar"
      >
        {sidebar}
      </aside>

      {/* Main Content Area */}
      <main
        style={{
          gridRow: "2",
          gridColumn: "2",
          overflowY: "auto",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>

      {/* Mobile styles - hide sidebar on small screens */}
      <style>
        {`
          @media (max-width: 768px) {
            .editor-sidebar {
              display: none;
            }
            
            main {
              grid-column: 1 / -1 !important;
              padding: 16px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
