import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

/**
 * This class manages the state and behavior of TestGeneratorPanel webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering TestGenerator webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class TestGeneratorPanel {
    public static currentPanel: TestGeneratorPanel | undefined;
    private readonly _panel: WebviewPanel;
    private _disposables: Disposable[] = [];

    /**
     * The TestGeneratorPanel class private constructor (called only from the render method).
     *
     * @param panel A reference to the webview panel
     * @param extensionUri The URI of the directory containing the extension
     */
    private constructor(panel: WebviewPanel, extensionUri: Uri) {
        this._panel = panel;

        // Set an event listener to listen for when the panel is disposed (i.e. when the user closes
        // the panel or when the panel is closed programmatically)
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Set the HTML content for the webview panel
        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    }

    /**
     * Renders the current webview panel if it exists otherwise a new webview panel
     * will be created and displayed.
     *
     * @param extensionUri The URI of the directory containing the extension.
     */
    public static render(extensionUri: Uri) {
        if (TestGeneratorPanel.currentPanel) {
            // If the webview panel already exists reveal it
            TestGeneratorPanel.currentPanel._panel.reveal(ViewColumn.One);
        } else {
            // If a webview panel does not already exist create and show a new one
            const panel = window.createWebviewPanel(
                // Panel view type
                "testGenerator",
                // Panel title
                "RestAssured Test Generator",
                // The editor column the panel should be displayed in
                ViewColumn.One,
                // Extra panel configurations
                {
                    // Enable JavaScript in the webview
                    enableScripts: true,
                    // Restrict the webview to only load resources from the `out` directory
                    localResourceRoots: [Uri.joinPath(extensionUri, "out")],
                }
            );

            TestGeneratorPanel.currentPanel = new TestGeneratorPanel(panel, extensionUri);
        }
    }

    /**
     * Cleans up and disposes of webview resources when the webview panel is closed.
     */
    public dispose() {
        TestGeneratorPanel.currentPanel = undefined;

        // Dispose of the current webview panel
        this._panel.dispose();

        // Dispose of all disposables (i.e. commands) associated with the current webview panel
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /**
     * Defines and returns the HTML that should be rendered within the webview panel.
     *
     * @remarks This is also the place where *references* to CSS and JavaScript files
     * are created and inserted into the webview HTML.
     *
     * @param webview A reference to the extension webview
     * @param extensionUri The URI of the directory containing the extension
     * @returns A template string literal containing the HTML that should be
     * rendered within the webview panel
     */
    private _getWebviewContent(webview: Webview, extensionUri: Uri) {
        const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
        const stylesUri = getUri(webview, extensionUri, ["out", "styles.css"]);
        const nonce = getNonce();

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link href="${stylesUri}" rel="stylesheet">
            <title>RestAssured Test Generator</title>
        </head>
        <body>
            <section class="app-container">
            <section class="container">
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
            </section>
            <section class="container">
                <vscode-checkbox id="simplify-output" checked> Generate simplified tests </vscode-checkbox>
                <div><vscode-button id="generate-tests">Generate tests</vscode-button></div>
            </section>
            <section class="output-container">
                <pre id="output-tests"> Your tests will appear here...</pre>
            </section>
            </section>
            <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
        </html>
    `;
    }
}
