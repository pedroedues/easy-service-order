# Vendored libraries

Loaded on demand (only when generating a PDF) via a local `<script>` tag
instead of a CDN, so PDF generation doesn't depend on an external network
request that ad blockers, corporate proxies, or CDN outages can break.

- `jspdf.umd.min.js` — jsPDF 2.5.2 (MIT), from `jspdf@2.5.2` on npm.
- `jspdf.plugin.autotable.min.js` — jsPDF-AutoTable 3.8.4 (MIT), from
  `jspdf-autotable@3.8.4` on npm.

Unmodified upstream builds. To upgrade, replace both files with the matching
`dist/jspdf.umd.min.js` / `dist/jspdf.plugin.autotable.min.js` from a newer
npm release and update the version numbers here.
