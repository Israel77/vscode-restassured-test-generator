export const RequestUrlSection =
    `
<div id="url-container">
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
<vscode-text-field size=3 id="status-code" placeholder="Status code"></vscode-text-field>
</div>
<vscode-text-area cols=40 id="input-json" resize="both" placeholder="Insert your JSON here" autofocus></vscode-text-area>
`