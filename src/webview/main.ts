import {
    provideVSCodeDesignSystem,
    Button,
    TextArea,
    Checkbox,
    Dropdown,
    allComponents,
    TextField
} from "@vscode/webview-ui-toolkit";

import { Compiler, Var } from "restassured-test-generator/dist/index";
import { HTTPMethod } from "restassured-test-generator/types/compiler/generator";
import { ViewState } from "./types";

import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java";

provideVSCodeDesignSystem().register(allComponents);
hljs.registerLanguage("java", java)

window.addEventListener("load", main);

const vsCode = acquireVsCodeApi();

// Syncs the current state
setInterval(updateState, 100);

// Main function that gets executed once the webview DOM loads
function main() {
    const generateTestsButton = document.getElementById("generate-tests") as Button;

    generateTestsButton?.addEventListener("click", generateTests);

    loadToView(vsCode.getState() as ViewState);
}

function generateTests() {
    let viewState = vsCode.getState() as ViewState;

    if (viewState.inputJson && viewState.inputJson.trim() !== "") {
        console.info("Generating tests...");

        try {
            const tests = Compiler.compile(viewState.inputJson, viewState.compilerOptions) as string;

            viewState = {
                ...viewState,
                outputTests: hljs.highlight("java", tests).value
            }
        } catch (error) {
            console.error(error);
            vsCode.postMessage({
                command: "showError",
                text: error.message
            });
        }

        vsCode.setState(viewState);
        loadToView(viewState);
    } else {
        vsCode.postMessage({
            command: "showWarn",
            text: "You must provide a valid JSON for the response body"
        });
    }
}

function updateState() {
    // Get previous state
    const viewState: ViewState = vsCode.getState() || {};

    // Input and output
    const inputJsonTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    viewState.inputJson = inputJsonTextArea.value;
    viewState.outputTests = outputTestsElement.textContent ?? "";

    // Compiler options
    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;

    viewState.compilerOptions ??= {};
    viewState.compilerOptions.simplify = simplifyOutputCheckbox.checked;

    // Generator options
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;

    viewState.compilerOptions.generatorOptions ??= {};

    const statusCode = parseInt(statusCodeInputTextField.value.trim());
    if (Number.isNaN(statusCode)) {
        viewState.compilerOptions.generatorOptions.statusCode = undefined;
    } else {
        viewState.compilerOptions.generatorOptions.statusCode = statusCode;
    }

    // Request endpoint configuration
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;
    const isUrlVariableCheckbox = document.getElementById("is-url-variable") as Checkbox;

    viewState.compilerOptions.generatorOptions.request ??= {};

    const url = urlInputTextField.value.trim();
    if (url != "") {
        viewState.compilerOptions.generatorOptions.request.method = httpMethodDropdown.value as HTTPMethod;
        viewState.compilerOptions.generatorOptions.request.url = isUrlVariableCheckbox.checked ? new Var(url) : url;
    } else {
        viewState.compilerOptions.generatorOptions.request.method = undefined;
        viewState.compilerOptions.generatorOptions.request.url = undefined;
    }

    // Request body
    const inputBodyTextArea = document.getElementById("input-body") as TextArea;
    const bodyIsVariableCheckbox = document.getElementById("is-body-variable") as Checkbox;

    const requestBody = inputBodyTextArea.value.trim();
    const bodyIsVariable = bodyIsVariableCheckbox.checked;

    if (requestBody && bodyIsVariable) {
        viewState.compilerOptions.generatorOptions.request.body = new Var(requestBody);
    } else if (requestBody != "") {
        viewState.compilerOptions.generatorOptions.request.body = requestBody;
    } else {
        viewState.compilerOptions.generatorOptions.request.body = undefined;
    }

    // Set state
    vsCode.setState(viewState);
}

function loadToView(viewState?: ViewState) {
    // Do nothing if there is no saved state
    if (viewState === undefined)
        return;

    // Input and output
    const inputTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    inputTextArea.value = viewState.inputJson ?? "";
    outputTestsElement.innerHTML = viewState.outputTests ?? "Your tests will appear here";

    // Compiler options
    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;
    simplifyOutputCheckbox.checked = viewState.compilerOptions?.simplify ?? true;

    // Generator options
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;
    statusCodeInputTextField.value = viewState.compilerOptions?.generatorOptions?.statusCode?.toString() ?? "";

    // Request specification
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;

    httpMethodDropdown.value = viewState.compilerOptions?.generatorOptions?.request?.method || "GET";
    const urlInput = viewState.compilerOptions?.generatorOptions?.request?.url;
    if (viewState.compilerOptions?.generatorOptions?.request?.url instanceof Var) {
        urlInputTextField.value = recreateVar(urlInput as Var).unwrap();
    } else {
        urlInputTextField.value = urlInput as string | undefined ?? "";
    }

    // Request body
    const bodyIsVariableCheckbox = document.getElementById("is-body-variable") as Checkbox;
    const inputBodyTextArea = document.getElementById("input-body") as TextArea;

    const requestBody = viewState.compilerOptions?.generatorOptions?.request?.body;
    if (viewState.compilerOptions?.generatorOptions?.request?.body instanceof Object) {
        inputBodyTextArea.value = recreateVar(requestBody as Var).unwrap();
        bodyIsVariableCheckbox.checked = true;
    } else {
        inputBodyTextArea.value = (requestBody as string | undefined) ?? "";
        bodyIsVariableCheckbox.checked = false;
    }
}

/**
 * Recreate a var from Json object.
 * This is an auxiliary function for desserialization, as the methods are lost when serializing.
 * 
 * @param namedObject The object to recreate
 * @returns 
 */
function recreateVar(namedObject: { name: string }): Var {
    return new Var(namedObject.name);
}