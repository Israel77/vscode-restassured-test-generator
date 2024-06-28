export const RequestUrlSection =
    `
<div class="h-container">
    <vscode-dropdown id="http-method">
        <vscode-option>GET</vscode-option>
        <vscode-option>POST</vscode-option>
        <vscode-option>PUT</vscode-option>
        <vscode-option>DELETE</vscode-option>
        <vscode-option>PATCH</vscode-option>
        <vscode-option>HEAD</vscode-option>
        <vscode-option>OPTIONS</vscode-option>
    </vscode-dropdown>
    <vscode-text-field id="input-url" placeholder="URL"></vscode-text-field>
</div>
`