import { Disposable, Webview, WebviewPanel, window, Uri, ViewColumn } from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

import { RequestUrlSection } from "./request/RequestUrlSection";

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

        // Set an event listener to listen for messages passed from the webview context
        this._setWebviewMessageListener(this._panel.webview);
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
        const highlightStyleUri = getUri(webview, extensionUri, ["out", "highlight-theme.css"]);
        const nonce = getNonce();

        return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <link href="${stylesUri}" rel="stylesheet">
            <link href="${highlightStyleUri}" rel="stylesheet">
            <title>RestAssured Test Generator</title>
        </head>
        <body>
        <section class="panel-container">
            <vscode-panels>
                <vscode-panel-tab id="tab-1">REQUEST</vscode-panel-tab>
                <vscode-panel-tab id="tab-2">RESPONSE</vscode-panel-tab>
                <vscode-panel-view>
                    <section class="v-container">
                        <h1>Request method and url</h1>
                        ${RequestUrlSection}
                        <h1>Request body</h1>
                        <vscode-text-area cols=40 id="input-body" resize="both" placeholder="Insert your request body" autofocus></vscode-text-area>
                        <vscode-checkbox id="is-body-variable"> Mark body as variable</vscode-checkbox>
                        <h1>Request ContentType</h1>
                        <vscode-text-field cols=40 id="input-content-type" resize="both" placeholder="Insert the contentType"></vscode-text-field>
                        <vscode-checkbox id="is-content-type-variable">Mark contentType as variable</vscode-checkbox>
                    </section>
                </vscode-panel-view>
                <vscode-panel-view>
                    <section class="v-container">
                        <h1>JSON response body (mandatory)</h1>
                        <vscode-text-area cols=40 id="input-json" resize="both" placeholder="Insert your JSON here" autofocus></vscode-text-area>
                        <h1>Response status code</h1>
                        <vscode-text-field size=3 id="status-code" placeholder="Status code"></vscode-text-field>
                        <h1>Options</h1>
                        <vscode-checkbox id="simplify-output" checked> Generate simplified tests </vscode-checkbox>
                    </section>
                </vscode-panel-view>
            </vscode-panels>
            <section class="output-container">
                <div><vscode-button id="generate-tests">Generate tests</vscode-button></div>
                <pre id="output-tests"> Your tests will appear here...</pre>
            </section>
        </section>

        <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
        </html>
    `;
    }

    /**
     * Sets up an event listener to listen for messages passed from the webview context and
     * executes code based on the message that is received.
     *
     * @param webview A reference to the extension webview
     */
    private _setWebviewMessageListener(webview: Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const text = message.text;

                console.log("Received message from webview: ", message);
                switch (command) {
                    case "showError":
                        console.error(text);
                        window.showErrorMessage(text);
                        return;
                    case "showWarn":
                        console.warn(text);
                        window.showWarningMessage(text);
                        return;
                    case "showInfo":
                        console.info(text);
                        window.showInformationMessage(text);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }
}
