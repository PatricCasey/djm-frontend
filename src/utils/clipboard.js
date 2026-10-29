// navigator.clipboard only exists in secure contexts (HTTPS, or http://localhost).
// On a plain-HTTP deployment it's undefined, so calling it directly throws.
// Fall back to the older execCommand('copy') trick, which still works over HTTP.
export function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textarea);
    }

    return Promise.resolve();
}
