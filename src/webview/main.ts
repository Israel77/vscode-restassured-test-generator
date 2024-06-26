import {
    provideVSCodeDesignSystem,
    Button,
    TextArea,
    Checkbox,
    Dropdown,
    allComponents,
    TextField
} from "@vscode/webview-ui-toolkit";

import { Compiler, VarOrValue } from "restassured-test-generator";
import { CompilerOptions } from "restassured-test-generator/types/compiler/compiler"
import { HTTPMethod } from "restassured-test-generator/types/compiler/generator";
import { ViewState } from "./types";

import hljs from "highlight.js/lib/core";
import java from "highlight.js/lib/languages/java"

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

    loadStateToView();
}


function generateTests() {
    const viewState = vsCode.getState() as ViewState;

    if (viewState.inputJson) {
        console.log("Generating tests...");

        const tests = Compiler.compile(viewState.inputJson, viewState.compilerOptions) as string;
        vsCode.setState({
            ...viewState,
            outputTests: hljs.highlight("java", tests).value
        })
        console.log("Tests generated!");
        loadStateToView();
    }
}

function updateState() {
    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;
    const inputTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    const viewState: ViewState = vsCode.getState() || {};

    viewState.inputJson = inputTextArea.value ?? "";
    viewState.outputTests = outputTestsElement.textContent ?? "";

    viewState.compilerOptions ??= {};
    viewState.compilerOptions.simplify = simplifyOutputCheckbox.checked;

    viewState.compilerOptions.generatorOptions ??= {};
    viewState.compilerOptions.generatorOptions.statusCode = parseInt(statusCodeInputTextField.value.trim());

    viewState.compilerOptions.generatorOptions.request ??= {};
    viewState.compilerOptions.generatorOptions.request.method = httpMethodDropdown.value as HTTPMethod;
    viewState.compilerOptions.generatorOptions.request.url = new VarOrValue(urlInputTextField.value.trim()).asValue()

    vsCode.setState(viewState);
}

function loadStateToView() {
    const viewState = vsCode.getState() as ViewState | undefined;

    if (viewState === undefined)
        return;

    const simplifyOutputCheckbox = document.getElementById("simplify-output") as Checkbox;
    const httpMethodDropdown = document.getElementById("http-method") as Dropdown;
    const urlInputTextField = document.getElementById("input-url") as TextField;
    const statusCodeInputTextField = document.getElementById("status-code") as TextField;
    const inputTextArea = document.getElementById("input-json") as TextArea;
    const outputTestsElement = document.getElementById("output-tests") as HTMLPreElement;

    inputTextArea.value = viewState.inputJson ?? "";
    outputTestsElement.innerHTML = viewState.outputTests ?? "Your tests will appear here";

    simplifyOutputCheckbox.checked = viewState.compilerOptions?.simplify ?? true;

    statusCodeInputTextField.value = viewState.compilerOptions?.generatorOptions?.statusCode?.toString() ?? "";

    httpMethodDropdown.value = viewState.compilerOptions?.generatorOptions?.request?.method || "GET";

    urlInputTextField.value = viewState.compilerOptions?.generatorOptions?.request?.url?.asVar().unwrap() ?? "";
}