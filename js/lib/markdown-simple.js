/**
 * Simple Markdown Parser - A lightweight markdown to HTML converter
 * This is a fallback for when external libraries can't be loaded
 */
(function() {
    'use strict';

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function parseMarkdown(markdown) {
        if (!markdown) return '';
        
        let html = markdown;
        
        // Headers (H1-H6)
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
        
        // Bold and Italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');
        
        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // Images ![alt](url)
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Code blocks (simple version)
        html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
        
        // Line breaks and paragraphs
        const lines = html.split('\n');
        let inList = false;
        let inOrderedList = false;
        let result = [];
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Unordered lists
            if (line.match(/^\s*[-*+]\s+(.+)$/)) {
                if (!inList) {
                    result.push('<ul>');
                    inList = true;
                }
                line = line.replace(/^\s*[-*+]\s+(.+)$/, '<li>$1</li>');
                result.push(line);
            }
            // Ordered lists
            else if (line.match(/^\s*\d+\.\s+(.+)$/)) {
                if (!inOrderedList) {
                    result.push('<ol>');
                    inOrderedList = true;
                }
                line = line.replace(/^\s*\d+\.\s+(.+)$/, '<li>$1</li>');
                result.push(line);
            }
            // Blockquotes
            else if (line.match(/^>\s+(.+)$/)) {
                line = line.replace(/^>\s+(.+)$/, '<blockquote>$1</blockquote>');
                result.push(line);
            }
            // Regular paragraphs
            else {
                if (inList) {
                    result.push('</ul>');
                    inList = false;
                }
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                
                if (line.trim() !== '' && !line.match(/^<h[1-6]>/) && !line.match(/^<pre>/) && !line.match(/^<\/pre>/)) {
                    result.push('<p>' + line + '</p>');
                } else {
                    result.push(line);
                }
            }
        }
        
        // Close any open lists
        if (inList) result.push('</ul>');
        if (inOrderedList) result.push('</ol>');
        
        return result.join('\n');
    }

    // Export to global scope
    window.marked = {
        parse: parseMarkdown
    };

    // Simple DOMPurify fallback (basic sanitization)
    window.DOMPurify = {
        sanitize: function(html) {
            // Basic sanitization - remove script tags and event handlers
            let clean = html;
            clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            clean = clean.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
            clean = clean.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
            return clean;
        }
    };

})();
