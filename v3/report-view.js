// ═══════════════════════════════════════════════════════════════════════════
// V3 REPORT VIEW — Opens analysis results in a printable report window
// ═══════════════════════════════════════════════════════════════════════════
//
// Uses V3RunAnalysis.generateReportHTML() which re-runs the full analysis
// pipeline and builds a self-contained HTML document. The report respects
// the current mode (planning vs engineering) and includes all mode-aware
// rendering logic.
//
// Usage: V3ReportView.open()
//
// ═══════════════════════════════════════════════════════════════════════════

(function (global) {

  function open() {
    // Generate report HTML using current project state
    var result = V3RunAnalysis.generateReportHTML();

    if (!result.ok) {
      alert('Cannot generate report: ' + result.error);
      return;
    }

    // Open a new window and write the report document
    var reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      openReportFallback(result.html);
      return;
    }

    reportWindow.document.open();
    reportWindow.document.write(result.html);
    reportWindow.document.close();
  }

  function openReportFallback(html) {
    var blob = new Blob([html], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    window.location.href = url;
  }

  global.V3ReportView = {
    open: open
  };

})(window);
