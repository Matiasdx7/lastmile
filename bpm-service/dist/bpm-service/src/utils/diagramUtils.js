"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDiagramHtml = generateDiagramHtml;
function generateDiagramHtml(diagram, title) {
    const mermaidCode = convertToMermaidSyntax(diagram);
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .diagram-container {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #fafafa;
        }
        .metrics {
            margin-top: 20px;
            padding: 15px;
            background-color: #e7f3ff;
            border-left: 4px solid #007bff;
            border-radius: 4px;
        }
        .bottleneck {
            color: #d9534f;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        
        <div class="diagram-container">
            <div class="mermaid">
${mermaidCode}
            </div>
        </div>
        
        <div class="metrics">
            <h3>Process Metrics</h3>
            <ul>
                ${generateMetricsHtml(diagram)}
            </ul>
        </div>
    </div>

    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
        
        // Add click handlers for nodes
        document.addEventListener('DOMContentLoaded', function() {
            const nodes = document.querySelectorAll('.node');
            nodes.forEach(node => {
                node.addEventListener('click', function() {
                    const nodeId = this.id.replace('flowchart-', '');
                    showNodeDetails(nodeId);
                });
            });
        });
        
        function showNodeDetails(nodeId) {
            fetch(\`/api/bpm/nodes/\${nodeId}\`)
                .then(response => response.json())
                .then(data => {
                    alert(\`Node: \${data.name}\\nType: \${data.type}\\nAverage Time: \${data.metrics?.averageTime} min\\nCount: \${data.metrics?.count}\\nError Rate: \${data.metrics?.errorRate}%\`);
                })
                .catch(error => console.error('Error fetching node details:', error));
        }
    </script>
</body>
</html>
  `;
}
function convertToMermaidSyntax(diagram) {
    let mermaid = 'graph LR\n';
    for (const node of diagram.nodes) {
        let style = '';
        if (node.status === 'active') {
            style = ', style fill:#f96, stroke:#333, stroke-width:2px';
        }
        else if (node.status === 'completed') {
            style = ', style fill:#9f6, stroke:#333, stroke-width:1px';
        }
        else if (node.status === 'in-progress') {
            style = ', style fill:#ff9, stroke:#333, stroke-width:1px';
        }
        else if (node.metrics?.bottleneck) {
            style = ', style fill:#f66, stroke:#333, stroke-width:2px';
        }
        let label = node.name;
        if (node.count !== undefined) {
            label += `<br/>(${node.count})`;
        }
        mermaid += `    ${node.id}[${label}${style}]\n`;
    }
    for (const edge of diagram.edges) {
        let label = edge.label ? `|${edge.label}|` : '';
        mermaid += `    ${edge.source} -->${label} ${edge.target}\n`;
    }
    return mermaid;
}
function generateMetricsHtml(diagram) {
    let html = '';
    for (const node of diagram.nodes) {
        if (node.type === 'main' && node.metrics) {
            const bottleneckClass = node.metrics.bottleneck ? 'bottleneck' : '';
            html += `<li class="${bottleneckClass}">
        ${node.name}: 
        ${node.metrics.averageTime} min avg time, 
        ${node.metrics.count} orders, 
        ${node.metrics.errorRate}% error rate
        ${node.metrics.bottleneck ? ' (BOTTLENECK)' : ''}
      </li>`;
        }
    }
    return html;
}
//# sourceMappingURL=diagramUtils.js.map